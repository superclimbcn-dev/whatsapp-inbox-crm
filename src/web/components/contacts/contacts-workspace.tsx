"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type {
  ContactListItem,
  ContactsData,
} from "@/app/services/contacts/get-contacts-data";
import { type CrmState } from "@/core/crm/crm-state";
import {
  buildQuickReplyStageLabel,
  QUICK_REPLY_STAGES,
  type QuickReply,
} from "@/core/settings/quick-replies";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/web/components/ui/status-badge";

type ContactsWorkspaceProps = {
  contacts: ContactListItem[];
  conversationFilter: ContactsData["conversationFilter"];
  crmFilter: ContactsData["crmFilter"];
  hasContacts: boolean;
  quickReplies: QuickReply[];
  searchTerm: string;
  selectedContactId: string | null;
};

const avatarPalette = [
  "bg-[linear-gradient(180deg,rgba(24,104,132,0.96),rgba(16,70,97,0.98))] text-cyan-100 shadow-[0_16px_34px_rgba(8,56,79,0.34)] ring-1 ring-cyan-300/16",
  "bg-[linear-gradient(180deg,rgba(77,52,156,0.96),rgba(50,33,104,0.98))] text-violet-100 shadow-[0_16px_34px_rgba(40,28,92,0.34)] ring-1 ring-violet-300/16",
  "bg-[linear-gradient(180deg,rgba(21,117,91,0.96),rgba(15,76,60,0.98))] text-emerald-100 shadow-[0_16px_34px_rgba(13,64,52,0.34)] ring-1 ring-emerald-300/16",
  "bg-[linear-gradient(180deg,rgba(133,98,24,0.96),rgba(87,63,16,0.98))] text-amber-100 shadow-[0_16px_34px_rgba(78,55,13,0.34)] ring-1 ring-amber-300/16",
  "bg-[linear-gradient(180deg,rgba(136,44,92,0.96),rgba(87,27,58,0.98))] text-fuchsia-100 shadow-[0_16px_34px_rgba(79,21,52,0.34)] ring-1 ring-fuchsia-300/16",
  "bg-[linear-gradient(180deg,rgba(43,82,156,0.96),rgba(28,54,102,0.98))] text-sky-100 shadow-[0_16px_34px_rgba(18,44,88,0.34)] ring-1 ring-sky-300/16",
] as const;

function buildContactsHref(
  contactId: string,
  searchTerm: string,
  conversationFilter: ContactsData["conversationFilter"],
  crmFilter: ContactsData["crmFilter"],
): string {
  const params = new URLSearchParams();

  params.set("contact", contactId);

  if (searchTerm) {
    params.set("q", searchTerm);
  }

  if (conversationFilter !== "all") {
    params.set("conversation", conversationFilter);
  }

  if (crmFilter !== "all") {
    params.set("crm", crmFilter);
  }

  return `/contacts?${params.toString()}`;
}

function getContactInitials(value: string): string {
  const words = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (words.length === 0) {
    return "CT";
  }

  return words.map((word) => word[0]?.toUpperCase() ?? "").join("");
}

function buildAvatarTone(value: string): string {
  const seed = Array.from(value).reduce(
    (accumulator, character) => accumulator + character.charCodeAt(0),
    0,
  );

  return avatarPalette[seed % avatarPalette.length];
}

function buildCrmStateLabel(value: CrmState | null): string {
  switch (value) {
    case "nuevo":
      return "Nuevo";
    case "pendiente":
      return "Pendiente";
    case "presupuesto_enviado":
      return "Presup.";
    case "agendado":
      return "Agendado";
    case "cerrado":
      return "Cerrado";
    case "perdido":
      return "Perdido";
    default:
      return "Sin CRM";
  }
}

function buildCrmStateTone(value: CrmState | null): "accent" | "base" | "info" | "success" | "warning" {
  switch (value) {
    case "agendado":
      return "success";
    case "presupuesto_enviado":
      return "accent";
    case "cerrado":
      return "info";
    case "perdido":
      return "warning";
    case "pendiente":
      return "accent";
    case "nuevo":
      return "base";
    default:
      return "base";
  }
}

export function ContactsWorkspace({
  contacts,
  conversationFilter,
  crmFilter,
  hasContacts,
  quickReplies,
  searchTerm,
  selectedContactId,
}: ContactsWorkspaceProps) {
  const router = useRouter();
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [isPreparingMessage, setIsPreparingMessage] = useState(false);
  const [draft, setDraft] = useState("");

  const selectedCount = selectedContactIds.length;
  const selectedIdsSet = useMemo(
    () => new Set(selectedContactIds),
    [selectedContactIds],
  );
  const selectedContacts = useMemo(
    () => contacts.filter((contact) => selectedIdsSet.has(contact.id)),
    [contacts, selectedIdsSet],
  );
  const eligibleContacts = useMemo(
    () => selectedContacts.filter((contact) => Boolean(contact.conversationId)),
    [selectedContacts],
  );
  const ineligibleContacts = useMemo(
    () => selectedContacts.filter((contact) => !contact.conversationId),
    [selectedContacts],
  );
  const quickReplyGroups = useMemo(
    () =>
      QUICK_REPLY_STAGES.map((stage) => ({
        replies: quickReplies.filter((reply) => reply.stage === stage),
        stage,
      })).filter((group) => group.replies.length > 0),
    [quickReplies],
  );

  function toggleContactSelection(contactId: string) {
    setSelectedContactIds((currentIds) =>
      currentIds.includes(contactId)
        ? currentIds.filter((id) => id !== contactId)
        : [...currentIds, contactId],
    );
  }

  function applyQuickReply(text: string) {
    setDraft((currentDraft) => {
      const trimmedDraft = currentDraft.trim();

      if (!trimmedDraft) {
        return text;
      }

      return `${currentDraft.trimEnd()}\n\n${text}`;
    });
  }

  return (
    <section className="flex min-h-[560px] flex-1 flex-col overflow-hidden rounded-[30px] border border-[rgba(118,138,195,0.18)] bg-[radial-gradient(circle_at_top,rgba(69,98,176,0.14),transparent_26%),linear-gradient(180deg,rgba(19,29,47,0.98),rgba(13,22,38,0.95))] shadow-[0_28px_72px_rgba(2,6,23,0.24)]">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h3 className="text-xl font-semibold text-foreground">Directorio</h3>
        <StatusBadge tone="success">Listado real</StatusBadge>
      </div>

      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-[linear-gradient(180deg,rgba(21,33,53,0.88),rgba(16,26,42,0.82))] px-5 py-3">
          <p className="text-sm font-medium text-foreground">
            {`${selectedCount} contactos seleccionados`}
          </p>
          <button
            type="button"
            onClick={() => setIsPreparingMessage(true)}
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-[rgba(88,108,176,0.3)] bg-[linear-gradient(180deg,rgba(34,49,77,0.92),rgba(23,35,56,0.9))] px-4 text-sm font-semibold text-foreground transition duration-200 hover:border-[rgba(104,126,188,0.42)] hover:bg-[linear-gradient(180deg,rgba(40,57,89,0.94),rgba(27,41,65,0.92))]"
          >
            Preparar mensaje
          </button>
        </div>
      ) : null}

      {isPreparingMessage ? (
        <div className="border-b border-border/70 bg-[linear-gradient(180deg,rgba(18,28,45,0.98),rgba(14,24,40,0.95))] px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                Preparacion de mensaje
              </p>
              <h4 className="mt-2 text-xl font-semibold text-foreground">
                Mensaje unico para la seleccion actual.
              </h4>
              <p className="mt-2 text-sm leading-7 text-foreground-soft">
                Revisa el texto antes de cualquier accion futura. Esta vista no
                envia nada.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsPreparingMessage(false)}
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-[rgba(96,114,170,0.2)] bg-[linear-gradient(180deg,rgba(18,28,45,0.94),rgba(13,22,37,0.92))] px-4 text-sm font-medium text-foreground-soft transition duration-200 hover:border-[rgba(96,114,170,0.34)] hover:text-foreground"
            >
              Volver
            </button>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_320px]">
            <div className="rounded-[26px] border border-[rgba(118,138,195,0.16)] bg-[linear-gradient(180deg,rgba(20,30,49,0.96),rgba(15,24,40,0.92))] p-4">
              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                  Mensaje base
                </span>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={8}
                  placeholder="Escribe o pega aqui el mensaje que quieres preparar para este grupo"
                  className="mt-3 w-full rounded-2xl border border-border bg-background-soft px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-foreground-muted/58 focus:border-accent/36"
                />
              </label>

              {quickReplyGroups.length > 0 ? (
                <div className="mt-4 space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                    Biblioteca guiada
                  </p>
                  {quickReplyGroups.map((group) => (
                    <div key={group.stage}>
                      <p className="text-xs font-medium text-foreground-soft">
                        {buildQuickReplyStageLabel(group.stage)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {group.replies.map((reply) => (
                          <button
                            key={reply.id}
                            type="button"
                            onClick={() => applyQuickReply(reply.text)}
                            className="rounded-2xl border border-[rgba(106,124,184,0.22)] bg-[linear-gradient(180deg,rgba(20,30,49,0.96),rgba(13,22,38,0.94))] px-4 py-2 text-xs font-medium text-foreground-soft transition hover:border-[rgba(106,124,184,0.36)] hover:bg-[linear-gradient(180deg,rgba(27,39,63,0.98),rgba(16,26,44,0.96))] hover:text-foreground"
                          >
                            {reply.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-2xl border border-[rgba(88,108,176,0.3)] bg-[linear-gradient(180deg,rgba(34,49,77,0.92),rgba(23,35,56,0.9))] px-4 text-sm font-semibold text-foreground transition duration-200 hover:border-[rgba(104,126,188,0.42)] hover:bg-[linear-gradient(180deg,rgba(40,57,89,0.94),rgba(27,41,65,0.92))]"
                >
                  Guardar borrador
                </button>
                <p className="text-xs leading-6 text-foreground-muted/72">
                  Guardado solo en esta sesion mientras no salgas de la vista.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[26px] border border-[rgba(118,138,195,0.16)] bg-[linear-gradient(180deg,rgba(20,30,49,0.96),rgba(15,24,40,0.92))] p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                  Resumen
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge tone="accent">
                    {`${selectedContacts.length} seleccionados`}
                  </StatusBadge>
                  <StatusBadge tone="success">
                    {`${eligibleContacts.length} listos para futura accion`}
                  </StatusBadge>
                  <StatusBadge tone="base">
                    {`${ineligibleContacts.length} sin conversacion`}
                  </StatusBadge>
                </div>
              </div>

              <div className="rounded-[26px] border border-[rgba(118,138,195,0.16)] bg-[linear-gradient(180deg,rgba(20,30,49,0.96),rgba(15,24,40,0.92))] p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                  Incluidos
                </p>
                <div className="mt-3 space-y-2">
                  {selectedContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background-soft/60 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {contact.displayName}
                        </p>
                        <p className="truncate text-xs text-foreground-muted/72">
                          {contact.phone}
                        </p>
                      </div>
                      <StatusBadge
                        tone={contact.conversationId ? "success" : "base"}
                      >
                        {contact.conversationId ? "Con contexto" : "Sin contexto"}
                      </StatusBadge>
                    </div>
                  ))}
                </div>
              </div>

              {ineligibleContacts.length > 0 ? (
                <div className="rounded-[26px] border border-[rgba(118,138,195,0.16)] bg-[linear-gradient(180deg,rgba(20,30,49,0.96),rgba(15,24,40,0.92))] p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-muted/72">
                    Sin contexto conversacional
                  </p>
                  <p className="mt-2 text-sm leading-7 text-foreground-soft">
                    Estos contactos pueden entrar en la preparacion, pero hoy no
                    tienen conversacion asociada para reutilizar contexto.
                  </p>
                  <div className="mt-3 space-y-2">
                    {ineligibleContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="rounded-2xl border border-border/70 bg-background-soft/60 px-3 py-2"
                      >
                        <p className="truncate text-sm font-medium text-foreground">
                          {contact.displayName}
                        </p>
                        <p className="truncate text-xs text-foreground-muted/72">
                          {contact.phone}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {hasContacts ? (
          <div className="divide-y divide-border/70">
            {contacts.map((contact) => {
              const isActive = contact.id === selectedContactId;
              const isSelected = selectedIdsSet.has(contact.id);
              const hasConversation = Boolean(contact.conversationId);

              return (
                <div
                  key={contact.id}
                  className={cn(
                    "group flex items-center gap-4 px-5 py-4 transition duration-200",
                    isActive
                      ? "bg-[linear-gradient(180deg,rgba(34,50,78,0.98),rgba(24,37,60,0.96))] shadow-[inset_2px_0_0_rgba(115,147,231,0.92)]"
                      : "hover:bg-[linear-gradient(180deg,rgba(24,36,58,0.88),rgba(18,29,48,0.82))] hover:shadow-[inset_1px_0_0_rgba(108,131,202,0.48)]",
                    isSelected && "bg-[linear-gradient(180deg,rgba(28,44,70,0.98),rgba(20,32,52,0.96))]",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleContactSelection(contact.id)}
                    aria-label={`Seleccionar ${contact.displayName}`}
                    className="size-4 shrink-0 rounded border border-[rgba(111,129,186,0.42)] bg-transparent text-accent accent-[rgb(106,124,184)]"
                  />

                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition duration-200 group-hover:scale-[1.04] ${buildAvatarTone(contact.displayName)}`}
                  >
                    {getContactInitials(contact.displayName)}
                  </div>

                  <Link
                    href={buildContactsHref(
                      contact.id,
                      searchTerm,
                      conversationFilter,
                      crmFilter,
                    )}
                    className="flex min-w-0 flex-1 items-center gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-foreground">
                        {contact.displayName}
                      </p>
                      <p className="mt-1 truncate text-sm text-foreground-soft">
                        {contact.phone}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge tone={buildCrmStateTone(contact.crmState)}>
                        {buildCrmStateLabel(contact.crmState)}
                      </StatusBadge>
                      {hasConversation ? (
                        <button
                          type="button"
                          onClick={() => router.push(`/inbox?id=${contact.conversationId}`)}
                          className="rounded-2xl border border-[rgba(88,108,176,0.3)] bg-[linear-gradient(180deg,rgba(34,49,77,0.92),rgba(23,35,56,0.9))] px-3 py-1 text-xs font-medium text-foreground transition hover:border-[rgba(104,126,188,0.42)] hover:bg-[linear-gradient(180deg,rgba(40,57,89,0.94),rgba(27,41,65,0.92))]"
                        >
                          Ir a conversación
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            // TODO: Implementar criação de conversa
                            console.log("Criar conversa para:", contact.phone);
                          }}
                          className="rounded-2xl border border-[rgba(106,124,184,0.22)] bg-[linear-gradient(180deg,rgba(20,30,49,0.96),rgba(13,22,38,0.94))] px-3 py-1 text-xs font-medium text-foreground-soft transition hover:border-[rgba(106,124,184,0.36)] hover:bg-[linear-gradient(180deg,rgba(27,39,63,0.98),rgba(16,26,44,0.96))] hover:text-foreground"
                        >
                          Crear conversación
                        </button>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-5">
            <div className="rounded-2xl border border-border-strong bg-[linear-gradient(180deg,rgba(18,28,45,0.94),rgba(13,22,37,0.92))] px-4 py-5">
              <p className="text-sm font-medium text-foreground">
                No encontramos contactos para esta busqueda.
              </p>
              <p className="mt-2 text-xs leading-6 text-foreground-muted/76">
                Los contactos reales se crean automaticamente cuando llegan
                conversaciones inbound al webhook.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
