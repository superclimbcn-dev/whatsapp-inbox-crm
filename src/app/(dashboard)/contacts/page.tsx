import Link from "next/link";

import { getContactsData } from "@/app/services/contacts/get-contacts-data";
import { getSettingsData } from "@/app/services/settings/get-settings-data";
import { CRM_STATES, type CrmState } from "@/core/crm/crm-state";
import { ContactsWorkspace } from "@/web/components/contacts/contacts-workspace";
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

function buildCrmFilterLabel(value: CrmState | "all"): string {
  switch (value) {
    case "nuevo":
      return "Nuevo";
    case "pendiente":
      return "Pendiente";
    case "presupuesto_enviado":
      return "Presupuesto enviado";
    case "agendado":
      return "Agendado";
    case "cerrado":
      return "Cerrado";
    case "perdido":
      return "Perdido";
    default:
      return "Todos";
  }
}

const detailAvatarPalette = [
  "bg-[linear-gradient(180deg,rgba(24,104,132,0.96),rgba(16,70,97,0.98))] text-cyan-100 shadow-[0_16px_34px_rgba(8,56,79,0.34)] ring-1 ring-cyan-300/16",
  "bg-[linear-gradient(180deg,rgba(77,52,156,0.96),rgba(50,33,104,0.98))] text-violet-100 shadow-[0_16px_34px_rgba(40,28,92,0.34)] ring-1 ring-violet-300/16",
  "bg-[linear-gradient(180deg,rgba(21,117,91,0.96),rgba(15,76,60,0.98))] text-emerald-100 shadow-[0_16px_34px_rgba(13,64,52,0.34)] ring-1 ring-emerald-300/16",
  "bg-[linear-gradient(180deg,rgba(133,98,24,0.96),rgba(87,63,16,0.98))] text-amber-100 shadow-[0_16px_34px_rgba(78,55,13,0.34)] ring-1 ring-amber-300/16",
  "bg-[linear-gradient(180deg,rgba(136,44,92,0.96),rgba(87,27,58,0.98))] text-fuchsia-100 shadow-[0_16px_34px_rgba(79,21,52,0.34)] ring-1 ring-fuchsia-300/16",
  "bg-[linear-gradient(180deg,rgba(43,82,156,0.96),rgba(28,54,102,0.98))] text-sky-100 shadow-[0_16px_34px_rgba(18,44,88,0.34)] ring-1 ring-sky-300/16",
] as const;

function getDetailAvatarTone(value: string): string {
  const seed = Array.from(value).reduce(
    (accumulator, character) => accumulator + character.charCodeAt(0),
    0,
  );

  return detailAvatarPalette[seed % detailAvatarPalette.length];
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
  const crmFilter =
    typeof searchParams.crm === "string" &&
    CRM_STATES.includes(searchParams.crm as CrmState)
      ? (searchParams.crm as CrmState)
      : "all";
  const importedCount = parseImportMetric(searchParams.imported);
  const duplicatedCount = parseImportMetric(searchParams.duplicated);
  const ignoredCount = parseImportMetric(searchParams.ignored);
  const importError =
    typeof searchParams.import_error === "string"
      ? searchParams.import_error
      : null;
  const [contactsData, settingsData] = await Promise.all([
    getContactsData(
      selectedContactId,
      searchTerm,
      conversationFilter,
      crmFilter,
    ),
    getSettingsData(),
  ]);
  const hasContacts = contactsData.contacts.length > 0;
  const selectedContact = contactsData.selectedContact;

  return (
    <PanelSurface className="flex min-h-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(70,110,204,0.16),transparent_32%),radial-gradient(circle_at_top_right,rgba(27,143,111,0.14),transparent_26%),linear-gradient(180deg,rgba(18,28,45,0.98),rgba(10,18,31,0.96))]">
      <div className="flex min-h-full flex-1 flex-col overflow-y-auto px-5 py-5 xl:px-6 xl:py-6">
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

        <div className="mt-5 grid min-h-fit flex-1 items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_380px]">
          <div className="flex min-h-[760px] flex-col gap-5">
            <section className="rounded-[30px] border border-[rgba(118,138,195,0.16)] bg-[radial-gradient(circle_at_top_left,rgba(82,108,185,0.12),transparent_34%),linear-gradient(180deg,rgba(20,30,49,0.96),rgba(15,24,40,0.92))] px-5 py-5 shadow-[0_24px_64px_rgba(2,6,23,0.22)]">
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
                      <input
                        type="hidden"
                        name="crm"
                        value={
                          contactsData.crmFilter === "all"
                            ? ""
                            : contactsData.crmFilter
                        }
                      />
                      <button
                        type="submit"
                        className="h-11 shrink-0 rounded-2xl border border-emerald-300/18 bg-[linear-gradient(180deg,rgba(20,118,92,0.98),rgba(14,88,68,0.96))] px-5 text-sm font-semibold text-emerald-50 shadow-[0_16px_34px_rgba(9,58,46,0.28)] transition duration-200 hover:-translate-y-[1px] hover:border-emerald-200/26 hover:bg-[linear-gradient(180deg,rgba(24,132,103,0.98),rgba(16,96,75,0.96))] hover:shadow-[0_22px_40px_rgba(8,49,40,0.34)]"
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

                    if (contactsData.crmFilter !== "all") {
                      params.set("crm", contactsData.crmFilter);
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
                            ? "rounded-2xl border border-[rgba(86,107,167,0.42)] bg-[linear-gradient(180deg,rgba(41,56,89,0.98),rgba(26,39,63,0.96))] px-4 py-2 text-xs font-medium text-foreground shadow-[0_14px_28px_rgba(7,12,24,0.2)]"
                            : "rounded-2xl border border-[rgba(96,114,170,0.2)] bg-[linear-gradient(180deg,rgba(18,28,45,0.94),rgba(13,22,37,0.92))] px-4 py-2 text-xs font-medium text-foreground-soft transition duration-200 hover:-translate-y-[1px] hover:border-[rgba(96,114,170,0.34)] hover:bg-[linear-gradient(180deg,rgba(23,35,56,0.96),rgba(15,25,42,0.94))] hover:text-foreground"
                        }
                      >
                        {buildConversationFilterLabel(filterOption)}
                      </a>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-2">
                  {(["all", ...CRM_STATES] as const).map((filterOption) => {
                    const params = new URLSearchParams();

                    if (contactsData.searchTerm) {
                      params.set("q", contactsData.searchTerm);
                    }

                    if (contactsData.conversationFilter !== "all") {
                      params.set("conversation", contactsData.conversationFilter);
                    }

                    if (filterOption !== "all") {
                      params.set("crm", filterOption);
                    }

                    const href = params.toString()
                      ? `/contacts?${params.toString()}`
                      : "/contacts";
                    const isActive = contactsData.crmFilter === filterOption;

                    return (
                      <a
                        key={filterOption}
                        href={href}
                        className={
                          isActive
                            ? "rounded-2xl border border-[rgba(86,107,167,0.42)] bg-[linear-gradient(180deg,rgba(41,56,89,0.98),rgba(26,39,63,0.96))] px-4 py-2 text-xs font-medium text-foreground shadow-[0_14px_28px_rgba(7,12,24,0.2)]"
                            : "rounded-2xl border border-[rgba(96,114,170,0.2)] bg-[linear-gradient(180deg,rgba(18,28,45,0.94),rgba(13,22,37,0.92))] px-4 py-2 text-xs font-medium text-foreground-soft transition duration-200 hover:-translate-y-[1px] hover:border-[rgba(96,114,170,0.34)] hover:bg-[linear-gradient(180deg,rgba(23,35,56,0.96),rgba(15,25,42,0.94))] hover:text-foreground"
                        }
                      >
                        {buildCrmFilterLabel(filterOption)}
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

            <ContactsWorkspace
              contacts={contactsData.contacts}
              conversationFilter={contactsData.conversationFilter}
              crmFilter={contactsData.crmFilter}
              hasContacts={hasContacts}
              quickReplies={settingsData.quickReplies.filter((reply) => reply.isActive)}
              searchTerm={contactsData.searchTerm}
              selectedContactId={selectedContact?.id ?? null}
            />
          </div>

          <div className="flex min-h-[760px] flex-col gap-5">
            <section className="rounded-[30px] border border-[rgba(118,138,195,0.16)] bg-[radial-gradient(circle_at_top_left,rgba(65,96,170,0.14),transparent_30%),linear-gradient(180deg,rgba(20,30,49,0.96),rgba(15,24,40,0.92))] px-5 py-5 shadow-[0_24px_64px_rgba(2,6,23,0.22)]">
              {selectedContact ? (
                <div className="flex flex-col gap-5">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                      Contacto seleccionado
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-semibold ${getDetailAvatarTone(selectedContact.displayName)}`}
                    >
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
                        className="inline-flex h-11 items-center justify-center rounded-2xl border border-emerald-300/18 bg-[linear-gradient(180deg,rgba(19,118,91,0.98),rgba(14,87,67,0.96))] px-5 text-sm font-semibold text-emerald-50 shadow-[0_16px_34px_rgba(9,58,46,0.28)] transition duration-200 hover:-translate-y-[1px] hover:border-emerald-200/26 hover:bg-[linear-gradient(180deg,rgba(23,132,102,0.98),rgba(16,95,74,0.96))] hover:shadow-[0_22px_40px_rgba(8,49,40,0.34)]"
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

            <section className="rounded-[30px] border border-[rgba(118,138,195,0.14)] bg-[radial-gradient(circle_at_top_left,rgba(24,132,103,0.08),transparent_34%),linear-gradient(180deg,rgba(18,28,45,0.94),rgba(13,22,37,0.92))] px-5 py-5 shadow-[0_18px_46px_rgba(2,6,23,0.16)]">
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
                  name="conversation"
                  value={
                    contactsData.conversationFilter === "all"
                      ? ""
                      : contactsData.conversationFilter
                  }
                />
                <input
                  type="hidden"
                  name="crm"
                  value={contactsData.crmFilter === "all" ? "" : contactsData.crmFilter}
                />
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
                  className="h-11 rounded-2xl border border-[rgba(82,101,155,0.34)] bg-[linear-gradient(180deg,rgba(24,36,58,0.98),rgba(18,28,45,0.96))] px-5 text-sm font-semibold text-foreground shadow-[0_14px_30px_rgba(7,12,24,0.2)] transition duration-200 hover:-translate-y-[1px] hover:border-[rgba(98,119,180,0.42)] hover:bg-[linear-gradient(180deg,rgba(31,45,72,0.98),rgba(22,33,53,0.96))]"
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
