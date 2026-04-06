import "server-only";

import { createSupabaseAdminClient } from "@/adapters/supabase/client-admin";
import { createSupabaseServerClient } from "@/adapters/supabase/client-server";
import { ensureUserContext } from "@/app/services/auth/ensure-user-context";
import { sanitizeQuickReplies, type QuickReply } from "@/core/settings/quick-replies";

type AccountMetadata = {
  quick_replies?: unknown;
  [key: string]: unknown;
};

type AccountRow = {
  id: string;
  metadata: AccountMetadata | null;
};

export type UpdateQuickRepliesInput = {
  quickReplies: ReadonlyArray<QuickReply>;
};

export async function updateQuickReplies({
  quickReplies,
}: UpdateQuickRepliesInput): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Tu sesion ya no es valida. Vuelve a iniciar sesion.");
  }

  const internalUser = await ensureUserContext(user);
  const admin = createSupabaseAdminClient();
  const { data: account, error: accountError } = await admin
    .from("accounts")
    .select("id, metadata")
    .eq("id", internalUser.account_id)
    .maybeSingle<AccountRow>();

  if (accountError || !account) {
    throw new Error("No pudimos cargar la configuracion del workspace.");
  }

  const sanitizedQuickReplies = sanitizeQuickReplies(quickReplies);
  const metadata: AccountMetadata = account.metadata ?? {};
  const nextMetadata: AccountMetadata = {
    ...metadata,
    quick_replies: sanitizedQuickReplies.map((reply) => ({
      id: reply.id,
      is_active: reply.isActive,
      label: reply.label,
      stage: reply.stage,
      text: reply.text,
    })),
  };

  const { error: updateError } = await admin
    .from("accounts")
    .update({
      metadata: nextMetadata,
    })
    .eq("id", account.id);

  if (updateError) {
    throw new Error("No pudimos guardar las respuestas rapidas.");
  }
}
