import "server-only";

import OpenAI from "openai";

import { createSupabaseAdminClient } from "@/adapters/supabase/client-admin";
import { createSupabaseServerClient } from "@/adapters/supabase/client-server";
import { ensureUserContext } from "@/app/services/auth/ensure-user-context";
import { readOpenAIEnv } from "@/lib/env";

const MAX_CONTEXT_MESSAGES = 8;
const MAX_MESSAGE_BODY_CHARS = 280;
const MAX_CONTEXT_CHARS = 1600;

type ConversationLookup = {
  account_id: string;
  contact_id: string | null;
  id: string;
};

type ContactLookup = {
  display_name: string | null;
};

type MessageContextRow = {
  body: string | null;
  created_at: string;
  direction: "inbound" | "outbound";
  sent_at: string | null;
};

export type GenerateReplyDraftInput = {
  conversationId: string;
};

function trimMessageBody(body: string): string {
  const normalizedBody = body.replace(/\s+/g, " ").trim();

  if (normalizedBody.length <= MAX_MESSAGE_BODY_CHARS) {
    return normalizedBody;
  }

  return `${normalizedBody.slice(0, MAX_MESSAGE_BODY_CHARS - 1).trimEnd()}…`;
}

function buildConversationTranscript(
  messages: MessageContextRow[],
): string | null {
  const lines: string[] = [];
  let totalChars = 0;

  for (const message of messages) {
    if (!message.body) {
      continue;
    }

    const trimmedBody = trimMessageBody(message.body);

    if (!trimmedBody) {
      continue;
    }

    const speaker = message.direction === "inbound" ? "Cliente" : "Agente";
    const line = `${speaker}: ${trimmedBody}`;

    if (totalChars + line.length > MAX_CONTEXT_CHARS && lines.length > 0) {
      break;
    }

    lines.push(line);
    totalChars += line.length;
  }

  if (lines.length === 0) {
    return null;
  }

  return lines.join("\n");
}

function buildDraftPrompt(input: {
  contactName: string;
  transcript: string;
}): string {
  return [
    `Contacto: ${input.contactName}`,
    "Redacta una respuesta breve, clara y profesional en español.",
    "No inventes datos ni prometas acciones no confirmadas.",
    "Devuelve solo el texto del borrador, sin comillas ni explicaciones.",
    "",
    "Conversación reciente:",
    input.transcript,
  ].join("\n");
}

export async function generateReplyDraft({
  conversationId,
}: GenerateReplyDraftInput): Promise<string> {
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
    .select("id, account_id, contact_id")
    .eq("id", conversationId)
    .eq("account_id", internalUser.account_id)
    .maybeSingle<ConversationLookup>();

  if (conversationError || !conversation) {
    throw new Error("No pudimos encontrar la conversación solicitada.");
  }

  const [{ data: messages, error: messagesError }, { data: contact }] =
    await Promise.all([
      admin
        .from("messages")
        .select("direction, body, sent_at, created_at")
        .eq("conversation_id", conversation.id)
        .order("sent_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(MAX_CONTEXT_MESSAGES)
        .returns<MessageContextRow[]>(),
      conversation.contact_id
        ? admin
            .from("contacts")
            .select("display_name")
            .eq("id", conversation.contact_id)
            .maybeSingle<ContactLookup>()
        : Promise.resolve({
            data: null as ContactLookup | null,
            error: null,
          }),
    ]);

  if (messagesError || !messages) {
    throw new Error(
      "No pudimos cargar el contexto de la conversación para generar el borrador.",
    );
  }

  const transcript = buildConversationTranscript([...messages].reverse());

  if (!transcript) {
    throw new Error(
      "La conversación todavía no tiene suficiente contexto para generar un borrador.",
    );
  }

  const openAIEnv = readOpenAIEnv();
  const client = new OpenAI({
    apiKey: openAIEnv.OPENAI_API_KEY,
  });
  const response = await client.responses.create({
    input: buildDraftPrompt({
      contactName: contact?.display_name?.trim() || "Cliente",
      transcript,
    }),
    instructions:
      "Eres un asistente de soporte para un CRM de WhatsApp. Redacta respuestas útiles y concisas para que un agente humano las revise antes de enviar.",
    max_output_tokens: 160,
    model: openAIEnv.OPENAI_MODEL,
  });

  const draft = response.output_text.trim();

  if (!draft) {
    throw new Error("No pudimos generar un borrador útil en este momento.");
  }

  return draft;
}
