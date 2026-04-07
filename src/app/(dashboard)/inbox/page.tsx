import { getInboxData } from "@/app/services/inbox/get-inbox-data";
import { CRM_STATES, type CrmState } from "@/core/crm/crm-state";
import { ConversationThread } from "@/web/components/conversation/conversation-thread";
import { InboxAutoRefresh } from "@/web/components/inbox/inbox-auto-refresh";
import { ConversationList } from "@/web/components/inbox/conversation-list";
import { PanelSurface } from "@/web/components/ui/panel-surface";
import { StatusBadge } from "@/web/components/ui/status-badge";

function formatSummaryDate(value: string | null): string {
  if (!value) {
    return "Sin actividad reciente";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
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

function buildInboxHref(
  conversationId: string | undefined,
  crmFilter: CrmState | "all",
  ownerFilter: "all" | "free" | "mine" | "other",
): string {
  const params = new URLSearchParams();

  if (conversationId) {
    params.set("conversation", conversationId);
  }

  if (crmFilter !== "all") {
    params.set("crm", crmFilter);
  }

  if (ownerFilter !== "all") {
    params.set("owner", ownerFilter);
  }

  const query = params.toString();

  return query ? `/inbox?${query}` : "/inbox";
}

function buildOwnerFilterLabel(value: "all" | "free" | "mine" | "other"): string {
  switch (value) {
    case "mine":
      return "Bajo mi control";
    case "free":
      return "Libres";
    case "other":
      return "Tomadas";
    default:
      return "Todos";
  }
}

export default async function InboxPage(props: PageProps<"/inbox">) {
  const searchParams = await props.searchParams;
  const selectedConversationId =
    typeof searchParams.conversation === "string"
      ? searchParams.conversation
      : undefined;
  const crmFilter =
    typeof searchParams.crm === "string" &&
    CRM_STATES.includes(searchParams.crm as CrmState)
      ? (searchParams.crm as CrmState)
      : "all";
  const ownerFilter =
    searchParams.owner === "mine" ||
    searchParams.owner === "free" ||
    searchParams.owner === "other"
      ? searchParams.owner
      : "all";
  const inboxData = await getInboxData(
    selectedConversationId,
    crmFilter,
    ownerFilter,
  );
  const hasConversations = inboxData.conversations.length > 0;
  const selectedConversation = inboxData.selectedConversation;

  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-6">
      <InboxAutoRefresh />

      <PanelSurface className="flex min-h-0 flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(19,31,51,0.96),rgba(12,21,36,0.92))]">
        <div className="border-b border-border px-6 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                Workspace operativo
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-foreground">
                Inbox conectada a conversaciones reales.
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge tone="accent">
                {`${inboxData.totalConversations} conversaciones`}
              </StatusBadge>
              <StatusBadge tone="success">Envio manual activo</StatusBadge>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {(["all", ...CRM_STATES] as const).map((filterOption) => {
              const isActive = inboxData.crmFilter === filterOption;

              return (
                <a
                  key={filterOption}
                  href={buildInboxHref(
                    selectedConversationId,
                    filterOption,
                    inboxData.ownerFilter,
                  )}
                  className={
                    isActive
                      ? "rounded-2xl border border-[rgba(88,108,176,0.44)] bg-[linear-gradient(180deg,rgba(66,84,142,0.96),rgba(41,55,98,0.98))] px-4 py-2 text-xs font-medium text-white shadow-[0_12px_28px_rgba(14,20,38,0.26)]"
                      : "rounded-2xl border border-[rgba(106,124,184,0.22)] bg-[linear-gradient(180deg,rgba(20,30,49,0.96),rgba(13,22,38,0.94))] px-4 py-2 text-xs font-medium text-foreground-soft transition hover:border-[rgba(106,124,184,0.36)] hover:bg-[linear-gradient(180deg,rgba(27,39,63,0.98),rgba(16,26,44,0.96))] hover:text-foreground"
                  }
                >
                  {buildCrmFilterLabel(filterOption)}
                </a>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(["all", "mine", "free", "other"] as const).map((filterOption) => {
              const isActive = inboxData.ownerFilter === filterOption;

              return (
                <a
                  key={filterOption}
                  href={buildInboxHref(
                    selectedConversationId,
                    inboxData.crmFilter,
                    filterOption,
                  )}
                  className={
                    isActive
                      ? "rounded-2xl border border-[rgba(88,108,176,0.44)] bg-[linear-gradient(180deg,rgba(66,84,142,0.96),rgba(41,55,98,0.98))] px-4 py-2 text-xs font-medium text-white shadow-[0_12px_28px_rgba(14,20,38,0.26)]"
                      : "rounded-2xl border border-[rgba(106,124,184,0.22)] bg-[linear-gradient(180deg,rgba(20,30,49,0.96),rgba(13,22,38,0.94))] px-4 py-2 text-xs font-medium text-foreground-soft transition hover:border-[rgba(106,124,184,0.36)] hover:bg-[linear-gradient(180deg,rgba(27,39,63,0.98),rgba(16,26,44,0.96))] hover:text-foreground"
                  }
                >
                  {buildOwnerFilterLabel(filterOption)}
                </a>
              );
            })}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 divide-y divide-border xl:grid-cols-[300px_minmax(0,1fr)] xl:divide-x xl:divide-y-0">
          <section className="flex min-h-0 flex-col bg-[linear-gradient(180deg,rgba(10,18,32,0.92),rgba(12,22,38,0.84))] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                  Bandeja
                </p>
                <h4 className="mt-2 text-lg font-semibold text-foreground">
                  Conversaciones
                </h4>
              </div>
              <StatusBadge tone="info">
                {hasConversations ? "Activa" : "Sin actividad"}
              </StatusBadge>
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-hidden">
              {hasConversations ? (
                <ConversationList
                  conversations={inboxData.conversations}
                  crmFilter={inboxData.crmFilter}
                  ownerFilter={inboxData.ownerFilter}
                  selectedConversationId={
                    selectedConversation?.conversationId ?? null
                  }
                />
              ) : (
                <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(19,30,49,0.96),rgba(14,24,40,0.92))] px-4 py-5">
                  <p className="text-sm font-medium text-foreground">
                    No hay conversaciones para este filtro.
                  </p>
                  <p className="mt-2 text-xs leading-6 text-foreground-muted/76">
                    Ajusta el estado CRM o espera nueva actividad inbound desde
                    WhatsApp.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="min-h-0 bg-[linear-gradient(180deg,rgba(17,27,44,0.58),rgba(10,18,31,0.22))] p-6">
            {selectedConversation ? (
              <ConversationThread conversation={selectedConversation} />
            ) : (
              <div className="flex h-full flex-col justify-center rounded-[28px] border border-accent/16 bg-[radial-gradient(circle_at_top,rgba(111,124,255,0.12),transparent_28%),linear-gradient(180deg,rgba(22,35,56,0.82),rgba(12,20,34,0.66))] p-6 text-center shadow-[0_24px_70px_rgba(2,6,23,0.24)]">
                <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                  Vista principal
                </p>
                <h4 className="mt-3 text-2xl font-semibold text-foreground">
                  El inbox esta listo para recibir actividad real.
                </h4>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-foreground-muted/82">
                  En cuanto lleguen eventos inbound desde WhatsApp, aqui
                  aparecera el historial de mensajes de la conversacion
                  seleccionada.
                </p>
              </div>
            )}
          </section>
        </div>
      </PanelSurface>

      <PanelSurface className="flex min-h-0 flex-col bg-[linear-gradient(180deg,rgba(18,29,49,0.9),rgba(12,20,35,0.86))] p-5">
        <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
          Contexto
        </p>
        <h4 className="mt-2 text-lg font-semibold text-foreground">
          Rail operacional
        </h4>

        <div className="mt-5 min-h-0 space-y-4 overflow-y-auto pr-1">
          <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.86),rgba(13,23,39,0.8))] p-4">
            <p className="text-sm font-medium text-foreground/94">
              Estado general
            </p>
            <p className="mt-2 text-xs leading-6 text-foreground-soft">
              {hasConversations
                ? `${inboxData.totalConversations} conversaciones disponibles en este filtro.`
                : "Sin conversaciones disponibles para este estado CRM."}
            </p>
          </div>

          <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.86),rgba(13,23,39,0.8))] p-4">
            <p className="text-sm font-medium text-foreground/94">
              Conversacion seleccionada
            </p>
            <p className="mt-2 text-xs leading-6 text-foreground-soft">
              {selectedConversation
                ? `${selectedConversation.contactName} · ${selectedConversation.phone}`
                : "Selecciona una conversacion cuando haya actividad disponible."}
            </p>
          </div>

          <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.86),rgba(13,23,39,0.8))] p-4">
            <p className="text-sm font-medium text-foreground/94">
              Ultima actividad
            </p>
            <p className="mt-2 text-xs leading-6 text-foreground-soft">
              {selectedConversation
                ? formatSummaryDate(
                    selectedConversation.messages.at(-1)?.sentAt ?? null,
                  )
                : "Sin actividad reciente"}
            </p>
          </div>
        </div>
      </PanelSurface>
    </div>
  );
}
