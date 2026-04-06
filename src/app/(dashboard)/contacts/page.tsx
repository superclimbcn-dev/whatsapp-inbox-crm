import Link from "next/link";

import { getContactsData } from "@/app/services/contacts/get-contacts-data";
import { PanelSurface } from "@/web/components/ui/panel-surface";
import { StatusBadge } from "@/web/components/ui/status-badge";

function formatActivityDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function buildStatusLabel(
  status: "closed" | "open" | "pending" | null,
): string {
  switch (status) {
    case "open":
      return "Conversación abierta";
    case "pending":
      return "Conversación pendiente";
    case "closed":
      return "Conversación cerrada";
    default:
      return "Sin conversación activa";
  }
}

function buildConversationFilterLabel(
  value: "all" | "with_conversation" | "without_conversation",
): string {
  switch (value) {
    case "with_conversation":
      return "Con conversación";
    case "without_conversation":
      return "Sin conversación";
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
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_420px] xl:gap-6">
      <PanelSurface className="overflow-hidden bg-[linear-gradient(180deg,rgba(19,31,51,0.96),rgba(12,21,36,0.92))]">
        <div className="border-b border-border p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                Directorio operativo
              </p>
              <h3 className="mt-3 text-3xl font-semibold text-foreground">
                Contactos reales conectados a la operación.
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-muted/82">
                Esta vista centraliza los contactos creados desde la operación
                real de WhatsApp y permite abrir su conversación vinculada.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge tone="accent">
                {`${contactsData.totalContacts} contactos`}
              </StatusBadge>
              <StatusBadge tone={hasContacts ? "success" : "base"}>
                {hasContacts ? "Directorio activo" : "Sin contactos"}
              </StatusBadge>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(14,23,38,0.92),rgba(11,18,31,0.9))] p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                  ImportaciÃ³n manual
                </p>
                <p className="mt-2 text-sm text-foreground/92">
                  Importa un CSV con cabecera <span className="font-medium text-foreground">name,phone</span> o <span className="font-medium text-foreground">nombre,telefono</span>.
                </p>
                <p className="mt-1 text-xs leading-6 text-foreground-soft">
                  Formato mÃ­nimo, hasta 500 filas y solo contactos con telÃ©fono vÃ¡lido.
                </p>
              </div>

              <form
                action="/api/contacts/import-csv"
                method="post"
                encType="multipart/form-data"
                className="flex w-full flex-col gap-3 lg:max-w-xl lg:flex-row lg:items-center"
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
                  className="block h-12 flex-1 rounded-2xl border border-border bg-background-soft px-4 py-3 text-sm text-foreground file:mr-4 file:rounded-xl file:border-0 file:bg-[rgba(46,62,109,0.96)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                />
                <button
                  type="submit"
                  className="h-12 rounded-2xl border border-[rgba(93,112,161,0.32)] bg-[linear-gradient(180deg,rgba(24,35,57,0.96),rgba(18,28,45,0.94))] px-5 text-sm font-semibold text-foreground shadow-[0_12px_28px_rgba(8,12,23,0.22)] transition hover:border-[rgba(108,128,188,0.42)] hover:bg-[linear-gradient(180deg,rgba(30,43,69,0.98),rgba(22,33,53,0.96))]"
                >
                  Importar CSV
                </button>
              </form>
            </div>

            {importError ? (
              <p className="mt-4 rounded-2xl border border-warning/20 bg-warning-soft px-4 py-3 text-sm text-amber-200">
                {importError}
              </p>
            ) : importedCount !== null &&
              duplicatedCount !== null &&
              ignoredCount !== null ? (
              <div className="mt-4 flex flex-wrap gap-3">
                <StatusBadge tone="success">{`${importedCount} importados`}</StatusBadge>
                <StatusBadge tone="info">{`${duplicatedCount} duplicados`}</StatusBadge>
                <StatusBadge tone="base">{`${ignoredCount} ignorados`}</StatusBadge>
              </div>
            ) : null}
          </div>

          <form className="mt-6" action="/contacts" method="get">
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                Buscar contacto
              </span>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  type="search"
                  name="q"
                  defaultValue={contactsData.searchTerm}
                  placeholder="Buscar por nombre o teléfono"
                  className="h-12 flex-1 rounded-2xl border border-border bg-background-soft px-4 text-sm text-foreground outline-none transition focus:border-accent/40"
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
                  className="h-12 rounded-2xl border border-[rgba(88,108,176,0.44)] bg-[linear-gradient(180deg,rgba(66,84,142,0.96),rgba(41,55,98,0.98))] px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(14,20,38,0.26)] transition hover:border-[rgba(108,128,196,0.52)] hover:bg-[linear-gradient(180deg,rgba(76,95,156,0.98),rgba(46,62,109,1))]"
                >
                  Buscar
                </button>
              </div>
            </label>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {(["all", "with_conversation", "without_conversation"] as const).map(
              (filterOption) => {
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
                        ? "rounded-2xl border border-[rgba(88,108,176,0.44)] bg-[linear-gradient(180deg,rgba(66,84,142,0.96),rgba(41,55,98,0.98))] px-4 py-2 text-xs font-medium text-white shadow-[0_12px_28px_rgba(14,20,38,0.26)]"
                        : "rounded-2xl border border-[rgba(106,124,184,0.22)] bg-[linear-gradient(180deg,rgba(20,30,49,0.96),rgba(13,22,38,0.94))] px-4 py-2 text-xs font-medium text-foreground-soft transition hover:border-[rgba(106,124,184,0.36)] hover:bg-[linear-gradient(180deg,rgba(27,39,63,0.98),rgba(16,26,44,0.96))] hover:text-foreground"
                    }
                  >
                    {buildConversationFilterLabel(filterOption)}
                  </a>
                );
              },
            )}
          </div>
        </div>

        <div className="grid min-h-[520px] divide-y divide-border xl:grid-cols-[320px_minmax(0,1fr)] xl:divide-x xl:divide-y-0">
          <section className="bg-[linear-gradient(180deg,rgba(10,18,32,0.92),rgba(12,22,38,0.84))] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                  Contactos
                </p>
                <h4 className="mt-2 text-lg font-semibold text-foreground">
                  Directorio
                </h4>
              </div>
              <StatusBadge tone="info">
                {hasContacts ? "Listado real" : "Sin resultados"}
              </StatusBadge>
            </div>

            {hasContacts ? (
              <div className="mt-6 space-y-3">
                {contactsData.contacts.map((contact) => {
                  const isActive = contact.id === selectedContact?.id;

                  return (
                    <Link
                      key={contact.id}
                      href={buildContactsHref(
                        contact.id,
                        contactsData.searchTerm,
                        contactsData.conversationFilter,
                      )}
                      className={`block rounded-2xl border px-4 py-4 shadow-[var(--shadow-layer)] transition-all duration-200 ${
                        isActive
                          ? "border-accent/28 bg-[linear-gradient(180deg,rgba(32,46,74,0.98),rgba(18,29,48,0.95))] shadow-[var(--shadow-accent)]"
                          : "border-border-strong bg-[linear-gradient(180deg,rgba(19,30,49,0.98),rgba(14,24,40,0.94))] hover:border-accent/24 hover:bg-[linear-gradient(180deg,rgba(24,37,60,0.98),rgba(16,27,45,0.96))] hover:shadow-[0_18px_38px_rgba(2,6,23,0.24)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground/96">
                            {contact.displayName}
                          </p>
                          <p className="mt-1 truncate text-xs text-foreground-soft">
                            {contact.phone}
                          </p>
                        </div>
                        <p className="text-[11px] text-foreground-soft">
                          {formatActivityDate(contact.lastActivityAt)}
                        </p>
                      </div>
                      <p className="mt-3 text-[11px] uppercase tracking-[0.08em] text-foreground-soft">
                        {buildStatusLabel(contact.status)}
                      </p>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(19,30,49,0.96),rgba(14,24,40,0.92))] px-4 py-5">
                <p className="text-sm font-medium text-foreground">
                  No encontramos contactos para esta búsqueda.
                </p>
                <p className="mt-2 text-xs leading-6 text-foreground-muted/76">
                  Los contactos reales se crean automáticamente cuando llegan
                  conversaciones inbound al webhook.
                </p>
              </div>
            )}
          </section>

          <section className="bg-[linear-gradient(180deg,rgba(17,27,44,0.58),rgba(10,18,31,0.22))] p-6">
            {selectedContact ? (
              <div className="flex h-full flex-col rounded-[28px] border border-accent/16 bg-[radial-gradient(circle_at_top,rgba(111,124,255,0.12),transparent_28%),linear-gradient(180deg,rgba(22,35,56,0.82),rgba(12,20,34,0.66))] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.24)]">
                <div className="border-b border-border pb-5">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                    Contacto seleccionado
                  </p>
                  <h4 className="mt-3 text-2xl font-semibold text-foreground">
                    {selectedContact.displayName}
                  </h4>
                  <p className="mt-2 text-sm text-foreground-muted/82">
                    {selectedContact.phone}
                  </p>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.9),rgba(13,23,39,0.82))] p-4">
                    <p className="text-sm font-medium text-foreground/94">
                      Teléfono
                    </p>
                    <p className="mt-2 text-xs leading-6 text-foreground-soft">
                      {selectedContact.phone}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.9),rgba(13,23,39,0.82))] p-4">
                    <p className="text-sm font-medium text-foreground/94">
                      Identificador WA
                    </p>
                    <p className="mt-2 text-xs leading-6 text-foreground-soft">
                      {selectedContact.waContactId ?? "No disponible"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.9),rgba(13,23,39,0.82))] p-4">
                    <p className="text-sm font-medium text-foreground/94">
                      Última actividad
                    </p>
                    <p className="mt-2 text-xs leading-6 text-foreground-soft">
                      {formatActivityDate(selectedContact.lastActivityAt)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.9),rgba(13,23,39,0.82))] p-4">
                    <p className="text-sm font-medium text-foreground/94">
                      Estado operativo
                    </p>
                    <p className="mt-2 text-xs leading-6 text-foreground-soft">
                      {buildStatusLabel(selectedContact.status)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 border-t border-border pt-5">
                  {selectedContact.conversationId ? (
                    <Link
                      href={`/inbox?conversation=${selectedContact.conversationId}`}
                      className="inline-flex h-12 items-center rounded-2xl border border-[rgba(88,108,176,0.44)] bg-[linear-gradient(180deg,rgba(66,84,142,0.96),rgba(41,55,98,0.98))] px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(14,20,38,0.26)] transition hover:border-[rgba(108,128,196,0.52)] hover:bg-[linear-gradient(180deg,rgba(76,95,156,0.98),rgba(46,62,109,1))]"
                    >
                      Abrir conversación en Inbox
                    </Link>
                  ) : (
                    <p className="text-sm text-foreground-muted/82">
                      Este contacto todavía no tiene una conversación activa en
                      Inbox.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col justify-center rounded-[28px] border border-accent/16 bg-[radial-gradient(circle_at_top,rgba(111,124,255,0.12),transparent_28%),linear-gradient(180deg,rgba(22,35,56,0.82),rgba(12,20,34,0.66))] p-6 text-center shadow-[0_24px_70px_rgba(2,6,23,0.24)]">
                <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                  Ficha operativa
                </p>
                <h4 className="mt-3 text-2xl font-semibold text-foreground">
                  Todavía no hay contactos disponibles.
                </h4>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-foreground-muted/82">
                  Cuando llegue actividad real desde WhatsApp, esta vista
                  mostrará aquí el detalle del contacto seleccionado.
                </p>
              </div>
            )}
          </section>
        </div>
      </PanelSurface>

      <PanelSurface className="bg-[linear-gradient(180deg,rgba(18,29,49,0.94),rgba(12,20,35,0.9))] p-6">
        <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
          Panel lateral
        </p>
        <h4 className="mt-3 text-xl font-semibold text-foreground">
          Contexto del contacto
        </h4>
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.9),rgba(13,23,39,0.82))] p-4">
            <p className="text-sm font-medium text-foreground/94">
              Estado del directorio
            </p>
            <p className="mt-2 text-xs leading-6 text-foreground-soft">
              {hasContacts
                ? `${contactsData.totalContacts} contactos disponibles en esta cuenta.`
                : "Sin contactos disponibles todavía en esta cuenta."}
            </p>
          </div>

          <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.9),rgba(13,23,39,0.82))] p-4">
            <p className="text-sm font-medium text-foreground/94">
              Contacto seleccionado
            </p>
            <p className="mt-2 text-xs leading-6 text-foreground-soft">
              {selectedContact
                ? `${selectedContact.displayName} · ${selectedContact.phone}`
                : "Selecciona un contacto cuando haya actividad disponible."}
            </p>
          </div>

          <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.9),rgba(13,23,39,0.82))] p-4">
            <p className="text-sm font-medium text-foreground/94">
              Última actividad
            </p>
            <p className="mt-2 text-xs leading-6 text-foreground-soft">
              {selectedContact
                ? formatActivityDate(selectedContact.lastActivityAt)
                : "Sin actividad reciente"}
            </p>
          </div>
        </div>
      </PanelSurface>
    </div>
  );
}
