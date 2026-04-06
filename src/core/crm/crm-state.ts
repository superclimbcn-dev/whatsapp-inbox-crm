export const CRM_STATES = [
  "nuevo",
  "pendiente",
  "presupuesto_enviado",
  "agendado",
  "cerrado",
  "perdido",
] as const;

export type CrmState = (typeof CRM_STATES)[number];

export function isCrmState(value: string): value is CrmState {
  return CRM_STATES.includes(value as CrmState);
}
