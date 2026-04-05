import { PanelSurface } from "@/web/components/ui/panel-surface";
import { StatusBadge } from "@/web/components/ui/status-badge";

export default function ContactsPage() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_420px] xl:gap-6">
      <PanelSurface className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-foreground-muted">
              Directorio base
            </p>
            <h3 className="mt-3 text-3xl font-semibold text-foreground">
              Estructura inicial para contactos y relaciones.
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-muted">
              Esta vista deja el terreno listo para el futuro CRM sin incorporar
              todav&iacute;a modelos, tablas ni flujos reales.
            </p>
          </div>
          <StatusBadge tone="accent">Base visual</StatusBadge>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            "Listado principal",
            "Segmentos",
            "Historial comercial",
            "Notas contextuales",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-border bg-background-soft/65 p-5"
            >
              <p className="text-sm font-semibold text-foreground">{item}</p>
              <p className="mt-3 text-xs leading-6 text-foreground-muted">
                Placeholder sobrio para organizar el crecimiento de la capa CRM
                en una fase posterior.
              </p>
            </div>
          ))}
        </div>
      </PanelSurface>

      <PanelSurface className="p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-foreground-muted">
          Panel contextual
        </p>
        <h4 className="mt-3 text-xl font-semibold text-foreground">
          Ficha de referencia
        </h4>
        <div className="mt-6 rounded-[28px] border border-border-strong bg-background-soft/70 p-5">
          <p className="text-sm font-medium text-foreground">
            Contacto seleccionado
          </p>
          <p className="mt-3 text-sm leading-7 text-foreground-muted">
            Cuando llegue la fase CRM, aqu&iacute; vivir&aacute;n atributos,
            historial y acciones relacionadas. En esta etapa solo definimos la
            shell visual.
          </p>
        </div>
      </PanelSurface>
    </div>
  );
}
