"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import type { InboxSelection } from "@/app/services/inbox/get-inbox-data";
import { buildCrmStateLabel, buildCrmStateToneClass, CRM_STATES, type CrmState } from "@/core/crm/crm-state";
import {
  buildQuickReplyStageLabel,
  findNextQuickReplyStage,
  QUICK_REPLY_STAGES,
  type QuickReplyStage,
} from "@/core/settings/quick-replies";
import { cn } from "@/lib/utils";
import { QuickReplyPalette } from "./quick-reply-palette";

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
      return "Leido";
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
  const [crmInternalNote, setCrmInternalNote] = useState(
    conversation.crmInternalNote,
  );
  const [crmState, setCrmState] = useState<CrmState>(conversation.crmState);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [isSavingCrm, setIsSavingCrm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTakingControl, setIsTakingControl] = useState(false);
  const [selectedStage, setSelectedStage] = useState<QuickReplyStage | null>(
    null,
  );
  const [hasManualStageOverride, setHasManualStageOverride] = useState(false);
  const submitInFlightRef = useRef(false);
  const [showQuickReplyPalette, setShowQuickReplyPalette] = useState(false);
  const [quickReplyPalettePosition, setQuickReplyPalettePosition] = useState<{
    bottom: number;
    left: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickReplyGroups = useMemo(() => {
    return QUICK_REPLY_STAGES.map((stage) => ({
      replies: conversation.quickReplies.filter((reply) => reply.stage === stage),
      stage,
    })).filter((group) => group.replies.length > 0);
  }, [conversation.quickReplies]);

  const availableStages = useMemo(
    () => quickReplyGroups.map((group) => group.stage),
    [quickReplyGroups],
  );

  const selectedStageReplies = useMemo(() => {
    if (!selectedStage) {
      return [];
    }

    return (
      quickReplyGroups.find((group) => group.stage === selectedStage)?.replies ?? []
    );
  }, [quickReplyGroups, selectedStage]);

  useEffect(() => {
    setSelectedStage(
      conversation.suggestedQuickReplyStage &&
        availableStages.includes(conversation.suggestedQuickReplyStage)
        ? conversation.suggestedQuickReplyStage
        : (availableStages[0] ?? null),
    );
    setHasManualStageOverride(false);
  }, [availableStages, conversation.conversationId, conversation.suggestedQuickReplyStage]);

  useEffect(() => {
    if (selectedStage && availableStages.includes(selectedStage)) {
      return;
    }

    setSelectedStage(
      conversation.suggestedQuickReplyStage &&
        availableStages.includes(conversation.suggestedQuickReplyStage)
        ? conversation.suggestedQuickReplyStage
        : (availableStages[0] ?? null),
    );
  }, [availableStages, conversation.suggestedQuickReplyStage, selectedStage]);

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

    if (selectedStage) {
      const nextStage = findNextQuickReplyStage(selectedStage, availableStages);

      if (nextStage) {
        setSelectedStage(nextStage);
      }
    }

    setHasManualStageOverride(false);
  }

  async function handleSaveCrm() {
    if (isSavingCrm) {
      return;
    }

    setError(null);
    setIsSavingCrm(true);

    try {
      const response = await fetch("/api/conversations/crm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: conversation.conversationId,
          crmState,
          internalNote: crmInternalNote,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setError(result?.error ?? "No pudimos guardar el contexto CRM.");
        return;
      }

      router.refresh();
    } catch {
      setError("No pudimos guardar el contexto CRM.");
    } finally {
      setIsSavingCrm(false);
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
      setError(result?.error ?? "No pudimos tomar control de la conversacion.");
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

  const suggestedStage = conversation.suggestedQuickReplyStage;

  return (
    <div className="flex h-full min-h-0 flex-col rounded-[28px] border border-accent/16 bg-[radial-gradient(circle_at_top,rgba(111,124,255,0.12),transparent_28%),linear-gradient(180deg,rgba(22,35,56,0.82),rgba(12,20,34,0.66))] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.24)]">
      <div className="flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
            Conversacion activa
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

      <div className="mt-6 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {conversation.messages.length === 0 ? (
          <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.9),rgba(13,23,39,0.76))] px-5 py-6 text-sm text-foreground-muted/82">
            Esta conversacion todavia no tiene mensajes visibles.
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
        className="sticky bottom-0 mt-6 border-t border-border bg-[linear-gradient(180deg,rgba(12,20,34,0.18),rgba(12,20,34,0.94)_18%,rgba(12,20,34,0.98))] pt-5 backdrop-blur-sm"
      >
        <div className="mb-5 rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(16,26,43,0.94),rgba(12,20,35,0.88))] p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                  Contexto CRM
                </p>
                <p
                  className={cn(
                    "mt-2 text-[11px] uppercase tracking-[0.08em]",
                    buildCrmStateToneClass(crmState),
                  )}
                >
                  {buildCrmStateLabel(crmState)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveCrm}
                disabled={isSavingCrm || isSubmitting || isGeneratingDraft}
                className="rounded-2xl border border-[rgba(106,124,184,0.22)] bg-[linear-gradient(180deg,rgba(20,30,49,0.96),rgba(13,22,38,0.94))] px-4 py-2 text-xs font-medium text-foreground transition hover:border-[rgba(106,124,184,0.36)] hover:bg-[linear-gradient(180deg,rgba(27,39,63,0.98),rgba(16,26,44,0.96))] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSavingCrm ? "Guardando..." : "Guardar contexto"}
              </button>
            </div>

            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                Estado del lead
              </span>
              <select
                value={crmState}
                onChange={(event) => setCrmState(event.target.value as CrmState)}
                disabled={isSavingCrm}
                className="mt-2 h-12 w-full rounded-2xl border border-border bg-background-soft px-4 text-sm text-foreground outline-none transition focus:border-accent/40"
              >
                {CRM_STATES.map((stateOption) => (
                  <option key={stateOption} value={stateOption}>
                    {buildCrmStateLabel(stateOption)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                Nota interna
              </span>
              <textarea
                value={crmInternalNote}
                onChange={(event) => setCrmInternalNote(event.target.value)}
                maxLength={500}
                rows={3}
                disabled={isSavingCrm}
                placeholder="Anade una nota operativa breve para esta conversacion"
                className="mt-2 w-full rounded-2xl border border-border bg-background-soft px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent/40"
              />
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(16,26,43,0.94),rgba(12,20,35,0.88))] p-4">
          <div className="flex flex-col gap-4">
            <div>
              <span className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                Biblioteca guiada
              </span>
              <p className="mt-2 text-sm text-foreground-muted/82">
                Elige una etapa y despues una respuesta activa para insertarla en el mensaje manual.
              </p>
            </div>

            {availableStages.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {availableStages.map((stage) => {
                    const isActive = stage === selectedStage;
                    const isSuggested = stage === suggestedStage;

                    return (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => {
                          setSelectedStage(stage);
                          setHasManualStageOverride(true);
                        }}
                        disabled={isSubmitting || isGeneratingDraft}
                        className={
                          isActive
                            ? "rounded-2xl border border-[rgba(88,108,176,0.44)] bg-[linear-gradient(180deg,rgba(66,84,142,0.96),rgba(41,55,98,0.98))] px-4 py-2 text-xs font-medium text-white shadow-[0_12px_28px_rgba(14,20,38,0.26)]"
                            : "rounded-2xl border border-[rgba(106,124,184,0.22)] bg-[linear-gradient(180deg,rgba(20,30,49,0.96),rgba(13,22,38,0.94))] px-4 py-2 text-xs font-medium text-foreground-soft transition hover:border-[rgba(106,124,184,0.36)] hover:bg-[linear-gradient(180deg,rgba(27,39,63,0.98),rgba(16,26,44,0.96))] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-70"
                        }
                      >
                        <span>{buildQuickReplyStageLabel(stage)}</span>
                        {isSuggested ? (
                          <span className="ml-2 text-[10px] uppercase tracking-[0.12em] text-foreground-soft/80">
                            Sugerida
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                {suggestedStage && !hasManualStageOverride ? (
                  <p className="text-[11px] uppercase tracking-[0.12em] text-foreground-muted/68">
                    Sugerencia activa: {buildQuickReplyStageLabel(suggestedStage)}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {selectedStageReplies.map((quickReply) => (
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
              </>
            ) : (
              <p className="rounded-2xl border border-border bg-background-soft/70 px-4 py-3 text-sm text-foreground-muted/82">
                No hay respuestas activas para este workspace todavia.
              </p>
            )}
          </div>
        </div>

        <label className="mt-5 block">
          <span className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
            Respuesta manual
          </span>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(event) => {
                  const newValue = event.target.value;
                  setDraft(newValue);

                  // Close palette if "/" is no longer in the input
                  if (showQuickReplyPalette && !newValue.includes("/")) {
                    setShowQuickReplyPalette(false);
                  }

                  if (error) {
                    setError(null);
                  }
                }}
                onKeyDown={(event) => {
                  console.log("Key pressed:", event.key, "Current draft:", draft);

                  // Detect "/" to trigger quick reply palette
                  if (event.key === "/" && !showQuickReplyPalette && !isGeneratingDraft && !isSubmitting) {
                    console.log("Trigger '/' detected - opening palette");
                    // Use setTimeout to ensure the "/" is added to the input first
                    setTimeout(() => {
                      if (inputRef.current) {
                        const rect = inputRef.current.getBoundingClientRect();
                        // Calculate bottom position: distance from bottom of viewport to top of input
                        // This positions the palette above the input
                        const bottom = window.innerHeight - rect.top + 8;
                        setQuickReplyPalettePosition({
                          bottom,
                          left: rect.left,
                        });
                        setShowQuickReplyPalette(true);
                        console.log("Palette opened at position:", { bottom, left: rect.left, windowHeight: window.innerHeight, inputTop: rect.top });
                      }
                    }, 0);
                  }

                  // Handle Escape to close palette
                  if (event.key === "Escape" && showQuickReplyPalette) {
                    console.log("Escape pressed - closing palette");
                    setShowQuickReplyPalette(false);
                    event.preventDefault();
                  }

                  // Handle Arrow keys for navigation when palette is open
                  if (showQuickReplyPalette && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
                    // Let the palette handle keyboard navigation
                    event.stopPropagation();
                  }
                }}
                placeholder="Escribe un mensaje para este contacto"
                className="h-12 flex-1 rounded-2xl border border-border bg-background-soft px-4 text-sm text-foreground outline-none transition focus:border-accent/40"
                disabled={isSubmitting || isGeneratingDraft}
              />
              {showQuickReplyPalette && (
                <QuickReplyPalette
                  quickReplies={conversation.quickReplies}
                  onSelect={(reply) => {
                    // Remove trailing "/" and insert the reply text
                    const textWithoutSlash = draft.endsWith("/")
                      ? draft.slice(0, -1)
                      : draft;
                    setDraft(`${textWithoutSlash}${reply.text}`);
                    setShowQuickReplyPalette(false);
                    inputRef.current?.focus();
                  }}
                  onClose={() => {
                    setShowQuickReplyPalette(false);
                    inputRef.current?.focus();
                  }}
                  anchorPosition={quickReplyPalettePosition ?? undefined}
                />
              )}
            </div>
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
