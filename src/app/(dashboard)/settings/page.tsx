import { getSettingsData } from "@/app/services/settings/get-settings-data";
import { QuickRepliesSettingsCard } from "@/web/components/settings/quick-replies-settings-card";
import { PanelSurface } from "@/web/components/ui/panel-surface";
import { StatusBadge } from "@/web/components/ui/status-badge";

function buildChannelStatusLabel(status: "active" | "inactive"): string {
  return status === "active" ? "Activo" : "Inactivo";
}

export default async function SettingsPage() {
  const settingsData = await getSettingsData();

  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-6">
      <PanelSurface className="flex min-h-0 flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(19,31,51,0.96),rgba(12,21,36,0.92))]">
        <div className="border-b border-border px-6 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                Centro operativo
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-foreground">
                Configuracion real del workspace y sus integraciones.
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-muted/82">
                Esta vista concentra el estado del workspace, el canal
                principal, OpenAI y la biblioteca operativa sin comprimir el
                contenido.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
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

        <div className="min-h-0 flex-1 overflow-y-auto p-6 pr-5">
          <div className="mx-auto flex max-w-[1120px] flex-col gap-4">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="rounded-[28px] border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.9),rgba(13,23,39,0.82))] p-5">
                <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                  Workspace
                </p>
                <h4 className="mt-3 text-xl font-semibold text-foreground">
                  {settingsData.workspace.name}
                </h4>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
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
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <h4 className="text-xl font-semibold text-foreground">
                        {settingsData.channel.name}
                      </h4>
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

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
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
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-foreground/94">
                          Criterio de prioridad
                        </p>
                        <p className="mt-1 text-xs leading-6 text-foreground-soft">
                          Se prioriza el canal activo mas reciente del workspace.
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
                      El producto necesita al menos un canal registrado para
                      operar WhatsApp con datos reales.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.9),rgba(13,23,39,0.82))] p-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                Inteligencia
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h4 className="text-xl font-semibold text-foreground">OpenAI</h4>
                <StatusBadge tone={settingsData.ai.isConfigured ? "success" : "warning"}>
                  {settingsData.ai.isConfigured ? "Configurada" : "No configurada"}
                </StatusBadge>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
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
                      ? "Generar borrador esta disponible para asistir al agente humano."
                      : "Configura OPENAI_API_KEY para habilitar Generar borrador sin tocar el flujo manual."}
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

            <QuickRepliesSettingsCard initialQuickReplies={settingsData.quickReplies} />
          </div>
        </div>
      </PanelSurface>

      <PanelSurface className="flex min-h-0 flex-col bg-[linear-gradient(180deg,rgba(18,29,49,0.9),rgba(12,20,35,0.86))] p-5">
        <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
          Contexto
        </p>
        <h4 className="mt-2 text-lg font-semibold text-foreground">
          Resumen operacional
        </h4>

        <div className="mt-5 min-h-0 space-y-4 overflow-y-auto pr-1">
          <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.86),rgba(13,23,39,0.8))] p-4">
            <p className="text-sm font-medium text-foreground/94">
              Workspace listo
            </p>
            <p className="mt-2 text-xs leading-6 text-foreground-soft">
              {settingsData.workspace.name} ya cuenta con identidad operativa
              real dentro del producto.
            </p>
          </div>

          <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.86),rgba(13,23,39,0.8))] p-4">
            <p className="text-sm font-medium text-foreground/94">
              Canal priorizado
            </p>
            <p className="mt-2 text-xs leading-6 text-foreground-soft">
              {settingsData.channel
                ? `${settingsData.channel.name} · ${buildChannelStatusLabel(
                    settingsData.channel.status,
                  )}`
                : "Todavia no hay canal disponible para operar WhatsApp."}
            </p>
          </div>

          <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.86),rgba(13,23,39,0.8))] p-4">
            <p className="text-sm font-medium text-foreground/94">
              Asistencia IA
            </p>
            <p className="mt-2 text-xs leading-6 text-foreground-soft">
              {settingsData.ai.isConfigured
                ? `OpenAI activa con ${settingsData.ai.model}.`
                : "OpenAI todavia no esta configurada en este entorno."}
            </p>
          </div>

          <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.86),rgba(13,23,39,0.8))] p-4">
            <p className="text-sm font-medium text-foreground/94">
              Biblioteca activa
            </p>
            <p className="mt-2 text-xs leading-6 text-foreground-soft">
              {`${settingsData.quickReplies.filter((reply) => reply.isActive).length} respuestas rapidas activas en este workspace.`}
            </p>
          </div>
        </div>
      </PanelSurface>
    </div>
  );
}
