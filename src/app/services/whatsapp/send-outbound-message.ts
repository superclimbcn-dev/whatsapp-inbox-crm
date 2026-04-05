import "server-only";

import { createSupabaseAdminClient } from "@/adapters/supabase/client-admin";
import { createSupabaseServerClient } from "@/adapters/supabase/client-server";
import { ensureUserContext } from "@/app/services/auth/ensure-user-context";
import { readWhatsappSendEnv } from "@/lib/env";

type ConversationRow = {
  account_id: string;
  channel_id: string | null;
  contact_id: string | null;
  id: string;
};

type ContactRow = {
  id: string;
  phone_e164: string;
};

type ChannelRow = {
  id: string;
  phone_number_id: string | null;
};

type MetaSendResponse = {
  messages?: Array<{
    id?: string;
  }>;
};

export type SendOutboundMessageInput = {
  conversationId: string;
  text: string;
};

export async function sendOutboundMessage({
  conversationId,
  text,
}: SendOutboundMessageInput): Promise<void> {
  const trimmedText = text.trim();

  if (!trimmedText) {
    throw new Error("Escribe un mensaje antes de enviarlo.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Tu sesión ya no es válida. Vuelve a iniciar sesión.");
  }

  const internalUser = await ensureUserContext(user);
  const admin = createSupabaseAdminClient();
  const { data: conversation, error: conversationError } = await admin
    .from("conversations")
    .select("id, account_id, contact_id, channel_id")
    .eq("id", conversationId)
    .eq("account_id", internalUser.account_id)
    .maybeSingle<ConversationRow>();

  if (conversationError || !conversation) {
    throw new Error("No pudimos encontrar la conversación solicitada.");
  }

  if (!conversation.contact_id || !conversation.channel_id) {
    throw new Error("La conversación no tiene un contacto o canal válido.");
  }

  const [{ data: contact, error: contactError }, { data: channel, error: channelError }] =
    await Promise.all([
      admin
        .from("contacts")
        .select("id, phone_e164")
        .eq("id", conversation.contact_id)
        .maybeSingle<ContactRow>(),
      admin
        .from("channels")
        .select("id, phone_number_id")
        .eq("id", conversation.channel_id)
        .maybeSingle<ChannelRow>(),
    ]);

  if (contactError || !contact?.phone_e164) {
    throw new Error("No pudimos resolver el teléfono del contacto.");
  }

  if (channelError || !channel) {
    throw new Error("No pudimos resolver el canal de la conversación.");
  }

  const whatsappEnv = readWhatsappSendEnv();
  const phoneNumberId =
    channel.phone_number_id ?? whatsappEnv.WHATSAPP_PHONE_NUMBER_ID;
  const sentAt = new Date().toISOString();
  const graphResponse = await fetch(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${whatsappEnv.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        text: {
          body: trimmedText,
        },
        to: contact.phone_e164,
        type: "text",
      }),
    },
  );

  const graphResult =
    (await graphResponse.json().catch(() => null)) as MetaSendResponse | null;

  if (!graphResponse.ok) {
    throw new Error("No pudimos enviar el mensaje a WhatsApp.");
  }

  const waMessageId = graphResult?.messages?.[0]?.id ?? null;
  const { error: insertMessageError } = await admin.from("messages").insert({
    account_id: conversation.account_id,
    body: trimmedText,
    channel_id: channel.id,
    contact_id: contact.id,
    conversation_id: conversation.id,
    direction: "outbound",
    payload: {
      provider_response: graphResult ?? {},
    },
    sent_at: sentAt,
    status: "sent",
    type: "text",
    wa_message_id: waMessageId,
  });

  if (insertMessageError) {
    throw new Error("No pudimos guardar el mensaje enviado.");
  }

  const { error: updateConversationError } = await admin
    .from("conversations")
    .update({
      last_message_at: sentAt,
    })
    .eq("id", conversation.id);

  if (updateConversationError) {
    throw new Error("No pudimos actualizar la conversación enviada.");
  }
}
