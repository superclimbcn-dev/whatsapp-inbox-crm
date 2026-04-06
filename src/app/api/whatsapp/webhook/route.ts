import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/adapters/supabase/client-admin";
import {
  isWhatsappWebhookPayload,
  parseWhatsappWebhookPayload,
  type WhatsappWebhookPayload,
} from "@/adapters/whatsapp/webhook-payload";
import { processWhatsappWebhookPayload } from "@/app/services/whatsapp/process-webhook-payload";
import { readWhatsappWebhookEnv } from "@/lib/env";

type ChannelLookup = {
  account_id: string;
  id: string;
};

type WaEventLookup = {
  conversation_id: string | null;
  id: string;
  message_id: string | null;
};

export const dynamic = "force-dynamic";

async function linkProcessedEvent(
  payload: WhatsappWebhookPayload,
  eventId: string,
  channel: ChannelLookup,
): Promise<void> {
  const admin = createSupabaseAdminClient();
  const processedPayload = await processWhatsappWebhookPayload(
    payload,
    {
      accountId: channel.account_id,
      channelId: channel.id,
    },
  );

  if (!processedPayload.conversationId && !processedPayload.messageId) {
    return;
  }

  await admin
    .from("wa_events")
    .update({
      conversation_id: processedPayload.conversationId,
      message_id: processedPayload.messageId,
    })
    .eq("id", eventId);
}

async function processDuplicateEvent(
  payload: WhatsappWebhookPayload,
  eventId: string,
  channel: ChannelLookup | null,
  parsedPayload: ReturnType<typeof parseWhatsappWebhookPayload>,
): Promise<void> {
  if (channel) {
    await linkProcessedEvent(payload, eventId, channel);
    return;
  }

  if (parsedPayload.eventType !== "status") {
    return;
  }

  await processWhatsappWebhookPayload(payload, null);
}

export async function GET(request: Request): Promise<Response> {
  const verifyToken = readWhatsappWebhookEnv().WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  return NextResponse.json(
    {
      error: "No pudimos verificar el webhook.",
    },
    {
      status: 403,
    },
  );
}

export async function POST(request: Request): Promise<Response> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "El payload recibido no es un JSON válido.",
      },
      {
        status: 400,
      },
    );
  }

  if (!isWhatsappWebhookPayload(payload)) {
    return NextResponse.json(
      {
        error: "El payload del webhook no tiene el formato esperado.",
      },
      {
        status: 400,
      },
    );
  }

  const admin = createSupabaseAdminClient();
  const parsedPayload = parseWhatsappWebhookPayload(payload);

  let channel: ChannelLookup | null = null;

  if (parsedPayload.phoneNumberId) {
    const { data } = await admin
      .from("channels")
      .select("id, account_id")
      .eq("phone_number_id", parsedPayload.phoneNumberId)
      .maybeSingle<ChannelLookup>();

    channel = data;
  }

  if (parsedPayload.providerEventId) {
    const { data: existingEvent } = await admin
      .from("wa_events")
      .select("id, conversation_id, message_id")
      .eq("provider_event_id", parsedPayload.providerEventId)
      .maybeSingle<WaEventLookup>();

    if (existingEvent) {
      if (existingEvent.message_id === null || existingEvent.conversation_id === null) {
        await processDuplicateEvent(payload, existingEvent.id, channel, parsedPayload);
      }

      return NextResponse.json(
        {
          ok: true,
          duplicated: true,
        },
        {
          status: 200,
        },
      );
    }
  }

  const { data: insertedEvent, error } = await admin
    .from("wa_events")
    .insert({
      account_id: channel?.account_id ?? null,
      channel_id: channel?.id ?? null,
      event_type: parsedPayload.eventType,
      payload,
      provider_event_id: parsedPayload.providerEventId,
      received_at: new Date().toISOString(),
    })
    .select("id")
    .single<{ id: string }>();

  if (error && parsedPayload.providerEventId && error.code === "23505") {
    return NextResponse.json(
      {
        ok: true,
        duplicated: true,
      },
      {
        status: 200,
      },
    );
  }

  if (error) {
    return NextResponse.json(
      {
        error: "No pudimos registrar el evento recibido.",
      },
      {
        status: 500,
      },
    );
  }

  if (
    insertedEvent &&
    channel
  ) {
    await linkProcessedEvent(payload, insertedEvent.id, channel);
  }

  if (
    insertedEvent &&
    parsedPayload.eventType === "status" &&
    !channel
  ) {
    await processWhatsappWebhookPayload(payload, null);
  }

  return NextResponse.json(
    {
      ok: true,
    },
    {
      status: 200,
    },
  );
}
