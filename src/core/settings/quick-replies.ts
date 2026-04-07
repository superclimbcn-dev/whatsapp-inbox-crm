export const QUICK_REPLY_STAGES = [
  "saludo",
  "fotos",
  "ubicacion",
  "servicio",
  "medidas",
  "presupuesto",
  "cierre",
] as const;

export type QuickReplyStage = (typeof QUICK_REPLY_STAGES)[number];

export type QuickReply = {
  id: string;
  isActive: boolean;
  label: string;
  stage: QuickReplyStage;
  text: string;
};

type QuickRepliesMetadataItem = {
  id?: unknown;
  is_active?: unknown;
  label?: unknown;
  stage?: unknown;
  text?: unknown;
};

const DEFAULT_QUICK_REPLIES = [
  {
    id: "photos",
    isActive: true,
    label: "Pedir fotos",
    stage: "fotos",
    text: "Para prepararte un presupuesto preciso, me puedes enviar fotos del sofa, alfombra o superficie a tratar?",
  },
  {
    id: "location",
    isActive: true,
    label: "Pedir ubicacion",
    stage: "ubicacion",
    text: "Me compartes la zona o ubicacion del servicio para revisar disponibilidad y presupuesto?",
  },
  {
    id: "service",
    isActive: true,
    label: "Tipo de servicio",
    stage: "servicio",
    text: "Que servicio necesitas exactamente: limpieza de sofa, impermeabilizacion o lavado de alfombra/tapete?",
  },
  {
    id: "measurements",
    isActive: true,
    label: "Medidas / cantidad",
    stage: "medidas",
    text: "Me indicas cuantas piezas son y las medidas aproximadas para calcular mejor el presupuesto?",
  },
] satisfies QuickReply[];

const DEFAULT_QUICK_REPLIES_BY_ID = new Map(
  DEFAULT_QUICK_REPLIES.map((reply) => [reply.id, reply]),
);

function isQuickReplyStage(value: unknown): value is QuickReplyStage {
  return (
    typeof value === "string" &&
    QUICK_REPLY_STAGES.includes(value as QuickReplyStage)
  );
}

function buildFallbackLabel(stage: QuickReplyStage, id: string): string {
  const defaultReply = DEFAULT_QUICK_REPLIES_BY_ID.get(id);

  if (defaultReply) {
    return defaultReply.label;
  }

  switch (stage) {
    case "saludo":
      return "Saludo inicial";
    case "fotos":
      return "Solicitud de fotos";
    case "ubicacion":
      return "Solicitud de ubicacion";
    case "servicio":
      return "Tipo de servicio";
    case "medidas":
      return "Medidas / cantidad";
    case "presupuesto":
      return "Presupuesto";
    case "cierre":
      return "Cierre";
  }
}

function resolveStage(
  candidateStage: unknown,
  quickReplyId: string,
): QuickReplyStage | null {
  if (isQuickReplyStage(candidateStage)) {
    return candidateStage;
  }

  return DEFAULT_QUICK_REPLIES_BY_ID.get(quickReplyId)?.stage ?? null;
}

function buildFallbackText(quickReplyId: string): string {
  return DEFAULT_QUICK_REPLIES_BY_ID.get(quickReplyId)?.text ?? "";
}

export function buildQuickReplyStageLabel(stage: QuickReplyStage): string {
  switch (stage) {
    case "saludo":
      return "Saludo";
    case "fotos":
      return "Fotos";
    case "ubicacion":
      return "Ubicacion";
    case "servicio":
      return "Servicio";
    case "medidas":
      return "Medidas";
    case "presupuesto":
      return "Presupuesto";
    case "cierre":
      return "Cierre";
  }
}

export function findNextQuickReplyStage(
  currentStage: QuickReplyStage,
  availableStages: ReadonlyArray<QuickReplyStage>,
): QuickReplyStage | null {
  const currentIndex = QUICK_REPLY_STAGES.indexOf(currentStage);

  for (let index = currentIndex + 1; index < QUICK_REPLY_STAGES.length; index += 1) {
    const candidateStage = QUICK_REPLY_STAGES[index];

    if (availableStages.includes(candidateStage)) {
      return candidateStage;
    }
  }

  return null;
}

export function getDefaultQuickReplies(): QuickReply[] {
  return DEFAULT_QUICK_REPLIES.map((reply) => ({ ...reply }));
}

export function createEmptyQuickReply(stage: QuickReplyStage = "saludo"): QuickReply {
  return {
    id: `custom_${crypto.randomUUID()}`,
    isActive: true,
    label: "",
    stage,
    text: "",
  };
}

export function resolveQuickReplies(value: unknown): QuickReply[] {
  const defaultReplies = getDefaultQuickReplies();

  if (!Array.isArray(value)) {
    return defaultReplies;
  }

  const repliesById = new Map(defaultReplies.map((reply) => [reply.id, reply]));
  const extraReplies: QuickReply[] = [];

  for (const item of value) {
    if (typeof item !== "object" || item === null) {
      continue;
    }

    const candidate = item as QuickRepliesMetadataItem;
    const id = typeof candidate.id === "string" ? candidate.id.trim() : "";

    if (!id) {
      continue;
    }

    const stage = resolveStage(candidate.stage, id);

    if (!stage) {
      continue;
    }

    const defaultReply = repliesById.get(id);
    const label =
      typeof candidate.label === "string" && candidate.label.trim()
        ? candidate.label.trim()
        : buildFallbackLabel(stage, id);
    const text =
      typeof candidate.text === "string" && candidate.text.trim()
        ? candidate.text.trim()
        : buildFallbackText(id);

    if (!text) {
      continue;
    }

    const normalizedReply: QuickReply = {
      id,
      isActive:
        typeof candidate.is_active === "boolean"
          ? candidate.is_active
          : defaultReply?.isActive ?? true,
      label,
      stage,
      text,
    };

    if (defaultReply) {
      repliesById.set(id, normalizedReply);
      continue;
    }

    const existingExtraIndex = extraReplies.findIndex((reply) => reply.id === id);

    if (existingExtraIndex >= 0) {
      extraReplies[existingExtraIndex] = normalizedReply;
    } else {
      extraReplies.push(normalizedReply);
    }
  }

  return [
    ...defaultReplies.map((reply) => repliesById.get(reply.id) ?? reply),
    ...extraReplies,
  ];
}

export function sanitizeQuickReplies(
  replies: ReadonlyArray<QuickReply>,
): QuickReply[] {
  const sanitizedReplies: QuickReply[] = [];
  const seenIds = new Set<string>();

  for (const reply of replies) {
    const id = reply.id.trim();

    if (!id || seenIds.has(id)) {
      continue;
    }

    if (!isQuickReplyStage(reply.stage)) {
      throw new Error("La etapa de la respuesta rapida no es valida.");
    }

    const text = reply.text.trim();

    if (!text) {
      throw new Error("Cada respuesta rapida debe tener un texto valido.");
    }

    seenIds.add(id);
    sanitizedReplies.push({
      id,
      isActive: reply.isActive,
      label: reply.label.trim() || buildFallbackLabel(reply.stage, id),
      stage: reply.stage,
      text,
    });
  }

  return sanitizedReplies;
}
