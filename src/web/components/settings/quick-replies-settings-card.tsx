"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  buildQuickReplyStageLabel,
  createEmptyQuickReply,
  QUICK_REPLY_STAGES,
  type QuickReply,
} from "@/core/settings/quick-replies";

type QuickRepliesSettingsCardProps = {
  initialQuickReplies: QuickReply[];
};

type SaveResponse = {
  error?: string;
  ok?: boolean;
};

export function QuickRepliesSettingsCard({
  initialQuickReplies,
}: QuickRepliesSettingsCardProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [quickReplies, setQuickReplies] =
    useState<QuickReply[]>(initialQuickReplies);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const activeCount = useMemo(
    () => quickReplies.filter((reply) => reply.isActive).length,
    [quickReplies],
  );

  function updateQuickReply(
    id: string,
    updater: (reply: QuickReply) => QuickReply,
  ) {
    setQuickReplies((currentReplies) =>
      currentReplies.map((reply) =>
        reply.id === id ? updater(reply) : reply,
      ),
    );
  }

  function handleAddQuickReply() {
    setError(null);
    setSaveMessage(null);
    setQuickReplies((currentReplies) => [
      ...currentReplies,
      createEmptyQuickReply(),
    ]);
  }

  function handleRemoveQuickReply(id: string) {
    setError(null);
    setSaveMessage(null);
    setQuickReplies((currentReplies) =>
      currentReplies.filter((reply) => reply.id !== id),
    );
  }

  async function handleSave() {
    if (isSaving) {
      return;
    }

    setError(null);
    setSaveMessage(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/settings/quick-replies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quickReplies,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | SaveResponse
        | null;

      if (!response.ok || !result?.ok) {
        setError(result?.error ?? "No pudimos guardar las respuestas rapidas.");
        return;
      }

      setSaveMessage("Las respuestas rapidas se guardaron correctamente.");
      router.refresh();
    } catch {
      setError("No pudimos guardar las respuestas rapidas.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-border-strong bg-[linear-gradient(180deg,rgba(11,20,35,0.92),rgba(13,23,39,0.84))] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
            Respuestas rapidas
          </p>
          <h4 className="mt-3 text-xl font-semibold text-foreground">
            Biblioteca comercial guiada
          </h4>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-foreground-muted/82">
            Gestiona respuestas operativas por etapa. Las inactivas siguen
            editables aqui, pero no aparecen en el composer de Inbox.
          </p>
        </div>
        <span className="rounded-2xl border border-[rgba(106,124,184,0.22)] bg-[linear-gradient(180deg,rgba(20,30,49,0.96),rgba(13,22,38,0.94))] px-4 py-2 text-xs font-medium text-foreground-soft">
          {`${activeCount} activas`}
        </span>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-warning/20 bg-warning-soft px-4 py-3 text-sm text-amber-200">
          {error}
        </p>
      ) : null}

      {saveMessage ? (
        <p className="mt-4 rounded-2xl border border-success/20 bg-[rgba(31,74,58,0.24)] px-4 py-3 text-sm text-emerald-200">
          {saveMessage}
        </p>
      ) : null}

      <div className="mt-5 space-y-4">
        {quickReplies.map((quickReply) => (
          <div
            key={quickReply.id}
            className="rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(14,23,38,0.92),rgba(11,18,31,0.88))] p-4"
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                    Etiqueta
                  </span>
                  <input
                    type="text"
                    value={quickReply.label}
                    maxLength={60}
                    onChange={(event) => {
                      setError(null);
                      setSaveMessage(null);
                      updateQuickReply(quickReply.id, (currentReply) => ({
                        ...currentReply,
                        label: event.target.value,
                      }));
                    }}
                    className="mt-2 h-11 w-full rounded-2xl border border-border bg-background-soft px-4 text-sm text-foreground outline-none transition focus:border-accent/40"
                  />
                </label>

                <label className="block">
                  <span className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                    Texto
                  </span>
                  <textarea
                    value={quickReply.text}
                    rows={3}
                    maxLength={320}
                    onChange={(event) => {
                      setError(null);
                      setSaveMessage(null);
                      updateQuickReply(quickReply.id, (currentReply) => ({
                        ...currentReply,
                        text: event.target.value,
                      }));
                    }}
                    className="mt-2 w-full rounded-2xl border border-border bg-background-soft px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent/40"
                  />
                </label>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                    Etapa
                  </span>
                  <select
                    value={quickReply.stage}
                    onChange={(event) => {
                      setError(null);
                      setSaveMessage(null);
                      updateQuickReply(quickReply.id, (currentReply) => ({
                        ...currentReply,
                        stage: event.target.value as QuickReply["stage"],
                      }));
                    }}
                    className="mt-2 h-11 w-full rounded-2xl border border-border bg-background-soft px-4 text-sm text-foreground outline-none transition focus:border-accent/40"
                  >
                    {QUICK_REPLY_STAGES.map((stage) => (
                      <option key={stage} value={stage}>
                        {buildQuickReplyStageLabel(stage)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-border bg-background-soft/70 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={quickReply.isActive}
                    onChange={(event) => {
                      setError(null);
                      setSaveMessage(null);
                      updateQuickReply(quickReply.id, (currentReply) => ({
                        ...currentReply,
                        isActive: event.target.checked,
                      }));
                    }}
                    className="size-4 rounded border border-border bg-background-soft text-accent"
                  />
                  <span className="text-sm text-foreground-soft">
                    Activa
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => handleRemoveQuickReply(quickReply.id)}
                  className="w-full rounded-2xl border border-[rgba(120,94,120,0.22)] bg-[linear-gradient(180deg,rgba(24,21,32,0.96),rgba(17,15,25,0.94))] px-4 py-3 text-sm font-medium text-foreground-soft transition hover:border-[rgba(150,116,150,0.3)] hover:text-foreground"
                >
                  Eliminar respuesta
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleAddQuickReply}
          className="rounded-2xl border border-[rgba(106,124,184,0.22)] bg-[linear-gradient(180deg,rgba(20,30,49,0.96),rgba(13,22,38,0.94))] px-5 py-3 text-sm font-medium text-foreground-soft transition hover:border-[rgba(106,124,184,0.36)] hover:bg-[linear-gradient(180deg,rgba(27,39,63,0.98),rgba(16,26,44,0.96))] hover:text-foreground"
        >
          Agregar respuesta
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-2xl border border-[rgba(106,124,184,0.22)] bg-[linear-gradient(180deg,rgba(20,30,49,0.96),rgba(13,22,38,0.94))] px-5 py-3 text-sm font-semibold text-foreground transition hover:border-[rgba(106,124,184,0.36)] hover:bg-[linear-gradient(180deg,rgba(27,39,63,0.98),rgba(16,26,44,0.96))] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? "Guardando..." : "Guardar respuestas rapidas"}
        </button>
      </div>
    </div>
  );
}
