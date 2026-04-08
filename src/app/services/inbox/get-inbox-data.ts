import "server-only";

import { createSupabaseAdminClient } from "@/adapters/supabase/client-admin";
import { createSupabaseServerClient } from "@/adapters/supabase/client-server";
import { ensureUserContext } from "@/app/services/auth/ensure-user-context";
import { CRM_STATES, type CrmState } from "@/core/crm/crm-state";
import {
  QUICK_REPLY_STAGES,
  resolveQuickReplies,
  type QuickReplyStage,
  type QuickReply,
} from "@/core/settings/quick-replies";

type ConversationMetadata = {
  crm?: {
    internal_note?: string | null;
    state?: CrmState;
  };
};

type ConversationRow = {
  assigned_user_id: string | null;
  contact_id: string;
  created_at: string;
  id: string;
  last_message_at: string | null;
  metadata: ConversationMetadata | null;
  status: "closed" | "open" | "pending";
};

type ContactRow = {
  display_name: string | null;
  id: string;
  phone_e164: string;
};

type UserRow = {
  full_name: string | null;
  id: string;
};

type MessagePreviewRow = {
  body: string | null;
  conversation_id: string;
  created_at: string;
  direction: "inbound" | "outbound";
  sent_at: string | null;
  type:
    | "audio"
    | "document"
    | "image"
    | "interactive"
    | "system"
    | "text"
    | "unknown"
    | "video";
};

type MessageRow = {
  body: string | null;
  created_at: string;
  direction: "inbound" | "outbound";
  id: string;
  sent_at: string | null;
  status: "delivered" | "failed" | "queued" | "read" | "received" | "sent";
  type:
    | "audio"
    | "document"
    | "image"
    | "interactive"
    | "system"
    | "text"
    | "unknown"
    | "video";
};

type AccountRow = {
  metadata: {
    quick_replies?: unknown;
  } | null;
};

export type InboxConversation = {
  contactId: string;
  controlLabel: string;
  controlState: "free" | "mine" | "other";
  crmState: CrmState;
  displayName: string;
  id: string;
  lastMessageAt: string | null;
  ownerUserId: string | null;
  phone: string;
  preview: string;
  status: "closed" | "open" | "pending";
};

export type InboxMessage = {
  body: string;
  direction: "inbound" | "outbound";
  id: string;
  sentAt: string;
  status: "delivered" | "failed" | "queued" | "read" | "received" | "sent";
  type:
    | "audio"
    | "document"
    | "image"
    | "interactive"
    | "system"
    | "text"
    | "unknown"
    | "video";
};

export type InboxSelection = {
  contactName: string;
  conversationId: string;
  controlLabel: string;
  controlState: "free" | "mine" | "other";
  crmInternalNote: string;
  crmState: CrmState;
  isTakeControlAvailable: boolean;
  messages: InboxMessage[];
  metadata?: {
    internal_notes?: string;
  } | null;
  ownerUserId: string | null;
  phone: string;
  quickReplies: QuickReply[];
  suggestedQuickReplyStage: QuickReplyStage | null;
  status: "closed" | "open" | "pending";
};

export type InboxData = {
  conversations: InboxConversation[];
  crmFilter: CrmState | "all";
  ownerFilter: "all" | "free" | "mine" | "other";
  selectedConversation: InboxSelection | null;
  totalConversations: number;
};

function matchesOwnerFilter(
  controlState: InboxConversation["controlState"],
  ownerFilter: InboxData["ownerFilter"],
): boolean {
  return ownerFilter === "all" ? true : controlState === ownerFilter;
}

function buildMessagePreview(message: MessagePreviewRow | undefined): string {
  if (!message) {
    return "Sin actividad registrada todavia.";
  }

  if (message.body) {
    return message.body;
  }

  switch (message.type) {
    case "image":
      return "Imagen recibida";
    case "audio":
      return "Audio recibido";
    case "video":
      return "Video recibido";
    case "document":
      return "Documento recibido";
    case "interactive":
      return "Interaccion recibida";
    case "system":
      return "Evento del sistema";
    default:
      return "Mensaje sin texto";
  }
}

function buildMessageBody(message: MessageRow): string {
  if (message.body) {
    return message.body;
  }

  switch (message.type) {
    case "image":
      return "Imagen";
    case "audio":
      return "Audio";
    case "video":
      return "Video";
    case "document":
      return "Documento";
    case "interactive":
      return "Mensaje interactivo";
    case "system":
      return "Evento del sistema";
    default:
      return "Mensaje sin contenido de texto";
  }
}

function buildControlData(input: {
  assignedUserId: string | null;
  currentUserId: string;
  usersMap: Map<string, UserRow>;
}): {
  controlLabel: string;
  controlState: "free" | "mine" | "other";
} {
  if (!input.assignedUserId) {
    return {
      controlLabel: "Libre",
      controlState: "free",
    };
  }

  if (input.assignedUserId === input.currentUserId) {
    return {
      controlLabel: "Bajo mi control",
      controlState: "mine",
    };
  }

  const owner = input.usersMap.get(input.assignedUserId);
  const ownerName = owner?.full_name?.trim() || "Otra persona";

  return {
    controlLabel: `Tomada por ${ownerName}`,
    controlState: "other",
  };
}

function resolveCrmState(metadata: ConversationMetadata | null): CrmState {
  const crmState = metadata?.crm?.state;

  return crmState && CRM_STATES.includes(crmState) ? crmState : "nuevo";
}

function resolveCrmInternalNote(metadata: ConversationMetadata | null): string {
  return metadata?.crm?.internal_note?.trim() || "";
}

function pickFirstAvailableStage(
  candidates: ReadonlyArray<QuickReplyStage>,
  availableStages: ReadonlyArray<QuickReplyStage>,
): QuickReplyStage | null {
  for (const stage of candidates) {
    if (availableStages.includes(stage)) {
      return stage;
    }
  }

  return null;
}

function hasRecentOutboundMessage(messages: ReadonlyArray<MessageRow>): boolean {
  return messages.some((message) => message.direction === "outbound");
}

function resolveSuggestedQuickReplyStage(input: {
  availableStages: ReadonlyArray<QuickReplyStage>;
  crmState: CrmState;
  hasRecentOutbound: boolean;
}): QuickReplyStage | null {
  if (input.availableStages.length === 0) {
    return null;
  }

  if (input.crmState === "cerrado" || input.crmState === "perdido") {
    return input.availableStages.includes("cierre") ? "cierre" : null;
  }

  switch (input.crmState) {
    case "nuevo":
      if (!input.hasRecentOutbound && input.availableStages.includes("saludo")) {
        return "saludo";
      }

      return (
        pickFirstAvailableStage(
          ["fotos", "ubicacion", "servicio", "medidas", "presupuesto", "cierre"],
          input.availableStages,
        ) ?? input.availableStages[0]
      );
    case "pendiente":
      return (
        pickFirstAvailableStage(
          ["fotos", "ubicacion", "servicio", "medidas", "presupuesto", "cierre"],
          input.availableStages,
        ) ?? input.availableStages[0]
      );
    case "presupuesto_enviado":
    case "agendado":
      return (
        pickFirstAvailableStage(
          ["cierre", "presupuesto", "medidas", "servicio", "ubicacion", "fotos", "saludo"],
          input.availableStages,
        ) ?? input.availableStages[0]
      );
    default:
      return input.availableStages[0];
  }
}

export async function getInboxData(
  selectedConversationId?: string,
  crmFilter: CrmState | "all" = "all",
  ownerFilter: InboxData["ownerFilter"] = "all",
  includeArchived: boolean = false,
): Promise<InboxData> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      conversations: [],
      crmFilter,
      ownerFilter,
      selectedConversation: null,
      totalConversations: 0,
    };
  }

  const internalUser = await ensureUserContext(user);
  const admin = createSupabaseAdminClient();
  const { data: account, error: accountError } = await admin
    .from("accounts")
    .select("metadata")
    .eq("id", internalUser.account_id)
    .maybeSingle<AccountRow>();

  if (accountError || !account) {
    throw new Error("No pudimos cargar la configuracion del inbox.");
  }

  let conversationsQuery = admin
    .from("conversations")
    .select(
      "id, contact_id, assigned_user_id, status, last_message_at, created_at, metadata",
    )
    .eq("account_id", internalUser.account_id)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .returns<ConversationRow[]>();

  const { data: conversationRows, error: conversationsError } = await conversationsQuery;

  if (conversationsError || !conversationRows) {
    throw new Error("No pudimos cargar las conversaciones del inbox.");
  }

  // Filtrar conversas fechadas/arquivadas por padrão (no lado do cliente)
  const filteredConversations = includeArchived
    ? conversationRows
    : conversationRows.filter((c) => c.status !== "closed");

  if (filteredConversations.length === 0) {
    return {
      conversations: [],
      crmFilter,
      ownerFilter,
      selectedConversation: null,
      totalConversations: 0,
    };
  }

  const contactIds = [...new Set(filteredConversations.map((item) => item.contact_id))];
  const conversationIds = filteredConversations.map((item) => item.id);
  const assignedUserIds = [
    ...new Set(
      conversationRows
        .map((item) => item.assigned_user_id)
        .filter((item): item is string => Boolean(item)),
    ),
  ];

  const [
    { data: contacts, error: contactsError },
    { data: previewMessages, error: previewMessagesError },
    { data: users, error: usersError },
  ] = await Promise.all([
    admin
      .from("contacts")
      .select("id, display_name, phone_e164")
      .in("id", contactIds)
      .returns<ContactRow[]>(),
    admin
      .from("messages")
      .select("conversation_id, body, type, direction, sent_at, created_at")
      .in("conversation_id", conversationIds)
      .order("sent_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .returns<MessagePreviewRow[]>(),
    assignedUserIds.length > 0
      ? admin
          .from("users")
          .select("id, full_name")
          .in("id", assignedUserIds)
          .returns<UserRow[]>()
      : Promise.resolve({
          data: [] as UserRow[],
          error: null,
        }),
  ]);

  if (contactsError || !contacts) {
    throw new Error("No pudimos cargar los contactos del inbox.");
  }

  if (previewMessagesError || !previewMessages) {
    throw new Error("No pudimos cargar los mensajes del inbox.");
  }

  if (usersError || !users) {
    throw new Error("No pudimos cargar el control de las conversaciones.");
  }

  const contactsMap = new Map(contacts.map((contact) => [contact.id, contact]));
  const latestMessageByConversation = new Map<string, MessagePreviewRow>();
  const metadataByConversationId = new Map(
    filteredConversations.map((conversation) => [conversation.id, conversation.metadata]),
  );
  const usersMap = new Map(users.map((item) => [item.id, item]));

  for (const message of previewMessages) {
    if (!latestMessageByConversation.has(message.conversation_id)) {
      latestMessageByConversation.set(message.conversation_id, message);
    }
  }

  const conversations = filteredConversations
    .map((conversation) => {
      const contact = contactsMap.get(conversation.contact_id);
      const latestMessage = latestMessageByConversation.get(conversation.id);
      const controlData = buildControlData({
        assignedUserId: conversation.assigned_user_id,
        currentUserId: internalUser.id,
        usersMap,
      });

      return {
        contactId: conversation.contact_id,
        controlLabel: controlData.controlLabel,
        controlState: controlData.controlState,
        crmState: resolveCrmState(conversation.metadata),
        displayName:
          contact?.display_name ?? contact?.phone_e164 ?? "Contacto sin nombre",
        id: conversation.id,
        lastMessageAt:
          conversation.last_message_at ??
          latestMessage?.sent_at ??
          latestMessage?.created_at ??
          null,
        ownerUserId: conversation.assigned_user_id,
        phone: contact?.phone_e164 ?? "Sin numero disponible",
        preview: buildMessagePreview(latestMessage),
        status: conversation.status,
      } satisfies InboxConversation;
    })
    .filter((conversation) =>
      crmFilter === "all" ? true : conversation.crmState === crmFilter,
    )
    .filter((conversation) =>
      matchesOwnerFilter(conversation.controlState, ownerFilter),
    );

  if (conversations.length === 0) {
    return {
      conversations: [],
      crmFilter,
      ownerFilter,
      selectedConversation: null,
      totalConversations: 0,
    };
  }

  const selectedConversation =
    conversations.find(
      (conversation) => conversation.id === selectedConversationId,
    ) ?? conversations[0];

  const { data: selectedMessages, error: selectedMessagesError } = await admin
    .from("messages")
    .select("id, direction, type, body, status, sent_at, created_at")
    .eq("conversation_id", selectedConversation.id)
    .order("sent_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true })
    .returns<MessageRow[]>();

  if (selectedMessagesError || !selectedMessages) {
    throw new Error("No pudimos cargar los mensajes de la conversacion.");
  }

  const quickReplies = resolveQuickReplies(account.metadata?.quick_replies).filter(
    (reply) => reply.isActive,
  );
  const activeStages = QUICK_REPLY_STAGES.filter((stage) =>
    quickReplies.some((reply) => reply.stage === stage),
  );
  const suggestedQuickReplyStage = resolveSuggestedQuickReplyStage({
    availableStages: activeStages,
    crmState: selectedConversation.crmState,
    hasRecentOutbound: hasRecentOutboundMessage(selectedMessages),
  });

  return {
    conversations,
    crmFilter,
    ownerFilter,
    selectedConversation: {
      contactName: selectedConversation.displayName,
      conversationId: selectedConversation.id,
      controlLabel: selectedConversation.controlLabel,
      controlState: selectedConversation.controlState,
      crmInternalNote: resolveCrmInternalNote(
        metadataByConversationId.get(selectedConversation.id) ?? null,
      ),
      crmState: selectedConversation.crmState,
      isTakeControlAvailable: selectedConversation.controlState === "free",
      ownerUserId: selectedConversation.ownerUserId,
      messages: selectedMessages.map((message) => ({
        body: buildMessageBody(message),
        direction: message.direction,
        id: message.id,
        sentAt: message.sent_at ?? message.created_at,
        status: message.status,
        type: message.type,
      })),
      phone: selectedConversation.phone,
      quickReplies,
      suggestedQuickReplyStage,
      status: selectedConversation.status,
    },
    totalConversations: conversations.length,
  };
}
