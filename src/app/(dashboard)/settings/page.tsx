import { PanelSurface } from "@/web/components/ui/panel-surface";
import { StatusBadge } from "@/web/components/ui/status-badge";

export default function SettingsPage() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,420px)] xl:gap-6">
      <PanelSurface className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-foreground-muted">
              Configuraci&oacute;n inicial
            </p>
            <h3 className="mt-3 text-3xl font-semibold text-foreground">
              Preparaci&oacute;n del entorno y del producto.
            </h3>
          </div>
          <StatusBadge>Sin conexi&oacute;n real todav&iacute;a</StatusBadge>
        </div>

        <div className="mt-8 space-y-4">
          {[
            "Variables de entorno",
            "Integraciones futuras",
            "Preferencias del workspace",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-border bg-background-soft/65 p-5"
            >
              <p className="text-sm font-semibold text-foreground">{item}</p>
              <p className="mt-2 text-xs leading-6 text-foreground-muted">
                Espacio base definido para evolucionar con GitHub, Vercel y
                Supabase sin adelantar implementaciones.
              </p>
            </div>
          ))}
        </div>
      </PanelSurface>

      <PanelSurface className="p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-foreground-muted">
          Checklist de etapa
        </p>
        <div className="mt-6 space-y-3">
          {[
            "Arquitectura en `src/`",
            "Alias listos",
            "Shell premium en espa&ntilde;ol",
            "`.env.example` documentado",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-2xl border border-border bg-background-soft/70 px-4 py-3"
            >
              <span className="size-2 rounded-full bg-emerald-300" />
              <span className="text-sm text-foreground">{item}</span>
            </div>
          ))}
        </div>
      </PanelSurface>
    </div>
  );
}
