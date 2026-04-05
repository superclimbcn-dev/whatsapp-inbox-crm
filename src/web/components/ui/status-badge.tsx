import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  children: string;
  tone?: "base" | "accent" | "success" | "warning" | "info";
};

const toneMap: Record<NonNullable<StatusBadgeProps["tone"]>, string> = {
  base: "border-border bg-white/4 text-foreground-soft",
  accent:
    "border-accent/30 bg-accent-soft text-foreground shadow-[0_10px_24px_rgba(79,92,255,0.12)]",
  success:
    "border-emerald-400/18 bg-success-soft text-emerald-200 shadow-[0_10px_24px_rgba(34,197,94,0.1)]",
  warning:
    "border-amber-300/18 bg-warning-soft text-amber-200 shadow-[0_10px_24px_rgba(245,158,11,0.1)]",
  info: "border-sky-300/18 bg-info-soft text-sky-200 shadow-[0_10px_24px_rgba(56,189,248,0.1)]",
};

export function StatusBadge({ children, tone = "base" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.06em]",
        toneMap[tone],
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          tone === "accent" && "bg-accent",
          tone === "success" && "bg-success",
          tone === "warning" && "bg-warning",
          tone === "info" && "bg-info",
          tone === "base" && "bg-white/30",
        )}
      />
      {children}
    </span>
  );
}
