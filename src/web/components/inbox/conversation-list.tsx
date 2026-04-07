import Link from "next/link";

import type { InboxConversation } from "@/app/services/inbox/get-inbox-data";
import { cn } from "@/lib/utils";

type ConversationListProps = {
  conversations: InboxConversation[];
  crmFilter: "all" | InboxConversation["crmState"];
  ownerFilter: "all" | InboxConversation["controlState"];
  selectedConversationId: string | null;
};

function formatConversationDate(value: string | null): string {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function buildStatusLabel(status: InboxConversation["status"]): string {
  switch (status) {
    case "open":
      return "Abierta";
    case "pending":
      return "Pendiente";
    case "closed":
      return "Cerrada";
    default:
      return "Sin estado";
  }
}

function buildControlToneClass(
  controlState: InboxConversation["controlState"],
): string {
  switch (controlState) {
    case "mine":
      return "text-success";
    case "other":
      return "text-warning";
    case "free":
      return "text-foreground-soft";
    default:
      return "text-foreground-soft";
  }
}

function buildCrmStateLabel(state: InboxConversation["crmState"]): string {
  switch (state) {
    case "nuevo":
      return "Nuevo";
    case "pendiente":
      return "Pendiente";
    case "presupuesto_enviado":
      return "Presupuesto";
    case "agendado":
      return "Agendado";
    case "cerrado":
      return "Cerrado";
    case "perdido":
      return "Perdido";
    default:
      return "Nuevo";
  }
}

function buildCrmToneClass(state: InboxConversation["crmState"]): string {
  switch (state) {
    case "pendiente":
      return "text-warning";
    case "presupuesto_enviado":
      return "text-info";
    case "agendado":
      return "text-success";
    case "cerrado":
      return "text-foreground-soft";
    case "perdido":
      return "text-rose-300";
    case "nuevo":
    default:
      return "text-foreground-soft";
  }
}

export function ConversationList({
  conversations,
  crmFilter,
  ownerFilter,
  selectedConversationId,
}: ConversationListProps) {
  return (
    <div className="mt-4 h-full space-y-3 overflow-y-auto pr-1">
      {conversations.map((conversation) => {
        const isActive = conversation.id === selectedConversationId;

        return (
          <Link
            key={conversation.id}
            href={`/inbox?${new URLSearchParams({
              conversation: conversation.id,
              ...(crmFilter !== "all" ? { crm: crmFilter } : {}),
              ...(ownerFilter !== "all" ? { owner: ownerFilter } : {}),
            }).toString()}`}
            className={cn(
              "block rounded-2xl border px-4 py-4 shadow-[var(--shadow-layer)] transition-all duration-200",
              isActive
                ? "border-accent/28 bg-[linear-gradient(180deg,rgba(32,46,74,0.98),rgba(18,29,48,0.95))] shadow-[var(--shadow-accent)]"
                : "border-border-strong bg-[linear-gradient(180deg,rgba(19,30,49,0.98),rgba(14,24,40,0.94))] hover:border-accent/24 hover:bg-[linear-gradient(180deg,rgba(24,37,60,0.98),rgba(16,27,45,0.96))] hover:shadow-[0_18px_38px_rgba(2,6,23,0.24)]",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground/96">
                  {conversation.displayName}
                </p>
                <p className="mt-1 truncate text-xs text-foreground-soft">
                  {conversation.phone}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-foreground-soft">
                  {formatConversationDate(conversation.lastMessageAt)}
                </p>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      conversation.status === "open" && "bg-success",
                      conversation.status === "pending" && "bg-warning",
                      conversation.status === "closed" && "bg-foreground-soft",
                    )}
                  />
                  <span className="text-[11px] uppercase tracking-[0.08em] text-foreground-soft">
                    {buildStatusLabel(conversation.status)}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-3 line-clamp-2 text-xs leading-6 text-foreground-muted/76">
              {conversation.preview}
            </p>
            <p
              className={cn(
                "mt-2 text-[11px] uppercase tracking-[0.08em]",
                buildCrmToneClass(conversation.crmState),
              )}
            >
              {buildCrmStateLabel(conversation.crmState)}
            </p>
            <p
              className={cn(
                "mt-2 text-[11px] uppercase tracking-[0.08em]",
                buildControlToneClass(conversation.controlState),
              )}
            >
              {conversation.controlLabel}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
