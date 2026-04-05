"use client";

import { usePathname } from "next/navigation";

import { LogoutButton } from "@/web/features/auth/logout-button";
import { StatusBadge } from "@/web/components/ui/status-badge";

const pageConfig: Record<string, { eyebrow: string; title: string }> = {
  "/inbox": {
    eyebrow: "Workspace",
    title: "Bandeja de entrada",
  },
  "/contacts": {
    eyebrow: "Workspace",
    title: "Contactos",
  },
  "/settings": {
    eyebrow: "Workspace",
    title: "Configuración",
  },
};

type DashboardTopbarProps = {
  userEmail: string;
};

export function DashboardTopbar({ userEmail }: DashboardTopbarProps) {
  const pathname = usePathname();
  const currentPage = pageConfig[pathname] ?? {
    eyebrow: "Workspace",
    title: "Panel",
  };

  return (
    <header className="relative flex min-h-[76px] items-center justify-between overflow-hidden rounded-[28px] border border-border-strong bg-[linear-gradient(180deg,rgba(25,37,59,0.88),rgba(14,23,38,0.88))] px-6 py-4 shadow-[var(--shadow-soft)] backdrop-blur-md">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-28 bg-[linear-gradient(90deg,rgba(111,124,255,0.14),transparent)]" />
      <div className="relative">
        <p className="text-[11px] uppercase tracking-[0.28em] text-foreground-muted/72">
          {currentPage.eyebrow}
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-foreground">
          {currentPage.title}
        </h2>
      </div>
      <div className="relative flex items-center gap-3">
        <div className="hidden items-center gap-3 rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 md:flex">
          <div className="flex size-8 items-center justify-center rounded-xl border border-accent/20 bg-accent-soft text-[11px] font-semibold text-foreground">
            WS
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-foreground-soft">
              Sesión activa
            </p>
            <p className="max-w-[220px] truncate text-sm text-foreground-muted">
              {userEmail}
            </p>
          </div>
        </div>
        <StatusBadge tone="info">Workspace activo</StatusBadge>
        <StatusBadge tone="accent">Etapa 0.4</StatusBadge>
        <LogoutButton />
      </div>
    </header>
  );
}
