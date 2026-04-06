"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import type { InboxSelection } from "@/app/services/inbox/get-inbox-data";
import { cn } from "@/lib/utils";

type ConversationThreadProps = {
  conversation: InboxSelection;
};

const QUICK_REPLIES = [
  {
    id: "photos",
    label: "Pedir fotos",
    text: "Para prepararte un presupuesto preciso, ¿me puedes enviar fotos del sofá, alfombra o superficie a tratar?",
  },
  {
    id: "location",
    label: "Pedir ubicación",
    text: "¿Me compartes la zona o ubicación del servicio para revisar disponibilidad y presupuesto?",
  },
  {
    id: "service",
    label: "Tipo de servicio",
    text: "¿Qué servicio necesitas exactamente: limpieza de sofá, impermeabilización o lavado de alfombra/tapete?",
  },
  {
    id: "measurements",
    label: "Medidas / cantidad",
    text: "¿Me indicas cuántas piezas son y las medidas aproximadas para calcular mejor el presupuesto?",
  },
] as const;

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
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTakingControl, setIsTakingControl] = useState(false);
  const submitInFlightRef = useRef(false);

  function applyQuickReply(nextText: string) {
    setDraft((currentDraft) => {
      const trimmedDraft = currentDraft.trim();

      if (!trimmedDraft) {
        return nextText;
      }

      return `${currentDraft.trimEnd()}\n\n${nextText}`;
    });

    if (error) {
      setError(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitInFlightRef.current) {
      return;
    }

    const trimmedDraft = draft.trim();

    if (!trimmedDraft) {
      setError("Escribe un mensaje antes de enviarlo.");
      return;
    }

    setError(null);
    submitInFlightRef.current = true;
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
      submitInFlightRef.current = false;
      setIsSubmitting(false);
      return;
    }

    setDraft("");
    submitInFlightRef.current = false;
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

  async function handleGenerateDraft() {
    if (isGeneratingDraft) {
      return;
    }

    setError(null);
    setIsGeneratingDraft(true);

    try {
      const response = await fetch("/api/ai/reply-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: conversation.conversationId,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { draft?: string; error?: string }
        | null;

      if (!response.ok || typeof result?.draft !== "string") {
        setError(result?.error ?? "No pudimos generar el borrador.");
        return;
      }

      setDraft(result.draft);
    } catch {
      setError("No pudimos generar el borrador.");
    } finally {
      setIsGeneratingDraft(false);
    }
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
                      <span
                        className={cn(
                          "mt-1 block text-[11px] uppercase tracking-[0.08em]",
                          message.status === "sent" && "text-foreground-soft",
                          message.status === "delivered" && "text-info",
                          message.status === "read" && "text-success",
                          message.status === "failed" && "text-warning",
                          message.status === "queued" && "text-foreground-soft",
                          message.status === "received" && "text-foreground-soft",
                        )}
                      >
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
            Atajos de presupuesto
          </span>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_REPLIES.map((quickReply) => (
              <button
                key={quickReply.id}
                type="button"
                onClick={() => applyQuickReply(quickReply.text)}
                disabled={isSubmitting || isGeneratingDraft}
                className="rounded-2xl border border-[rgba(106,124,184,0.22)] bg-[linear-gradient(180deg,rgba(20,30,49,0.96),rgba(13,22,38,0.94))] px-4 py-2 text-xs font-medium text-foreground-soft transition hover:border-[rgba(106,124,184,0.36)] hover:bg-[linear-gradient(180deg,rgba(27,39,63,0.98),rgba(16,26,44,0.96))] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-70"
              >
                {quickReply.label}
              </button>
            ))}
          </div>
        </label>

        <label className="mt-5 block">
          <span className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
            Respuesta manual
          </span>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);

                if (error) {
                  setError(null);
                }
              }}
              placeholder="Escribe un mensaje para este contacto"
              className="h-12 flex-1 rounded-2xl border border-border bg-background-soft px-4 text-sm text-foreground outline-none transition focus:border-accent/40"
              disabled={isSubmitting || isGeneratingDraft}
            />
            <button
              type="button"
              onClick={handleGenerateDraft}
              disabled={isGeneratingDraft || isSubmitting}
              className="h-12 rounded-2xl border border-[rgba(106,124,184,0.22)] bg-[linear-gradient(180deg,rgba(20,30,49,0.96),rgba(13,22,38,0.94))] px-5 text-sm font-semibold text-foreground transition hover:border-[rgba(106,124,184,0.36)] hover:bg-[linear-gradient(180deg,rgba(27,39,63,0.98),rgba(16,26,44,0.96))] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isGeneratingDraft ? "Generando..." : "Generar borrador"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isGeneratingDraft}
              className="h-12 rounded-2xl border border-[rgba(88,108,176,0.44)] bg-[linear-gradient(180deg,rgba(66,84,142,0.96),rgba(41,55,98,0.98))] px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(14,20,38,0.26)] transition hover:border-[rgba(108,128,196,0.52)] hover:bg-[linear-gradient(180deg,rgba(76,95,156,0.98),rgba(46,62,109,1))] disabled:cursor-not-allowed disabled:opacity-70"
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
