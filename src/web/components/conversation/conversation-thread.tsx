"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { InboxSelection } from "@/app/services/inbox/get-inbox-data";
import { cn } from "@/lib/utils";

type ConversationThreadProps = {
  conversation: InboxSelection;
};

function formatMessageDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function buildStatusLabel(status: InboxSelection["status"]): string {
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

function buildOutboundMessageStatusLabel(
  status: InboxSelection["messages"][number]["status"],
): string {
  switch (status) {
    case "sent":
      return "Enviado";
    case "delivered":
      return "Entregado";
    case "read":
      return "Leído";
    case "failed":
      return "Fallido";
    case "queued":
      return "En cola";
    case "received":
      return "Recibido";
    default:
      return "Sin estado";
  }
}

export function ConversationThread({
  conversation,
}: ConversationThreadProps) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTakingControl, setIsTakingControl] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedDraft = draft.trim();

    if (!trimmedDraft) {
      setError("Escribe un mensaje antes de enviarlo.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversationId: conversation.conversationId,
        text: trimmedDraft,
      }),
    });

    const result = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setError(result?.error ?? "No pudimos enviar el mensaje.");
      setIsSubmitting(false);
      return;
    }

    setDraft("");
    setIsSubmitting(false);
    router.refresh();
  }

  async function handleTakeControl() {
    setError(null);
    setIsTakingControl(true);

    const response = await fetch("/api/conversations/take-control", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversationId: conversation.conversationId,
      }),
    });

    const result = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setError(result?.error ?? "No pudimos tomar control de la conversación.");
      setIsTakingControl(false);
      return;
    }

    setIsTakingControl(false);
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col rounded-[28px] border border-accent/16 bg-[radial-gradient(circle_at_top,rgba(111,124,255,0.12),transparent_28%),linear-gradient(180deg,rgba(22,35,56,0.82),rgba(12,20,34,0.66))] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.24)]">
      <div className="flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
            Conversación activa
          </p>
          <h4 className="mt-3 text-2xl font-semibold text-foreground">
            {conversation.contactName}
          </h4>
          <p className="mt-2 text-sm text-foreground-muted/82">
            {conversation.phone}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.12em] text-foreground-soft">
            {conversation.controlLabel}
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "size-2 rounded-full",
                conversation.status === "open" && "bg-success",
                conversation.status === "pending" && "bg-warning",
                conversation.status === "closed" && "bg-foreground-soft",
              )}
            />
            <span className="text-xs uppercase tracking-[0.12em] text-foreground-soft">
              {buildStatusLabel(conversation.status)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleTakeControl}
            disabled={!conversation.isTakeControlAvailable || isTakingControl}
            className="rounded-2xl border border-border bg-white/[0.03] px-4 py-2 text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted transition hover:border-accent/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {conversation.controlState === "mine"
              ? "Bajo mi control"
              : isTakingControl
                ? "Tomando control..."
                : "Tomar control"}
          </button>
        </div>
      </div>

      <div className="mt-6 flex-1 space-y-4 overflow-y-auto pr-1">
        {conversation.messages.length === 0 ? (
          <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.9),rgba(13,23,39,0.76))] px-5 py-6 text-sm text-foreground-muted/82">
            Esta conversación todavía no tiene mensajes visibles.
          </div>
        ) : (
          conversation.messages.map((message) => {
            const isInbound = message.direction === "inbound";

            return (
              <article
                key={message.id}
                className={cn(
                  "max-w-[85%] rounded-3xl border px-4 py-4 shadow-[var(--shadow-layer)]",
                  isInbound
                    ? "border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.92),rgba(13,23,39,0.8))]"
                    : "ml-auto border-accent/24 bg-[linear-gradient(180deg,rgba(66,79,151,0.24),rgba(28,40,64,0.88))]",
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] uppercase tracking-[0.12em] text-foreground-soft">
                    {isInbound ? "Entrante" : "Saliente"}
                  </span>
                  <div className="text-right">
                    <span className="block text-[11px] text-foreground-soft">
                      {formatMessageDate(message.sentAt)}
                    </span>
                    {!isInbound ? (
                      <span className="mt-1 block text-[11px] uppercase tracking-[0.08em] text-foreground-soft">
                        {buildOutboundMessageStatusLabel(message.status)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-foreground/94">
                  {message.body}
                </p>
              </article>
            );
          })
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 border-t border-border pt-5"
      >
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
            Respuesta manual
          </span>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Escribe un mensaje para este contacto"
              className="h-12 flex-1 rounded-2xl border border-border bg-background-soft px-4 text-sm text-foreground outline-none transition focus:border-accent/40"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 rounded-2xl bg-accent px-5 text-sm font-semibold text-white transition hover:bg-[#6170ff] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </label>

        {error ? (
          <p className="mt-3 rounded-2xl border border-warning/20 bg-warning-soft px-4 py-3 text-sm text-amber-200">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
