import "server-only";

import { createSupabaseAdminClient } from "@/adapters/supabase/client-admin";
import type { ParsedWhatsappStatus } from "@/adapters/whatsapp/webhook-payload";

type MessageLookup = {
  conversation_id: string;
  id: string;
};

export type AppliedMessageStatus = {
  conversationId: string;
  messageId: string;
};

export async function applyMessageStatus(
  statusUpdate: ParsedWhatsappStatus,
): Promise<AppliedMessageStatus | null> {
  const admin = createSupabaseAdminClient();
  const { data: message, error: messageError } = await admin
    .from("messages")
    .select("id, conversation_id")
    .eq("wa_message_id", statusUpdate.messageId)
    .maybeSingle<MessageLookup>();

  if (messageError) {
    throw new Error("No pudimos localizar el mensaje para actualizar su estado.");
  }

  if (!message) {
    return null;
  }

  const updatePayload: {
    delivered_at?: string;
    read_at?: string;
    status: ParsedWhatsappStatus["status"];
  } = {
    status: statusUpdate.status,
  };

  if (statusUpdate.status === "delivered" && statusUpdate.deliveredAt) {
    updatePayload.delivered_at = statusUpdate.deliveredAt;
  }

  if (statusUpdate.status === "read") {
    if (statusUpdate.deliveredAt ?? statusUpdate.readAt) {
      updatePayload.delivered_at =
        statusUpdate.deliveredAt ?? statusUpdate.readAt ?? undefined;
    }

    if (statusUpdate.readAt) {
      updatePayload.read_at = statusUpdate.readAt;
    }
  }

  const { error: updateError } = await admin
    .from("messages")
    .update(updatePayload)
    .eq("id", message.id);

  if (updateError) {
    throw new Error("No pudimos actualizar el estado del mensaje.");
  }

  return {
    conversationId: message.conversation_id,
    messageId: message.id,
  };
}
