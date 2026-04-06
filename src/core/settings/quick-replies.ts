export const QUICK_REPLY_IDS = [
  "photos",
  "location",
  "service",
  "measurements",
] as const;

export type QuickReplyId = (typeof QUICK_REPLY_IDS)[number];

export type QuickReply = {
  id: QuickReplyId;
  isActive: boolean;
  label: string;
  text: string;
};

type QuickReplyRecord = Record<QuickReplyId, QuickReply>;

type QuickRepliesMetadataItem = {
  id?: unknown;
  is_active?: unknown;
  label?: unknown;
  text?: unknown;
};

const QUICK_REPLY_DEFAULTS: QuickReplyRecord = {
  location: {
    id: "location",
    isActive: true,
    label: "Pedir ubicación",
    text: "¿Me compartes la zona o ubicación del servicio para revisar disponibilidad y presupuesto?",
  },
  measurements: {
    id: "measurements",
    isActive: true,
    label: "Medidas / cantidad",
    text: "¿Me indicas cuántas piezas son y las medidas aproximadas para calcular mejor el presupuesto?",
  },
  photos: {
    id: "photos",
    isActive: true,
    label: "Pedir fotos",
    text: "Para prepararte un presupuesto preciso, ¿me puedes enviar fotos del sofá, alfombra o superficie a tratar?",
  },
  service: {
    id: "service",
    isActive: true,
    label: "Tipo de servicio",
    text: "¿Qué servicio necesitas exactamente: limpieza de sofá, impermeabilización o lavado de alfombra/tapete?",
  },
};

function isQuickReplyId(value: unknown): value is QuickReplyId {
  return typeof value === "string" && QUICK_REPLY_IDS.includes(value as QuickReplyId);
}

function toQuickReplyRecord(replies: QuickReply[]): QuickReplyRecord {
  return replies.reduce<QuickReplyRecord>(
    (record, reply) => {
      record[reply.id] = reply;
      return record;
    },
    { ...QUICK_REPLY_DEFAULTS },
  );
}

export function getDefaultQuickReplies(): QuickReply[] {
  return QUICK_REPLY_IDS.map((id) => ({ ...QUICK_REPLY_DEFAULTS[id] }));
}

export function resolveQuickReplies(value: unknown): QuickReply[] {
  const defaults = getDefaultQuickReplies();

  if (!Array.isArray(value)) {
    return defaults;
  }

  const merged = toQuickReplyRecord(defaults);

  for (const item of value) {
    if (typeof item !== "object" || item === null) {
      continue;
    }

    const candidate = item as QuickRepliesMetadataItem;

    if (!isQuickReplyId(candidate.id)) {
      continue;
    }

    const fallback = QUICK_REPLY_DEFAULTS[candidate.id];
    const label =
      typeof candidate.label === "string" && candidate.label.trim()
        ? candidate.label.trim()
        : fallback.label;
    const text =
      typeof candidate.text === "string" && candidate.text.trim()
        ? candidate.text.trim()
        : fallback.text;
    const isActive =
      typeof candidate.is_active === "boolean"
        ? candidate.is_active
        : fallback.isActive;

    merged[candidate.id] = {
      id: candidate.id,
      isActive,
      label,
      text,
    };
  }

  return QUICK_REPLY_IDS.map((id) => merged[id]);
}

export function sanitizeQuickReplies(
  replies: ReadonlyArray<{
    id: QuickReplyId;
    isActive: boolean;
    label: string;
    text: string;
  }>,
): QuickReply[] {
  const merged = toQuickReplyRecord(getDefaultQuickReplies());

  for (const reply of replies) {
    const fallback = QUICK_REPLY_DEFAULTS[reply.id];
    const text = reply.text.trim();

    if (!text) {
      throw new Error("Cada respuesta rápida debe tener un texto válido.");
    }

    merged[reply.id] = {
      id: reply.id,
      isActive: reply.isActive,
      label: reply.label.trim() || fallback.label,
      text,
    };
  }

  return QUICK_REPLY_IDS.map((id) => merged[id]);
}
