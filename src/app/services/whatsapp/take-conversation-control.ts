import "server-only";

import { createSupabaseAdminClient } from "@/adapters/supabase/client-admin";
import { createSupabaseServerClient } from "@/adapters/supabase/client-server";
import { ensureUserContext } from "@/app/services/auth/ensure-user-context";

type ConversationRow = {
  account_id: string;
  assigned_user_id: string | null;
  id: string;
};

type HandoffRow = {
  id: string;
};

export type TakeConversationControlInput = {
  conversationId: string;
};

export async function takeConversationControl({
  conversationId,
}: TakeConversationControlInput): Promise<void> {
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
    .select("id, account_id, assigned_user_id")
    .eq("id", conversationId)
    .eq("account_id", internalUser.account_id)
    .maybeSingle<ConversationRow>();

  if (conversationError || !conversation) {
    throw new Error("No pudimos encontrar la conversación solicitada.");
  }

  if (
    conversation.assigned_user_id &&
    conversation.assigned_user_id !== internalUser.id
  ) {
    throw new Error("Esta conversación ya está tomada por otra persona.");
  }

  if (conversation.assigned_user_id !== internalUser.id) {
    const { error: updateConversationError } = await admin
      .from("conversations")
      .update({
        assigned_user_id: internalUser.id,
      })
      .eq("id", conversation.id);

    if (updateConversationError) {
      throw new Error("No pudimos tomar control de la conversación.");
    }
  }

  const { data: latestHandoff, error: latestHandoffError } = await admin
    .from("handoffs")
    .select("id")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<HandoffRow>();

  if (latestHandoffError) {
    throw new Error("No pudimos comprobar el handoff actual.");
  }

  if (latestHandoff) {
    const { error: updateHandoffError } = await admin
      .from("handoffs")
      .update({
        assigned_user_id: internalUser.id,
        requested_by_user_id: internalUser.id,
        status: "active",
      })
      .eq("id", latestHandoff.id);

    if (updateHandoffError) {
      throw new Error("No pudimos actualizar el handoff de la conversación.");
    }

    return;
  }

  const { error: insertHandoffError } = await admin.from("handoffs").insert({
    account_id: conversation.account_id,
    assigned_user_id: internalUser.id,
    conversation_id: conversation.id,
    requested_by_user_id: internalUser.id,
    status: "active",
  });

  if (insertHandoffError) {
    throw new Error("No pudimos registrar el handoff de la conversación.");
  }
}
