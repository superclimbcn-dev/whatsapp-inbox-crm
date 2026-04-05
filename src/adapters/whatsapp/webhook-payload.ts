import { createHash } from "node:crypto";

type JsonPrimitive = boolean | null | number | string;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

type WhatsappMessage = {
  from?: string;
  id?: string;
  text?: {
    body?: string;
  };
  timestamp?: string;
  type?: string;
};

type WhatsappContact = {
  profile?: {
    name?: string;
  };
  wa_id?: string;
};

type WhatsappStatus = {
  id?: string;
  recipient_id?: string;
  status?: string;
  timestamp?: string;
};

type WhatsappMetadata = {
  phone_number_id?: string;
};

type WhatsappValue = {
  contacts?: WhatsappContact[];
  messages?: WhatsappMessage[];
  metadata?: WhatsappMetadata;
  statuses?: WhatsappStatus[];
};

type WhatsappChange = {
  field?: string;
  value?: WhatsappValue;
};

type WhatsappEntry = {
  changes?: WhatsappChange[];
  id?: string;
};

type WhatsappWebhookPayload = JsonObject & {
  entry?: WhatsappEntry[];
  object?: string;
};

export type ParsedInboundMessage = {
  body: string | null;
  messageId: string;
  payload: JsonObject;
  phone: string | null;
  profileName: string | null;
  sentAt: string | null;
  type:
    | "audio"
    | "document"
    | "image"
    | "interactive"
    | "system"
    | "text"
    | "unknown"
    | "video";
  waContactId: string | null;
};

export type ParsedWhatsappStatus = {
  deliveredAt: string | null;
  messageId: string;
  readAt: string | null;
  status: "delivered" | "failed" | "read" | "sent";
};

export type ParsedWhatsappWebhook = {
  eventType: "message" | "status" | "unknown";
  inboundMessage: ParsedInboundMessage | null;
  phoneNumberId: string | null;
  providerEventId: string | null;
  statusUpdate: ParsedWhatsappStatus | null;
};

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isWhatsappWebhookPayload(
  value: unknown,
): value is WhatsappWebhookPayload {
  return isJsonObject(value) && Array.isArray(value.entry);
}

function hashPayload(payload: WhatsappWebhookPayload): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function inferMessageType(
  messageType: string | undefined,
): ParsedInboundMessage["type"] {
  switch (messageType) {
    case "audio":
    case "document":
    case "image":
    case "interactive":
    case "system":
    case "text":
    case "video":
      return messageType;
    default:
      return "unknown";
  }
}

function inferStatusValue(
  status: string | undefined,
): ParsedWhatsappStatus["status"] | null {
  switch (status) {
    case "sent":
    case "delivered":
    case "read":
    case "failed":
      return status;
    default:
      return null;
  }
}

function resolveStatusTimestamp(timestamp: string | undefined): string | null {
  if (!timestamp) {
    return null;
  }

  const numericTimestamp = Number(timestamp);

  if (!Number.isNaN(numericTimestamp) && numericTimestamp > 0) {
    return new Date(numericTimestamp * 1000).toISOString();
  }

  const parsedDate = new Date(timestamp);

  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString();
  }

  return null;
}

export function parseWhatsappWebhookPayload(
  payload: WhatsappWebhookPayload,
): ParsedWhatsappWebhook {
  const firstEntry = payload.entry?.[0];
  const firstChange = firstEntry?.changes?.[0];
  const value = firstChange?.value;
  const firstContact = value?.contacts?.[0];
  const firstStatus = value?.statuses?.[0];
  const firstMessage = value?.messages?.[0];
  const phoneNumberId = value?.metadata?.phone_number_id ?? null;

  if (firstStatus?.id) {
    const resolvedStatus = inferStatusValue(firstStatus.status);
    const statusTimestamp = resolveStatusTimestamp(firstStatus.timestamp);

    return {
      eventType: "status",
      inboundMessage: null,
      phoneNumberId,
      providerEventId: `status:${firstStatus.id}:${firstStatus.status ?? "unknown"}:${firstStatus.timestamp ?? "0"}`,
      statusUpdate: resolvedStatus
        ? {
            deliveredAt:
              resolvedStatus === "delivered" ? statusTimestamp : null,
            messageId: firstStatus.id,
            readAt: resolvedStatus === "read" ? statusTimestamp : null,
            status: resolvedStatus,
          }
        : null,
    };
  }

  if (firstMessage?.id) {
    return {
      eventType: "message",
      inboundMessage: {
        body: firstMessage.text?.body ?? null,
        messageId: firstMessage.id,
        payload: isJsonObject(firstMessage) ? firstMessage : {},
        phone: firstContact?.wa_id ?? firstMessage.from ?? null,
        profileName: firstContact?.profile?.name ?? null,
        sentAt: firstMessage.timestamp ?? null,
        type: inferMessageType(firstMessage.type),
        waContactId: firstContact?.wa_id ?? null,
      },
      phoneNumberId,
      providerEventId: `message:${firstMessage.id}`,
      statusUpdate: null,
    };
  }

  if (firstEntry?.id || firstChange?.field || phoneNumberId) {
    return {
      eventType: "unknown",
      inboundMessage: null,
      phoneNumberId,
      providerEventId: `unknown:${firstEntry?.id ?? "entry"}:${firstChange?.field ?? "field"}:${phoneNumberId ?? hashPayload(payload).slice(0, 16)}`,
      statusUpdate: null,
    };
  }

  return {
    eventType: "unknown",
    inboundMessage: null,
    phoneNumberId,
    providerEventId: null,
    statusUpdate: null,
  };
}
