import "server-only";

import { createSupabaseAdminClient } from "@/adapters/supabase/client-admin";
import type { JsonObject, ParsedInboundMessage } from "@/adapters/whatsapp/webhook-payload";

type ChannelContext = {
  accountId: string;
  channelId: string;
};

type ContactRow = {
  id: string;
};

type ConversationRow = {
  id: string;
};

type MessageRow = {
  conversation_id: string;
  id: string;
};

type NormalizedInboundMessageResult = {
  conversationId: string;
  messageId: string;
};

function normalizePhone(phone: string | null): string | null {
  if (!phone) {
    return null;
  }

  const digits = phone.replace(/[^\d+]/g, "");

  if (!digits) {
    return null;
  }

  return digits.startsWith("+") ? digits : `+${digits}`;
}

function buildContactMetadata(message: ParsedInboundMessage): JsonObject {
  return {
    whatsapp: {
      profile_name: message.profileName,
    },
  };
}

function resolveSentAt(timestamp: string | null): string {
  if (!timestamp) {
    return new Date().toISOString();
  }

  const numericTimestamp = Number(timestamp);

  if (!Number.isNaN(numericTimestamp) && numericTimestamp > 0) {
    return new Date(numericTimestamp * 1000).toISOString();
  }

  const parsedDate = new Date(timestamp);

  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString();
  }

  return new Date().toISOString();
}

async function resolveOrCreateContact(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  context: ChannelContext,
  message: ParsedInboundMessage,
): Promise<ContactRow | null> {
  const phoneE164 = normalizePhone(message.phone);

  if (!phoneE164) {
    return null;
  }

  const { data, error } = await admin
    .from("contacts")
    .upsert(
      {
        account_id: context.accountId,
        display_name: message.profileName,
        metadata: buildContactMetadata(message),
        phone_e164: phoneE164,
        wa_contact_id: message.waContactId,
      },
      {
        ignoreDuplicates: false,
        onConflict: "account_id,phone_e164",
      },
    )
    .select("id")
    .single<ContactRow>();

  if (error) {
    throw new Error("No pudimos resolver el contacto del mensaje entrante.");
  }

  return data;
}

async function resolveOrCreateConversation(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  context: ChannelContext,
  contactId: string,
): Promise<ConversationRow> {
  const { data: openConversation, error: openConversationError } = await admin
    .from("conversations")
    .select("id")
    .eq("account_id", context.accountId)
    .eq("channel_id", context.channelId)
    .eq("contact_id", contactId)
    .eq("status", "open")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle<ConversationRow>();

  if (openConversationError) {
    throw new Error("No pudimos comprobar la conversación activa.");
  }

  if (openConversation) {
    return openConversation;
  }

  const { data: existingConversation, error: existingConversationError } =
    await admin
      .from("conversations")
      .select("id")
      .eq("account_id", context.accountId)
      .eq("channel_id", context.channelId)
      .eq("contact_id", contactId)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle<ConversationRow>();

  if (existingConversationError) {
    throw new Error("No pudimos comprobar la conversación existente.");
  }

  if (existingConversation) {
    return existingConversation;
  }

  const { data: conversation, error: conversationError } = await admin
    .from("conversations")
    .insert({
      account_id: context.accountId,
      channel_id: context.channelId,
      contact_id: contactId,
      status: "open",
    })
    .select("id")
    .single<ConversationRow>();

  if (conversationError) {
    throw new Error("No pudimos crear la conversación inicial.");
  }

  return conversation;
}

async function resolveOrCreateMessage(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  context: ChannelContext,
  contactId: string,
  conversationId: string,
  message: ParsedInboundMessage,
  sentAt: string,
): Promise<MessageRow> {
  const { data: existingMessage, error: existingMessageError } = await admin
    .from("messages")
    .select("id, conversation_id")
    .eq("wa_message_id", message.messageId)
    .maybeSingle<MessageRow>();

  if (existingMessageError) {
    throw new Error("No pudimos comprobar si el mensaje ya existía.");
  }

  if (existingMessage) {
    return existingMessage;
  }

  const { data: insertedMessage, error: insertMessageError } = await admin
    .from("messages")
    .insert({
      account_id: context.accountId,
      body: message.body,
      channel_id: context.channelId,
      contact_id: contactId,
      conversation_id: conversationId,
      direction: "inbound",
      payload: message.payload,
      sent_at: sentAt,
      status: "received",
      type: message.type,
      wa_message_id: message.messageId,
    })
    .select("id, conversation_id")
    .single<MessageRow>();

  if (insertMessageError) {
    if (insertMessageError.code === "23505") {
      const { data: duplicatedMessage, error: duplicatedMessageError } =
        await admin
          .from("messages")
          .select("id, conversation_id")
          .eq("wa_message_id", message.messageId)
          .maybeSingle<MessageRow>();

      if (duplicatedMessageError || !duplicatedMessage) {
        throw new Error("No pudimos resolver el mensaje duplicado.");
      }

      return duplicatedMessage;
    }

    throw new Error("No pudimos registrar el mensaje inbound.");
  }

  return insertedMessage;
}

async function touchConversation(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  conversationId: string,
  sentAt: string,
): Promise<void> {
  const { error } = await admin
    .from("conversations")
    .update({
      last_message_at: sentAt,
    })
    .eq("id", conversationId);

  if (error) {
    throw new Error("No pudimos actualizar la conversación.");
  }
}

export async function normalizeInboundMessage(
  context: ChannelContext,
  message: ParsedInboundMessage,
): Promise<NormalizedInboundMessageResult | null> {
  const admin = createSupabaseAdminClient();
  const contact = await resolveOrCreateContact(admin, context, message);

  if (!contact) {
    return null;
  }

  const sentAt = resolveSentAt(message.sentAt);
  const conversation = await resolveOrCreateConversation(
    admin,
    context,
    contact.id,
  );
  const inboundMessage = await resolveOrCreateMessage(
    admin,
    context,
    contact.id,
    conversation.id,
    message,
    sentAt,
  );

  await touchConversation(admin, inboundMessage.conversation_id, sentAt);

  return {
    conversationId: inboundMessage.conversation_id,
    messageId: inboundMessage.id,
  };
}
