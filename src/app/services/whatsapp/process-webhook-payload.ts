import "server-only";

import {
  parseInboundMessage,
  parseStatusUpdate,
  type WhatsappWebhookPayload,
} from "@/adapters/whatsapp/webhook-payload";
import { applyMessageStatus } from "@/app/services/whatsapp/apply-message-status";
import { normalizeInboundMessage } from "@/app/services/whatsapp/normalize-inbound-message";

type ChannelContext = {
  accountId: string;
  channelId: string;
};

type ProcessedWebhookPayloadResult = {
  conversationId: string | null;
  messageId: string | null;
};

export async function processWhatsappWebhookPayload(
  payload: WhatsappWebhookPayload,
  channel: ChannelContext | null,
): Promise<ProcessedWebhookPayloadResult> {
  let linkedConversationId: string | null = null;
  let linkedMessageId: string | null = null;

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;

      if (channel && value?.messages) {
        const primaryContact = value.contacts?.[0];

        for (const message of value.messages) {
          const inboundMessage = parseInboundMessage(message, primaryContact);

          if (!inboundMessage) {
            continue;
          }

          const normalizedMessage = await normalizeInboundMessage(channel, inboundMessage);

          console.log("Inbound message:", message.id);

          if (!normalizedMessage) {
            continue;
          }

          linkedConversationId ??= normalizedMessage.conversationId;
          linkedMessageId ??= normalizedMessage.messageId;
        }
      }

      if (value?.statuses) {
        for (const status of value.statuses) {
          const statusUpdate = parseStatusUpdate(status);

          if (!statusUpdate) {
            continue;
          }

          console.log("Status update:", status.id);

          const appliedStatus = await applyMessageStatus(statusUpdate);

          if (!appliedStatus) {
            continue;
          }

          linkedConversationId ??= appliedStatus.conversationId;
          linkedMessageId ??= appliedStatus.messageId;
        }
      }
    }
  }

  return {
    conversationId: linkedConversationId,
    messageId: linkedMessageId,
  };
}
