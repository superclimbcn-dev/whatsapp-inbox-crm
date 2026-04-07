"use client";

import { useEffect, useRef, useState } from "react";

import type { QuickReply } from "@/core/settings/quick-replies";
import { cn } from "@/lib/utils";

type QuickReplyPaletteProps = {
  quickReplies: QuickReply[];
  onSelect: (reply: QuickReply) => void;
  onClose: () => void;
  anchorPosition?: { top?: number; bottom?: number; left: number };
};

export function QuickReplyPalette({
  quickReplies,
  onSelect,
  onClose,
  anchorPosition,
}: QuickReplyPaletteProps) {
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeReplies = quickReplies.filter((reply) => reply.isActive);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [quickReplies]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (activeReplies.length === 0) {
        if (event.key === "Escape") {
          onClose();
        }
        return;
      }

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setHighlightedIndex((prev) => (prev + 1) % activeReplies.length);
          break;
        case "ArrowUp":
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev - 1 < 0 ? activeReplies.length - 1 : prev - 1,
          );
          break;
        case "Enter":
          event.preventDefault();
          if (activeReplies[highlightedIndex]) {
            onSelect(activeReplies[highlightedIndex]);
          }
          break;
        case "Escape":
          event.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeReplies.length, highlightedIndex, onSelect, onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (activeReplies.length === 0) {
    console.log("Renderizando Palette agora (vazia)...");
    return (
      <div
        ref={containerRef}
        className="fixed z-[99999] min-h-[200px] rounded-2xl border-4 border-yellow-500 bg-red-600 p-4 shadow-2xl"
        style={
          anchorPosition
            ? { bottom: anchorPosition.bottom, left: anchorPosition.left }
            : undefined
        }
      >
        <p className="text-lg font-bold text-white">
          PALETTE VAZIA - TESTE DE VISIBILIDADE
        </p>
        <p className="text-sm text-white">
          No hay respuestas rapidas activas disponibles.
        </p>
      </div>
    );
  }

  console.log("Renderizando Palette agora (com", activeReplies.length, "replies)...");
  return (
    <div
      ref={containerRef}
      className="fixed z-[99999] min-h-[200px] max-h-80 w-80 overflow-y-auto rounded-2xl border-4 border-yellow-500 bg-red-600 p-2 shadow-2xl"
      style={
        anchorPosition
          ? { bottom: anchorPosition.bottom, left: anchorPosition.left }
          : undefined
      }
    >
      <div className="mb-2 px-3 py-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-foreground-muted/68">
          Respuestas rapidas ({activeReplies.length})
        </p>
      </div>
      <div className="space-y-1">
        {activeReplies.map((reply, index) => {
          const isHighlighted = index === highlightedIndex;
          return (
            <button
              key={reply.id}
              type="button"
              onClick={() => onSelect(reply)}
              className={cn(
                "flex w-full flex-col items-start gap-1 rounded-xl px-3 py-2.5 text-left transition-all duration-150",
                isHighlighted
                  ? "border border-[rgba(88,108,176,0.44)] bg-[linear-gradient(180deg,rgba(66,84,142,0.96),rgba(41,55,98,0.98))] shadow-[0_8px_20px_rgba(14,20,38,0.26)]"
                  : "border border-transparent hover:border-[rgba(106,124,184,0.22)] hover:bg-[linear-gradient(180deg,rgba(27,39,63,0.98),rgba(16,26,44,0.96))]",
              )}
            >
              <span
                className={cn(
                  "text-xs font-medium",
                  isHighlighted ? "text-white" : "text-foreground-soft",
                )}
              >
                {reply.label}
              </span>
              <span
                className={cn(
                  "line-clamp-1 text-[10px] leading-relaxed",
                  isHighlighted
                    ? "text-white/72"
                    : "text-foreground-muted/68",
                )}
              >
                {reply.text}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-2 border-t border-border/60 px-3 py-2">
        <p className="text-[10px] uppercase tracking-[0.12em] text-foreground-muted/52">
          ↑↓ navegar · Enter seleccionar · Esc cerrar
        </p>
      </div>
    </div>
  );
}