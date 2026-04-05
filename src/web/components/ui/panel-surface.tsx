import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PanelSurfaceProps = {
  children: ReactNode;
  className?: string;
};

export function PanelSurface({ children, className }: PanelSurfaceProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-border-strong bg-[linear-gradient(180deg,rgba(20,32,53,0.96),rgba(12,21,36,0.92))] shadow-[var(--shadow-soft)] backdrop-blur-sm transition-[border-color,box-shadow,transform,background-color] duration-200 hover:border-accent/18 hover:shadow-[0_24px_65px_rgba(2,6,23,0.32)]",
        className,
      )}
    >
      {children}
    </section>
  );
}
