import Link from "next/link";

import { getContactsData } from "@/app/services/contacts/get-contacts-data";
import { PanelSurface } from "@/web/components/ui/panel-surface";
import { StatusBadge } from "@/web/components/ui/status-badge";

function buildStatusLabel(
  status: "closed" | "open" | "pending" | null,
): string {
  switch (status) {
    case "open":
      return "Con conversacion";
    case "pending":
      return "Con conversacion";
    case "closed":
      return "Con conversacion";
    default:
      return "Sin conversacion";
  }
}

function buildConversationFilterLabel(
  value: "all" | "with_conversation" | "without_conversation",
): string {
  switch (value) {
    case "with_conversation":
      return "Con conversacion";
    case "without_conversation":
      return "Sin conversacion";
    default:
      return "Todos";
  }
}

function buildContactsHref(
  contactId: string,
  searchTerm: string,
  conversationFilter: "all" | "with_conversation" | "without_conversation",
): string {
  const params = new URLSearchParams();

  params.set("contact", contactId);

  if (searchTerm) {
    params.set("q", searchTerm);
  }

  if (conversationFilter !== "all") {
    params.set("conversation", conversationFilter);
  }

  return `/contacts?${params.toString()}`;
}

function parseImportMetric(value: string | string[] | undefined): number | null {
  if (typeof value !== "string") {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return null;
  }

  return parsedValue;
}

function getContactInitials(value: string): string {
  const words = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (words.length === 0) {
    return "CT";
  }

  return words.map((word) => word[0]?.toUpperCase() ?? "").join("");
}

export default async function ContactsPage(props: PageProps<"/contacts">) {
  const searchParams = await props.searchParams;
  const selectedContactId =
    typeof searchParams.contact === "string" ? searchParams.contact : undefined;
  const searchTerm =
    typeof searchParams.q === "string" ? searchParams.q : undefined;
  const conversationFilter =
    searchParams.conversation === "with_conversation" ||
    searchParams.conversation === "without_conversation"
      ? searchParams.conversation
      : "all";
  const importedCount = parseImportMetric(searchParams.imported);
  const duplicatedCount = parseImportMetric(searchParams.duplicated);
  const ignoredCount = parseImportMetric(searchParams.ignored);
  const importError =
    typeof searchParams.import_error === "string"
      ? searchParams.import_error
      : null;
  const contactsData = await getContactsData(
    selectedContactId,
    searchTerm,
    conversationFilter,
  );
  const hasContacts = contactsData.contacts.length > 0;
  const selectedContact = contactsData.selectedContact;

  return (
    <PanelSurface className="flex h-full min-h-0 flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(18,28,45,0.98),rgba(10,18,31,0.96))]">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-5 xl:px-6 xl:py-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
              Directorio operativo
            </p>
            <h2 className="mt-2 max-w-2xl text-[30px] font-semibold leading-[1.15] text-foreground">
              Contactos reales conectados a la operacion.
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <StatusBadge tone="accent">
              {`${contactsData.totalContacts} contactos`}
            </StatusBadge>
            <StatusBadge tone="info">
              {`${contactsData.loadedContacts} en esta vista`}
            </StatusBadge>
            <StatusBadge tone={hasContacts ? "success" : "base"}>
              {hasContacts ? "Directorio activo" : "Sin contactos"}
            </StatusBadge>
          </div>
        </div>

        <div className="mt-5 grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_360px]">
          <div className="flex min-h-0 flex-col gap-5">
            <section className="rounded-[28px] border border-border bg-[linear-gradient(180deg,rgba(20,30,49,0.96),rgba(15,24,40,0.92))] px-5 py-5 shadow-[0_22px_56px_rgba(2,6,23,0.18)]">
              <div className="flex flex-col gap-4">
                <form action="/contacts" method="get" className="max-w-3xl">
                  <label className="block">
                    <span className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                      Buscar contacto
                    </span>
                    <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
                      <input
                        type="search"
                        name="q"
                        defaultValue={contactsData.searchTerm}
                        placeholder="Buscar por nombre o telefono..."
                        className="h-11 min-w-0 flex-1 rounded-2xl border border-border bg-background-soft px-4 text-sm text-foreground outline-none transition placeholder:text-foreground-muted/58 focus:border-accent/36"
                      />
                      <input
                        type="hidden"
                        name="conversation"
                        value={
                          contactsData.conversationFilter === "all"
                            ? ""
                            : contactsData.conversationFilter
                        }
                      />
                      <button
                        type="submit"
                        className="h-11 shrink-0 rounded-2xl border border-[rgba(82,101,155,0.34)] bg-[linear-gradient(180deg,rgba(24,36,58,0.98),rgba(18,28,45,0.96))] px-5 text-sm font-semibold text-foreground shadow-[0_14px_30px_rgba(7,12,24,0.2)] transition hover:border-[rgba(98,119,180,0.42)] hover:bg-[linear-gradient(180deg,rgba(31,45,72,0.98),rgba(22,33,53,0.96))]"
                      >
                        Buscar
                      </button>
                    </div>
                  </label>
                </form>

                <div className="flex flex-wrap gap-2">
                  {(
                    ["all", "with_conversation", "without_conversation"] as const
                  ).map((filterOption) => {
                    const params = new URLSearchParams();

                    if (contactsData.searchTerm) {
                      params.set("q", contactsData.searchTerm);
                    }

                    if (filterOption !== "all") {
                      params.set("conversation", filterOption);
                    }

                    const href = params.toString()
                      ? `/contacts?${params.toString()}`
                      : "/contacts";
                    const isActive =
                      contactsData.conversationFilter === filterOption;

                    return (
                      <a
                        key={filterOption}
                        href={href}
                        className={
                          isActive
                            ? "rounded-2xl border border-[rgba(86,107,167,0.42)] bg-[linear-gradient(180deg,rgba(41,56,89,0.98),rgba(26,39,63,0.96))] px-4 py-2 text-xs font-medium text-foreground shadow-[0_12px_26px_rgba(7,12,24,0.18)]"
                            : "rounded-2xl border border-[rgba(96,114,170,0.2)] bg-[linear-gradient(180deg,rgba(18,28,45,0.94),rgba(13,22,37,0.92))] px-4 py-2 text-xs font-medium text-foreground-soft transition hover:border-[rgba(96,114,170,0.34)] hover:text-foreground"
                        }
                      >
                        {buildConversationFilterLabel(filterOption)}
                      </a>
                    );
                  })}
                </div>

                {importError ? (
                  <p className="rounded-2xl border border-warning/20 bg-warning-soft px-4 py-3 text-sm text-amber-200">
                    {importError}
                  </p>
                ) : importedCount !== null &&
                  duplicatedCount !== null &&
                  ignoredCount !== null ? (
                  <div className="flex flex-wrap gap-2.5">
                    <StatusBadge tone="success">
                      {`${importedCount} importados`}
                    </StatusBadge>
                    <StatusBadge tone="info">
                      {`${duplicatedCount} duplicados`}
                    </StatusBadge>
                    <StatusBadge tone="base">
                      {`${ignoredCount} ignorados`}
                    </StatusBadge>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-border bg-[linear-gradient(180deg,rgba(19,29,47,0.98),rgba(13,22,38,0.95))] shadow-[0_26px_64px_rgba(2,6,23,0.22)]">
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                <h3 className="text-xl font-semibold text-foreground">
                  Directorio
                </h3>
                <StatusBadge tone="success">Listado real</StatusBadge>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {hasContacts ? (
                  <div className="divide-y divide-border/70">
                    {contactsData.contacts.map((contact) => {
                      const isActive = contact.id === selectedContact?.id;
                      const hasConversation = Boolean(contact.conversationId);

                      return (
                        <Link
                          key={contact.id}
                          href={buildContactsHref(
                            contact.id,
                            contactsData.searchTerm,
                            contactsData.conversationFilter,
                          )}
                          className={`flex items-center gap-4 px-5 py-4 transition ${
                            isActive
                              ? "bg-[linear-gradient(180deg,rgba(33,47,73,0.98),rgba(24,37,60,0.96))]"
                              : "hover:bg-[linear-gradient(180deg,rgba(24,36,58,0.78),rgba(18,29,48,0.74))]"
                          }`}
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,rgba(27,86,122,0.96),rgba(20,63,93,0.96))] text-sm font-semibold text-cyan-200">
                            {getContactInitials(contact.displayName)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-semibold text-foreground">
                              {contact.displayName}
                            </p>
                            <p className="mt-1 truncate text-sm text-foreground-soft">
                              {contact.phone}
                            </p>
                          </div>

                          <StatusBadge tone={hasConversation ? "info" : "base"}>
                            {hasConversation ? "Con conv." : "Sin conv."}
                          </StatusBadge>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-5 py-5">
                    <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(18,28,45,0.94),rgba(13,22,37,0.92))] px-4 py-5">
                      <p className="text-sm font-medium text-foreground">
                        No encontramos contactos para esta busqueda.
                      </p>
                      <p className="mt-2 text-xs leading-6 text-foreground-muted/76">
                        Los contactos reales se crean automaticamente cuando
                        llegan conversaciones inbound al webhook.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="flex min-h-0 flex-col gap-5">
            <section className="rounded-[28px] border border-border bg-[linear-gradient(180deg,rgba(20,30,49,0.96),rgba(15,24,40,0.92))] px-5 py-5 shadow-[0_22px_56px_rgba(2,6,23,0.18)]">
              {selectedContact ? (
                <div className="flex flex-col gap-5">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                      Contacto seleccionado
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,rgba(27,86,122,0.96),rgba(20,63,93,0.96))] text-xl font-semibold text-cyan-200">
                      {getContactInitials(selectedContact.displayName)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-[28px] font-semibold leading-tight text-foreground">
                        {selectedContact.displayName}
                      </h3>
                      <p className="mt-1 truncate text-base text-foreground-soft">
                        {selectedContact.phone}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-5">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-foreground-muted/78">
                          Estado
                        </span>
                        <StatusBadge
                          tone={
                            selectedContact.conversationId ? "info" : "base"
                          }
                        >
                          {buildStatusLabel(selectedContact.status)}
                        </StatusBadge>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-foreground-muted/78">
                          Telefono
                        </span>
                        <span className="truncate text-sm font-medium text-foreground">
                          {selectedContact.phone}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-foreground-muted/78">
                          Workspace
                        </span>
                        <span className="truncate text-sm font-medium text-foreground">
                          superclimbcn
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedContact.conversationId ? (
                      <Link
                        href={`/inbox?conversation=${selectedContact.conversationId}`}
                        className="inline-flex h-11 items-center justify-center rounded-2xl border border-[rgba(88,108,176,0.44)] bg-[linear-gradient(180deg,rgba(34,49,77,0.98),rgba(23,35,56,0.96))] px-5 text-sm font-semibold text-foreground shadow-[0_14px_30px_rgba(7,12,24,0.2)] transition hover:border-[rgba(104,126,188,0.46)] hover:bg-[linear-gradient(180deg,rgba(40,57,89,0.98),rgba(27,41,65,0.96))]"
                      >
                        Ver conversacion
                      </Link>
                    ) : (
                      <div className="inline-flex h-11 items-center justify-center rounded-2xl border border-[rgba(96,114,170,0.16)] bg-[linear-gradient(180deg,rgba(18,28,45,0.7),rgba(13,22,37,0.66))] px-5 text-sm font-medium text-foreground-muted/56">
                        Sin conversacion
                      </div>
                    )}

                    <button
                      type="button"
                      disabled
                      className="h-11 rounded-2xl border border-[rgba(96,114,170,0.16)] bg-[linear-gradient(180deg,rgba(18,28,45,0.7),rgba(13,22,37,0.66))] px-5 text-sm font-medium text-foreground-muted/56"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                    Contacto seleccionado
                  </p>
                  <h3 className="text-xl font-semibold text-foreground">
                    Todavia no hay contactos disponibles.
                  </h3>
                  <p className="text-sm leading-7 text-foreground-muted/82">
                    Cuando llegue actividad real desde WhatsApp, esta vista
                    mostrara aqui el detalle del contacto seleccionado.
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-border bg-[linear-gradient(180deg,rgba(18,28,45,0.94),rgba(13,22,37,0.92))] px-5 py-5 shadow-[0_18px_46px_rgba(2,6,23,0.16)]">
              <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                Importacion manual
              </p>
              <h4 className="mt-3 text-2xl font-semibold text-foreground">
                CSV con cabecera{" "}
                <span className="font-mono text-lg text-foreground/92">
                  name,phone
                </span>
              </h4>
              <p className="mt-2 text-sm leading-7 text-foreground-soft">
                CSV con cabecera name,phone o nombre,telefono.
              </p>
              <p className="text-sm leading-7 text-foreground-soft">
                Formato minimo, hasta 500 filas y solo contactos con telefono
                valido.
              </p>

              <form
                action="/api/contacts/import-csv"
                method="post"
                encType="multipart/form-data"
                className="mt-5 flex flex-col gap-4"
              >
                <input type="hidden" name="q" value={contactsData.searchTerm} />
                <input
                  type="hidden"
                  name="contact"
                  value={selectedContact?.id ?? ""}
                />
                <input
                  type="file"
                  name="file"
                  accept=".csv,text/csv"
                  className="block w-full min-w-0 rounded-2xl border border-dashed border-border bg-background-soft px-4 py-3 text-sm text-foreground file:mr-4 file:rounded-xl file:border-0 file:bg-[rgba(39,54,86,0.98)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground"
                />
                <button
                  type="submit"
                  className="h-11 rounded-2xl border border-[rgba(82,101,155,0.34)] bg-[linear-gradient(180deg,rgba(24,36,58,0.98),rgba(18,28,45,0.96))] px-5 text-sm font-semibold text-foreground shadow-[0_14px_30px_rgba(7,12,24,0.2)] transition hover:border-[rgba(98,119,180,0.42)] hover:bg-[linear-gradient(180deg,rgba(31,45,72,0.98),rgba(22,33,53,0.96))]"
                >
                  Importar CSV
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>
    </PanelSurface>
  );
}
