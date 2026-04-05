import { getInboxData } from "@/app/services/inbox/get-inbox-data";
import { ConversationThread } from "@/web/components/conversation/conversation-thread";
import { ConversationList } from "@/web/components/inbox/conversation-list";
import { StatusBadge } from "@/web/components/ui/status-badge";
import { PanelSurface } from "@/web/components/ui/panel-surface";

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

export default async function InboxPage(props: PageProps<"/inbox">) {
  const searchParams = await props.searchParams;
  const selectedConversationId =
    typeof searchParams.conversation === "string"
      ? searchParams.conversation
      : undefined;
  const inboxData = await getInboxData(selectedConversationId);
  const hasConversations = inboxData.conversations.length > 0;
  const selectedConversation = inboxData.selectedConversation;

  return (
    <div className="grid h-full gap-4 xl:grid-cols-[minmax(0,1.5fr)_360px] xl:gap-6">
      <div className="grid gap-4 xl:grid-rows-[auto_minmax(0,1fr)] xl:gap-6">
        <PanelSurface className="bg-[linear-gradient(180deg,rgba(24,38,62,0.94),rgba(16,27,45,0.9))] p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                Resumen operativo
              </p>
              <h3 className="mt-3 text-3xl font-semibold text-foreground">
                Bandeja operativa conectada a conversaciones reales.
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-muted/82">
                La shell del inbox ya carga conversaciones y mensajes desde la
                base de datos, manteniendo una lectura clara y sobria.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge tone="accent">
                {`${inboxData.totalConversations} conversaciones`}
              </StatusBadge>
              <StatusBadge tone="success">Envío manual activo</StatusBadge>
            </div>
          </div>
        </PanelSurface>

        <PanelSurface className="overflow-hidden bg-[linear-gradient(180deg,rgba(19,31,51,0.96),rgba(12,21,36,0.92))]">
          <div className="grid h-full min-h-[520px] divide-y divide-border xl:grid-cols-[320px_minmax(0,1fr)] xl:divide-x xl:divide-y-0">
            <section className="bg-[linear-gradient(180deg,rgba(10,18,32,0.92),rgba(12,22,38,0.84))] p-5">
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
                  {hasConversations ? "Bandeja activa" : "Sin actividad"}
                </StatusBadge>
              </div>

              {hasConversations ? (
                <ConversationList
                  conversations={inboxData.conversations}
                  selectedConversationId={
                    selectedConversation?.conversationId ?? null
                  }
                />
              ) : (
                <div className="mt-6 rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(19,30,49,0.96),rgba(14,24,40,0.92))] px-4 py-5">
                  <p className="text-sm font-medium text-foreground">
                    Todavía no hay conversaciones registradas.
                  </p>
                  <p className="mt-2 text-xs leading-6 text-foreground-muted/76">
                    Cuando lleguen mensajes inbound al webhook, esta bandeja
                    mostrará aquí los contactos y su actividad reciente.
                  </p>
                </div>
              )}
            </section>

            <section className="bg-[linear-gradient(180deg,rgba(17,27,44,0.58),rgba(10,18,31,0.22))] p-6">
              {selectedConversation ? (
                <ConversationThread conversation={selectedConversation} />
              ) : (
                <div className="flex h-full flex-col justify-center rounded-[28px] border border-accent/16 bg-[radial-gradient(circle_at_top,rgba(111,124,255,0.12),transparent_28%),linear-gradient(180deg,rgba(22,35,56,0.82),rgba(12,20,34,0.66))] p-6 text-center shadow-[0_24px_70px_rgba(2,6,23,0.24)]">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                    Vista principal
                  </p>
                  <h4 className="mt-3 text-2xl font-semibold text-foreground">
                    El inbox está listo para recibir actividad real.
                  </h4>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-foreground-muted/82">
                    En cuanto lleguen eventos inbound desde WhatsApp, aquí
                    aparecerá el historial de mensajes de la conversación
                    seleccionada.
                  </p>
                </div>
              )}
            </section>
          </div>
        </PanelSurface>
      </div>

      <PanelSurface className="bg-[linear-gradient(180deg,rgba(18,29,49,0.94),rgba(12,20,35,0.9))] p-6">
        <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
          Panel lateral
        </p>
        <h4 className="mt-3 text-xl font-semibold text-foreground">
          Contexto operativo
        </h4>
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.9),rgba(13,23,39,0.82))] p-4 transition-all duration-200 hover:border-info/20 hover:shadow-[0_14px_34px_rgba(2,6,23,0.18)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground/94">
                Estado general del inbox
              </p>
              <span className="size-1.5 rounded-full bg-success/80" />
            </div>
            <p className="mt-2 text-xs leading-6 text-foreground-soft">
              {hasConversations
                ? `${inboxData.totalConversations} conversaciones disponibles en esta cuenta.`
                : "Sin conversaciones todavía en esta cuenta."}
            </p>
          </div>

          <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.9),rgba(13,23,39,0.82))] p-4 transition-all duration-200 hover:border-info/20 hover:shadow-[0_14px_34px_rgba(2,6,23,0.18)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground/94">
                Conversación seleccionada
              </p>
              <span className="size-1.5 rounded-full bg-info/80" />
            </div>
            <p className="mt-2 text-xs leading-6 text-foreground-soft">
              {selectedConversation
                ? `${selectedConversation.contactName} · ${selectedConversation.phone}`
                : "Selecciona una conversación cuando haya actividad disponible."}
            </p>
          </div>

          <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.9),rgba(13,23,39,0.82))] p-4 transition-all duration-200 hover:border-info/20 hover:shadow-[0_14px_34px_rgba(2,6,23,0.18)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground/94">
                Última actividad
              </p>
              <span className="size-1.5 rounded-full bg-accent/80" />
            </div>
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
