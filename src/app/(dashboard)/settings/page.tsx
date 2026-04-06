import { getSettingsData } from "@/app/services/settings/get-settings-data";
import { PanelSurface } from "@/web/components/ui/panel-surface";
import { StatusBadge } from "@/web/components/ui/status-badge";

function buildChannelStatusLabel(status: "active" | "inactive"): string {
  return status === "active" ? "Activo" : "Inactivo";
}

export default async function SettingsPage(props: PageProps<"/settings">) {
  const searchParams = await props.searchParams;
  const quickRepliesSaved = searchParams.quick_replies_saved === "1";
  const quickRepliesError =
    typeof searchParams.quick_replies_error === "string"
      ? searchParams.quick_replies_error
      : null;
  const settingsData = await getSettingsData();

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,420px)] xl:gap-6">
      <PanelSurface className="overflow-hidden bg-[linear-gradient(180deg,rgba(19,31,51,0.96),rgba(12,21,36,0.92))]">
        <div className="border-b border-border p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                Centro operativo
              </p>
              <h3 className="mt-3 text-3xl font-semibold text-foreground">
                Configuración real del workspace y sus integraciones.
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-muted/82">
                Esta vista muestra el estado operativo actual del workspace, el
                canal de WhatsApp más relevante y la disponibilidad de IA.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge tone="accent">
                {`${settingsData.totalChannels} canales`}
              </StatusBadge>
              <StatusBadge tone={settingsData.ai.isConfigured ? "success" : "warning"}>
                {settingsData.ai.isConfigured
                  ? "IA disponible"
                  : "IA no configurada"}
              </StatusBadge>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 lg:grid-cols-3">
          <div className="rounded-[28px] border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.9),rgba(13,23,39,0.82))] p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
              Workspace
            </p>
            <h4 className="mt-3 text-xl font-semibold text-foreground">
              {settingsData.workspace.name}
            </h4>
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground/94">Slug</p>
                <p className="mt-1 text-xs leading-6 text-foreground-soft">
                  {settingsData.workspace.slug}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/94">
                  Zona horaria
                </p>
                <p className="mt-1 text-xs leading-6 text-foreground-soft">
                  {settingsData.workspace.timezone}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/94">
                  Identificador
                </p>
                <p className="mt-1 text-xs leading-6 text-foreground-soft">
                  {settingsData.workspace.id}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.9),rgba(13,23,39,0.82))] p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
              Canal WhatsApp
            </p>
            {settingsData.channel ? (
              <>
                <h4 className="mt-3 text-xl font-semibold text-foreground">
                  {settingsData.channel.name}
                </h4>
                <div className="mt-3">
                  <StatusBadge
                    tone={
                      settingsData.channel.status === "active"
                        ? "success"
                        : "base"
                    }
                  >
                    {buildChannelStatusLabel(settingsData.channel.status)}
                  </StatusBadge>
                </div>
                <div className="mt-5 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-foreground/94">
                      Phone Number ID
                    </p>
                    <p className="mt-1 text-xs leading-6 text-foreground-soft">
                      {settingsData.channel.phoneNumberId ?? "No disponible"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/94">
                      Business Account ID
                    </p>
                    <p className="mt-1 text-xs leading-6 text-foreground-soft">
                      {settingsData.channel.businessAccountId ?? "No disponible"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/94">
                      Canal seleccionado
                    </p>
                    <p className="mt-1 text-xs leading-6 text-foreground-soft">
                      Se prioriza el canal activo más reciente del workspace.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-2xl border border-border bg-background-soft/60 p-4">
                <p className="text-sm font-medium text-foreground">
                  Sin canal configurado
                </p>
                <p className="mt-2 text-xs leading-6 text-foreground-muted">
                  El producto necesita al menos un canal registrado para operar
                  WhatsApp con datos reales.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.9),rgba(13,23,39,0.82))] p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
              Inteligencia
            </p>
            <h4 className="mt-3 text-xl font-semibold text-foreground">
              OpenAI
            </h4>
            <div className="mt-3">
              <StatusBadge tone={settingsData.ai.isConfigured ? "success" : "warning"}>
                {settingsData.ai.isConfigured
                  ? "Configurada"
                  : "No configurada"}
              </StatusBadge>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground/94">
                  Modelo efectivo
                </p>
                <p className="mt-1 text-xs leading-6 text-foreground-soft">
                  {settingsData.ai.model}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/94">
                  Estado operacional
                </p>
                <p className="mt-1 text-xs leading-6 text-foreground-soft">
                  {settingsData.ai.isConfigured
                    ? "La acción Generar borrador está disponible para asistir al agente humano."
                    : "Configura OPENAI_API_KEY para habilitar Generar borrador sin tocar el flujo manual de envío."}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/94">
                  Seguridad
                </p>
                <p className="mt-1 text-xs leading-6 text-foreground-soft">
                  La clave no se expone en esta interfaz y se usa solo en el servidor.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border p-6">
          <div className="rounded-[28px] border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.92),rgba(13,23,39,0.84))] p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                  Respuestas rápidas
                </p>
                <h4 className="mt-3 text-xl font-semibold text-foreground">
                  Biblioteca operativa de presupuesto
                </h4>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-foreground-muted/82">
                  Edita las cuatro respuestas rápidas disponibles en el composer
                  de Inbox. Las inactivas siguen editables aquí, pero no se muestran al agente.
                </p>
              </div>
              <StatusBadge tone="info">
                {`${settingsData.quickReplies.filter((reply) => reply.isActive).length} activas`}
              </StatusBadge>
            </div>

            {quickRepliesError ? (
              <p className="mt-4 rounded-2xl border border-warning/20 bg-warning-soft px-4 py-3 text-sm text-amber-200">
                {quickRepliesError}
              </p>
            ) : quickRepliesSaved ? (
              <p className="mt-4 rounded-2xl border border-success/20 bg-[rgba(31,74,58,0.24)] px-4 py-3 text-sm text-emerald-200">
                Las respuestas rápidas se guardaron correctamente.
              </p>
            ) : null}

            <form
              action="/api/settings/quick-replies"
              method="post"
              className="mt-5 space-y-4"
            >
              {settingsData.quickReplies.map((quickReply) => (
                <div
                  key={quickReply.id}
                  className="rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(14,23,38,0.92),rgba(11,18,31,0.88))] p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 space-y-4">
                      <label className="block">
                        <span className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                          Etiqueta
                        </span>
                        <input
                          type="text"
                          name={`label_${quickReply.id}`}
                          defaultValue={quickReply.label}
                          maxLength={60}
                          className="mt-2 h-11 w-full rounded-2xl border border-border bg-background-soft px-4 text-sm text-foreground outline-none transition focus:border-accent/40"
                        />
                      </label>

                      <label className="block">
                        <span className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                          Texto
                        </span>
                        <textarea
                          name={`text_${quickReply.id}`}
                          defaultValue={quickReply.text}
                          rows={3}
                          maxLength={280}
                          className="mt-2 w-full rounded-2xl border border-border bg-background-soft px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent/40"
                        />
                      </label>
                    </div>

                    <label className="flex min-w-[130px] items-center gap-3 rounded-2xl border border-border bg-background-soft/70 px-4 py-3">
                      <input
                        type="checkbox"
                        name={`active_${quickReply.id}`}
                        defaultChecked={quickReply.isActive}
                        className="size-4 rounded border border-border bg-background-soft text-accent"
                      />
                      <span className="text-sm text-foreground-soft">
                        Activa
                      </span>
                    </label>
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="h-12 rounded-2xl border border-[rgba(93,112,161,0.32)] bg-[linear-gradient(180deg,rgba(24,35,57,0.96),rgba(18,28,45,0.94))] px-5 text-sm font-semibold text-foreground shadow-[0_12px_28px_rgba(8,12,23,0.22)] transition hover:border-[rgba(108,128,188,0.42)] hover:bg-[linear-gradient(180deg,rgba(30,43,69,0.98),rgba(22,33,53,0.96))]"
                >
                  Guardar respuestas rápidas
                </button>
              </div>
            </form>
          </div>
        </div>
      </PanelSurface>

      <PanelSurface className="bg-[linear-gradient(180deg,rgba(18,29,49,0.94),rgba(12,20,35,0.9))] p-6">
        <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
          Estado general
        </p>
        <h4 className="mt-3 text-xl font-semibold text-foreground">
          Resumen operacional
        </h4>
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.9),rgba(13,23,39,0.82))] p-4">
            <p className="text-sm font-medium text-foreground/94">
              Workspace listo
            </p>
            <p className="mt-2 text-xs leading-6 text-foreground-soft">
              {settingsData.workspace.name} ya cuenta con identidad operativa
              real dentro del producto.
            </p>
          </div>

          <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.9),rgba(13,23,39,0.82))] p-4">
            <p className="text-sm font-medium text-foreground/94">
              Canal priorizado
            </p>
            <p className="mt-2 text-xs leading-6 text-foreground-soft">
              {settingsData.channel
                ? `${settingsData.channel.name} · ${buildChannelStatusLabel(
                    settingsData.channel.status,
                  )}`
                : "Todavía no hay canal disponible para operar WhatsApp."}
            </p>
          </div>

          <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.9),rgba(13,23,39,0.82))] p-4">
            <p className="text-sm font-medium text-foreground/94">
              Asistencia IA
            </p>
            <p className="mt-2 text-xs leading-6 text-foreground-soft">
              {settingsData.ai.isConfigured
                ? `OpenAI activa con ${settingsData.ai.model}.`
                : "OpenAI todavía no está configurada en este entorno."}
            </p>
          </div>
        </div>
      </PanelSurface>
    </div>
  );
}
