import "server-only";

import { type CrmState } from "@/core/crm/crm-state";
import { createSupabaseAdminClient } from "@/adapters/supabase/client-admin";
import { createSupabaseServerClient } from "@/adapters/supabase/client-server";
import { ensureUserContext } from "@/app/services/auth/ensure-user-context";

type ConversationMetadata = {
  crm?: {
    internal_note?: string | null;
    state?: CrmState;
  };
};

type ConversationRow = {
  account_id: string;
  id: string;
  metadata: ConversationMetadata | null;
};

export type UpdateConversationCrmInput = {
  conversationId: string;
  crmState: CrmState;
  internalNote: string;
};

function normalizeInternalNote(value: string): string {
  return value.trim().slice(0, 500);
}

export async function updateConversationCrm({
  conversationId,
  crmState,
  internalNote,
}: UpdateConversationCrmInput): Promise<void> {
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
    .select("id, account_id, metadata")
    .eq("id", conversationId)
    .eq("account_id", internalUser.account_id)
    .maybeSingle<ConversationRow>();

  if (conversationError || !conversation) {
    throw new Error("No pudimos encontrar la conversación solicitada.");
  }

  const metadata = conversation.metadata ?? {};
  const nextMetadata: ConversationMetadata = {
    ...metadata,
    crm: {
      ...metadata.crm,
      internal_note: normalizeInternalNote(internalNote) || null,
      state: crmState,
    },
  };

  const { error: updateError } = await admin
    .from("conversations")
    .update({
      metadata: nextMetadata,
    })
    .eq("id", conversation.id);

  if (updateError) {
    throw new Error("No pudimos actualizar el contexto CRM de la conversación.");
  }
}
