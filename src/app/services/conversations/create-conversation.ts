import "server-only";

import { createSupabaseAdminClient } from "@/adapters/supabase/client-admin";
import { createSupabaseServerClient } from "@/adapters/supabase/client-server";
import { ensureUserContext } from "@/app/services/auth/ensure-user-context";

type ContactRow = {
  account_id: string;
  id: string;
  phone_e164: string;
};

type ConversationRow = {
  id: string;
};

export type CreateConversationInput = {
  contactId: string;
};

export async function createConversation({
  contactId,
}: CreateConversationInput): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Tu sesión ya no es válida. Vuelve a iniciar sesión.");
  }

  const internalUser = await ensureUserContext(user);
  const admin = createSupabaseAdminClient();
  
  // Verificar que el contacto exista y pertenezca a la cuenta
  const { data: contact, error: contactError } = await admin
    .from("contacts")
    .select("id, account_id")
    .eq("id", contactId)
    .eq("account_id", internalUser.account_id)
    .maybeSingle<ContactRow>();

  if (contactError || !contact) {
    throw new Error("No pudimos encontrar el contacto solicitado.");
  }

  // Verificar si ya existe una conversación para este contacto
  const { data: existingConversation, error: existingConversationError } = await admin
    .from("conversations")
    .select("id")
    .eq("contact_id", contactId)
    .maybeSingle<ConversationRow>();

  if (existingConversationError) {
    throw new Error("No pudimos verificar si ya existe una conversación.");
  }

  if (existingConversation) {
    throw new Error("Ya existe una conversación para este contacto.");
  }

  // Crear nueva conversación
  const { data: newConversation, error: createError } = await admin
    .from("conversations")
    .insert({
      account_id: contact.account_id,
      contact_id: contact.id,
      status: "open",
      metadata: {
        crm: {
          state: "nuevo",
          internal_note: ""
        }
      }
    })
    .select("id")
    .single<ConversationRow>();

  if (createError || !newConversation) {
    throw new Error("No pudimos crear la conversación.");
  }

  return newConversation.id;
}