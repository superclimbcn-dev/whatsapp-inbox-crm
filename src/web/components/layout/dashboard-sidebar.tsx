"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navigationItems = [
  {
    href: "/inbox",
    label: "Inbox",
    description: "Bandeja operativa",
  },
  {
    href: "/contacts",
    label: "Contactos",
    description: "Directorio comercial",
  },
  {
    href: "/settings",
    label: "Configuración",
    description: "Preferencias base",
  },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full max-w-[288px] flex-col rounded-[28px] border border-border-strong bg-[linear-gradient(180deg,rgba(22,35,56,0.96),rgba(9,17,31,0.94))] p-4 shadow-[var(--shadow-panel)] backdrop-blur-md">
      <div className="border-b border-border px-3 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-accent/30 bg-[linear-gradient(180deg,rgba(111,124,255,0.24),rgba(111,124,255,0.08))] text-sm font-semibold text-foreground shadow-[var(--shadow-accent)]">
            ND
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/80">
              Nexo Digital
            </p>
            <h1 className="mt-1 text-base font-semibold text-foreground">
              WhatsApp Inbox
            </h1>
            <p className="mt-1 text-xs text-foreground-soft">
              Consola operativa premium
            </p>
          </div>
        </div>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-2.5">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group rounded-2xl border px-4 py-3 transition-all duration-200",
                isActive
                  ? "border-border-accent bg-[linear-gradient(180deg,rgba(111,124,255,0.18),rgba(111,124,255,0.1))] shadow-[var(--shadow-accent)]"
                  : "border-transparent bg-transparent hover:border-white/10 hover:bg-white/[0.035] hover:shadow-[0_12px_32px_rgba(2,6,23,0.18)]",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p
                  className={cn(
                    "text-sm font-semibold transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-foreground/92 group-hover:text-foreground",
                  )}
                >
                  {item.label}
                </p>
                <span
                  className={cn(
                    "size-2 rounded-full transition-all duration-200",
                    isActive
                      ? "bg-accent shadow-[0_0_18px_rgba(111,124,255,0.85)]"
                      : "bg-white/10 group-hover:bg-accent/70",
                  )}
                />
              </div>
              <p
                className={cn(
                  "mt-1 text-xs",
                  isActive
                    ? "text-foreground-muted/90"
                    : "text-foreground-soft group-hover:text-foreground-muted/80",
                )}
              >
                {item.description}
              </p>
            </Link>
          );
        })}
      </nav>

      <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(7,14,25,0.96),rgba(11,21,36,0.92))] px-4 py-4 shadow-[var(--shadow-layer)]">
        <p className="text-[11px] uppercase tracking-[0.22em] text-foreground-muted/75">
          Estado del workspace
        </p>
        <p className="mt-3 text-sm font-medium leading-6 text-foreground/92">
          Fundación visual lista para evolucionar a Inbox + CRM.
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-200/90">
          <span className="size-2 rounded-full bg-success shadow-[0_0_12px_rgba(74,222,128,0.45)]" />
          Shell base activa
        </div>
        <div className="mt-4 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted/70">
            Señal operativa
          </p>
          <p className="mt-2 text-xs leading-5 text-foreground-soft">
            Navegación lista para crecer con inbox, contactos y configuración.
          </p>
        </div>
      </div>
    </aside>
  );
}
