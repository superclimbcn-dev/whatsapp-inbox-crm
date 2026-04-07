import "server-only";

import { createSupabaseAdminClient } from "@/adapters/supabase/client-admin";
import { createSupabaseServerClient } from "@/adapters/supabase/client-server";
import { ensureUserContext } from "@/app/services/auth/ensure-user-context";
import { CRM_STATES, type CrmState } from "@/core/crm/crm-state";

type ContactRow = {
  created_at: string;
  display_name: string | null;
  id: string;
  phone_e164: string;
  wa_contact_id: string | null;
};

type ConversationRow = {
  contact_id: string;
  created_at: string;
  id: string;
  last_message_at: string | null;
  metadata: {
    crm?: {
      state?: CrmState;
    };
  } | null;
  status: "closed" | "open" | "pending";
};

const CONTACTS_VIEW_LIMIT = 1000;

export type ContactListItem = {
  conversationId: string | null;
  crmState: CrmState | null;
  displayName: string;
  id: string;
  lastActivityAt: string;
  phone: string;
  status: "closed" | "open" | "pending" | null;
  waContactId: string | null;
};

export type SelectedContact = ContactListItem;

export type ContactsData = {
  crmFilter: CrmState | "all";
  conversationFilter: "all" | "with_conversation" | "without_conversation";
  contacts: ContactListItem[];
  loadedContacts: number;
  searchTerm: string;
  selectedContact: SelectedContact | null;
  totalContacts: number;
};

function normalizeSearchTerm(value: string | undefined): string {
  return value?.trim() ?? "";
}

function buildDisplayName(contact: ContactRow): string {
  return contact.display_name?.trim() || contact.phone_e164;
}

function buildLastActivityAt(
  contact: ContactRow,
  conversation: ConversationRow | undefined,
): string {
  return conversation?.last_message_at ?? contact.created_at;
}

function compareByRecentActivity(
  left: ContactListItem,
  right: ContactListItem,
): number {
  return (
    new Date(right.lastActivityAt).getTime() -
    new Date(left.lastActivityAt).getTime()
  );
}

function resolveCrmState(
  conversation: ConversationRow | undefined,
): CrmState | null {
  if (!conversation) {
    return null;
  }

  const crmState = conversation.metadata?.crm?.state;

  return crmState && CRM_STATES.includes(crmState) ? crmState : "nuevo";
}

export async function getContactsData(
  selectedContactId?: string,
  rawSearchTerm?: string,
  conversationFilter: ContactsData["conversationFilter"] = "all",
  crmFilter: ContactsData["crmFilter"] = "all",
): Promise<ContactsData> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      crmFilter,
      conversationFilter,
      contacts: [],
      loadedContacts: 0,
      searchTerm: normalizeSearchTerm(rawSearchTerm),
      selectedContact: null,
      totalContacts: 0,
    };
  }

  const internalUser = await ensureUserContext(user);
  const admin = createSupabaseAdminClient();
  const searchTerm = normalizeSearchTerm(rawSearchTerm);
  const { count: totalContacts, error: totalContactsError } = await admin
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("account_id", internalUser.account_id);

  if (totalContactsError) {
    throw new Error("No pudimos cargar el total de contactos.");
  }

  let contactsQuery = admin
    .from("contacts")
    .select("id, display_name, phone_e164, wa_contact_id, created_at")
    .eq("account_id", internalUser.account_id)
    .order("created_at", { ascending: false })
    .range(0, CONTACTS_VIEW_LIMIT - 1);

  if (searchTerm) {
    const escapedSearchTerm = searchTerm.replace(/[%_,]/g, " ").trim();

    if (escapedSearchTerm) {
      contactsQuery = contactsQuery.or(
        `display_name.ilike.%${escapedSearchTerm}%,phone_e164.ilike.%${escapedSearchTerm}%`,
      );
    }
  }

  const { data: contactRows, error: contactsError } =
    await contactsQuery.returns<ContactRow[]>();

  if (contactsError || !contactRows) {
    throw new Error("No pudimos cargar los contactos.");
  }

  if (contactRows.length === 0) {
    return {
      crmFilter,
      conversationFilter,
      contacts: [],
      loadedContacts: 0,
      searchTerm,
      selectedContact: null,
      totalContacts: totalContacts ?? 0,
    };
  }

  const contactIds = contactRows.map((contact) => contact.id);
  const contactIdsSet = new Set(contactIds);
  const { data: conversationRows, error: conversationsError } = await admin
    .from("conversations")
    .select("id, contact_id, status, last_message_at, created_at, metadata")
    .eq("account_id", internalUser.account_id)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .returns<ConversationRow[]>();

  if (conversationsError || !conversationRows) {
    throw new Error("No pudimos cargar las conversaciones de los contactos.");
  }

  const recentConversationByContact = new Map<string, ConversationRow>();

  for (const conversation of conversationRows) {
    if (!contactIdsSet.has(conversation.contact_id)) {
      continue;
    }

    if (!recentConversationByContact.has(conversation.contact_id)) {
      recentConversationByContact.set(conversation.contact_id, conversation);
    }
  }

  const contacts = contactRows
    .map((contact) => {
      const conversation = recentConversationByContact.get(contact.id);

      return {
        conversationId: conversation?.id ?? null,
        crmState: resolveCrmState(conversation),
        displayName: buildDisplayName(contact),
        id: contact.id,
        lastActivityAt: buildLastActivityAt(contact, conversation),
        phone: contact.phone_e164,
        status: conversation?.status ?? null,
        waContactId: contact.wa_contact_id,
      } satisfies ContactListItem;
    })
    .filter((contact) =>
      conversationFilter === "with_conversation"
        ? Boolean(contact.conversationId)
        : conversationFilter === "without_conversation"
          ? !contact.conversationId
          : true,
    )
    .filter((contact) =>
      crmFilter === "all" ? true : contact.crmState === crmFilter,
    )
    .sort(compareByRecentActivity);

  const selectedContact =
    contacts.find((contact) => contact.id === selectedContactId) ?? contacts[0];

  return {
    crmFilter,
    conversationFilter,
    contacts,
    loadedContacts: contacts.length,
    searchTerm,
    selectedContact,
    totalContacts: totalContacts ?? contacts.length,
  };
}
