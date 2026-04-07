// ============================================================================
// CRM States (Estados del CRM)
// ============================================================================

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

// ============================================================================
// CRM State Labels and Styling (Etiquetas y Estilos de Estados CRM)
// ============================================================================

/**
 * Obtiene la etiqueta legible para un estado CRM.
 */
export function buildCrmStateLabel(state: CrmState): string {
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

/**
 * Obtiene la clase de color Tailwind para un estado CRM.
 */
export function buildCrmStateToneClass(state: CrmState): string {
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

/**
 * Obtiene el estilo completo para badges de estado CRM.
 * Retorna clases para background, texto e border.
 */
export function getCrmBadgeStyle(state: CrmState): { bg: string; text: string; border: string } {
  switch (state) {
    case "nuevo":
      return { bg: "bg-foreground-soft/15", text: "text-foreground-soft", border: "border-foreground-soft/25" };
    case "pendiente":
      return { bg: "bg-warning/15", text: "text-warning", border: "border-warning/25" };
    case "presupuesto_enviado":
      return { bg: "bg-info/15", text: "text-info", border: "border-info/25" };
    case "agendado":
      return { bg: "bg-success/15", text: "text-success", border: "border-success/25" };
    case "cerrado":
      return { bg: "bg-foreground-soft/10", text: "text-foreground-soft", border: "border-foreground-soft/20" };
    case "perdido":
      return { bg: "bg-rose-500/15", text: "text-rose-300", border: "border-rose-500/25" };
    default:
      return { bg: "bg-foreground-soft/15", text: "text-foreground-soft", border: "border-foreground-soft/25" };
  }
}

// ============================================================================
// Tag Color System (Sistema de Colores de Tags)
// ============================================================================

/**
 * Palette de colores disponibles para tags del CRM.
 * Cada color tiene una variante sólida y una suave para diferentes contextos UI.
 */
export const TAG_COLORS = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const;

export type TagColor = (typeof TAG_COLORS)[number];

/**
 * Mapea colores de tags a clases Tailwind CSS para variantes sólidas.
 */
const TAG_COLOR_CLASSES: Record<TagColor, { bg: string; text: string; border: string }> = {
  red: { bg: "bg-red-500/20", text: "text-red-300", border: "border-red-500/30" },
  orange: { bg: "bg-orange-500/20", text: "text-orange-300", border: "border-orange-500/30" },
  amber: { bg: "bg-amber-500/20", text: "text-amber-300", border: "border-amber-500/30" },
  yellow: { bg: "bg-yellow-500/20", text: "text-yellow-300", border: "border-yellow-500/30" },
  lime: { bg: "bg-lime-500/20", text: "text-lime-300", border: "border-lime-500/30" },
  green: { bg: "bg-green-500/20", text: "text-green-300", border: "border-green-500/30" },
  emerald: { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/30" },
  teal: { bg: "bg-teal-500/20", text: "text-teal-300", border: "border-teal-500/30" },
  cyan: { bg: "bg-cyan-500/20", text: "text-cyan-300", border: "border-cyan-500/30" },
  sky: { bg: "bg-sky-500/20", text: "text-sky-300", border: "border-sky-500/30" },
  blue: { bg: "bg-blue-500/20", text: "text-blue-300", border: "border-blue-500/30" },
  indigo: { bg: "bg-indigo-500/20", text: "text-indigo-300", border: "border-indigo-500/30" },
  violet: { bg: "bg-violet-500/20", text: "text-violet-300", border: "border-violet-500/30" },
  purple: { bg: "bg-purple-500/20", text: "text-purple-300", border: "border-purple-500/30" },
  fuchsia: { bg: "bg-fuchsia-500/20", text: "text-fuchsia-300", border: "border-fuchsia-500/30" },
  pink: { bg: "bg-pink-500/20", text: "text-pink-300", border: "border-pink-500/30" },
  rose: { bg: "bg-rose-500/20", text: "text-rose-300", border: "border-rose-500/30" },
};

/**
 * Obtiene las clases Tailwind para un color de tag específico.
 */
export function getTagColorClasses(color: TagColor): { bg: string; text: string; border: string } {
  return TAG_COLOR_CLASSES[color];
}

/**
 * Obtiene un color de tag basado en un índice (para distribución uniforme).
 */
export function getTagColorByIndex(index: number): TagColor {
  return TAG_COLORS[index % TAG_COLORS.length];
}

// ============================================================================
// Tag Types (Tipos de Tags)
// ============================================================================

/**
 * Representa un tag del CRM con su identificador, nombre y color.
 */
export interface CrmTag {
  /** Identificador único del tag (UUID o slug) */
  id: string;
  /** Nombre visible del tag */
  name: string;
  /** Color del tag para representación visual */
  color: TagColor;
  /** Descripción opcional del tag */
  description?: string;
  /** Si el tag está activo y disponible para uso */
  isActive: boolean;
}

/**
 * Crea un nuevo tag del CRM con valores por defecto.
 */
export function createCrmTag(params: {
  id: string;
  name: string;
  color?: TagColor;
  description?: string;
  isActive?: boolean;
}): CrmTag {
  return {
    id: params.id,
    name: params.name,
    color: params.color ?? TAG_COLORS[0],
    description: params.description,
    isActive: params.isActive ?? true,
  };
}

/**
 * Valida si un objeto es un CrmTag válido.
 */
export function isCrmTag(value: unknown): value is CrmTag {
  if (typeof value !== "object" || value === null) return false;
  const tag = value as Record<string, unknown>;
  return (
    typeof tag.id === "string" &&
    typeof tag.name === "string" &&
    typeof tag.color === "string" &&
    isTagColor(tag.color) &&
    (tag.isActive === undefined || typeof tag.isActive === "boolean")
  );
}

/**
 * Valida si un string es un color de tag válido.
 */
export function isTagColor(value: string): value is TagColor {
  return TAG_COLORS.includes(value as TagColor);
}

// ============================================================================
// Tag Filtering & Search Utilities (Utilidades de Filtrado y Búsqueda)
// ============================================================================

/**
 * Opciones para filtrar tags.
 */
export interface TagFilterOptions {
  /** Filtrar por texto (busca en nombre y descripción) */
  search?: string;
  /** Filtrar por color específico */
  color?: TagColor;
  /** Filtrar solo tags activos */
  activeOnly?: boolean;
  /** Filtrar por IDs específicos */
  ids?: string[];
}

/**
 * Filtra una lista de tags según las opciones proporcionadas.
 */
export function filterTags(tags: readonly CrmTag[], options: TagFilterOptions = {}): CrmTag[] {
  return tags.filter((tag) => {
    // Filtro por búsqueda de texto
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      const matchesName = tag.name.toLowerCase().includes(searchLower);
      const matchesDescription = tag.description?.toLowerCase().includes(searchLower);
      if (!matchesName && !matchesDescription) return false;
    }

    // Filtro por color
    if (options.color && tag.color !== options.color) return false;

    // Filtro por estado activo
    if (options.activeOnly && !tag.isActive) return false;

    // Filtro por IDs
    if (options.ids && options.ids.length > 0 && !options.ids.includes(tag.id)) return false;

    return true;
  });
}

/**
 * Busca tags por texto (atalho para filterTags con solo search).
 */
export function searchTags(tags: readonly CrmTag[], query: string): CrmTag[] {
  return filterTags(tags, { search: query });
}

/**
 * Ordena tags por nombre (alfabéticamente).
 */
export function sortTagsByName(tags: CrmTag[], order: "asc" | "desc" = "asc"): CrmTag[] {
  return [...tags].sort((a, b) => {
    const comparison = a.name.localeCompare(b.name, "es");
    return order === "asc" ? comparison : -comparison;
  });
}

/**
 * Agrupa tags por color.
 */
export function groupTagsByColor(tags: readonly CrmTag[]): Record<TagColor, CrmTag[]> {
  const groups: Record<TagColor, CrmTag[]> = {} as Record<TagColor, CrmTag[]>;
  
  for (const color of TAG_COLORS) {
    groups[color] = [];
  }
  
  for (const tag of tags) {
    groups[tag.color].push(tag);
  }
  
  // Remove empty groups
  for (const color of TAG_COLORS) {
    if (groups[color].length === 0) {
      delete groups[color];
    }
  }
  
  return groups;
}

// ============================================================================
// Tag Assignment Utilities (Utilidades de Asignación de Tags)
// ============================================================================

/**
 * Representa la asignación de tags a una entidad (contacto, conversación, etc.).
 */
export interface TagAssignment {
  /** ID de la entidad (ej. contact_id, conversation_id) */
  entityId: string;
  /** Tipo de entidad */
  entityType: "contact" | "conversation";
  /** IDs de tags asignados */
  tagIds: string[];
}

/**
 * Verifica si un tag está asignado a una entidad.
 */
export function hasTag(assignment: TagAssignment, tagId: string): boolean {
  return assignment.tagIds.includes(tagId);
}

/**
 * Agrega un tag a una asignación (retorna nueva asignación, no muta).
 */
export function addTagToAssignment(assignment: TagAssignment, tagId: string): TagAssignment {
  if (hasTag(assignment, tagId)) return assignment;
  return { ...assignment, tagIds: [...assignment.tagIds, tagId] };
}

/**
 * Remueve un tag de una asignación (retorna nueva asignación, no muta).
 */
export function removeTagFromAssignment(assignment: TagAssignment, tagId: string): TagAssignment {
  if (!hasTag(assignment, tagId)) return assignment;
  return { ...assignment, tagIds: assignment.tagIds.filter((id) => id !== tagId) };
}

/**
 * Reemplaza todos los tags de una asignación.
 */
export function setTagsForAssignment(assignment: TagAssignment, tagIds: string[]): TagAssignment {
  return { ...assignment, tagIds };
}

/**
 * Obtiene los tags completos asignados a una entidad.
 */
export function getAssignedTags(assignment: TagAssignment, allTags: readonly CrmTag[]): CrmTag[] {
  return allTags.filter((tag) => assignment.tagIds.includes(tag.id));
}

// ============================================================================
// Default Tags (Tags por Defecto)
// ============================================================================

/**
 * Tags por defecto para el CRM, organizados por categorías comunes.
 */
export const DEFAULT_CRM_TAGS: CrmTag[] = [
  // Prioridad
  createCrmTag({ id: "tag_priority_high", name: "Alta Prioridad", color: "red", description: "Requiere atención inmediata" }),
  createCrmTag({ id: "tag_priority_medium", name: "Prioridad Media", color: "amber", description: "Atención en plazo normal" }),
  createCrmTag({ id: "tag_priority_low", name: "Baja Prioridad", color: "green", description: "Sin urgencia" }),
  
  // Tipo de cliente
  createCrmTag({ id: "tag_client_new", name: "Cliente Nuevo", color: "blue", description: "Primer contacto o lead" }),
  createCrmTag({ id: "tag_client_recurrent", name: "Cliente Recurrente", color: "indigo", description: "Cliente que repite servicio" }),
  createCrmTag({ id: "tag_client_vip", name: "Cliente VIP", color: "purple", description: "Cliente de alto valor" }),
  
  // Tipo de servicio
  createCrmTag({ id: "tag_service_cleaning", name: "Limpieza", color: "cyan", description: "Servicio de limpieza" }),
  createCrmTag({ id: "tag_service_waterproof", name: "Impermeabilización", color: "teal", description: "Servicio de impermeabilización" }),
  createCrmTag({ id: "tag_service_repair", name: "Reparación", color: "emerald", description: "Servicio de reparación" }),
  
  // Estado de comunicación
  createCrmTag({ id: "tag_comm_pending", name: "Pendiente Respuesta", color: "orange", description: "Esperando respuesta del cliente" }),
  createCrmTag({ id: "tag_comm_followup", name: "Seguimiento", color: "yellow", description: "Requiere seguimiento activo" }),
  createCrmTag({ id: "tag_comm_scheduled", name: "Agendado", color: "sky", description: "Servicio programado" }),
  
  // Observaciones
  createCrmTag({ id: "tag_note_urgent", name: "Urgente", color: "rose", description: "Situación urgente" }),
  createCrmTag({ id: "tag_note_complaint", name: "Reclamación", color: "fuchsia", description: "Queja o incidencia" }),
  createCrmTag({ id: "tag_note_feedback", name: "Feedback", color: "pink", description: "Comentarios o valoraciones" }),
].sort((a, b) => a.name.localeCompare(b.name, "es"));

/**
 * Mapa de tags por defecto por ID para acceso rápido.
 */
export const DEFAULT_CRM_TAGS_BY_ID = new Map(
  DEFAULT_CRM_TAGS.map((tag) => [tag.id, tag] as const)
);

/**
 * Obtiene un tag por defecto por su ID.
 */
export function getDefaultTagById(id: string): CrmTag | undefined {
  return DEFAULT_CRM_TAGS_BY_ID.get(id);
}

/**
 * Genera un resumen de tags para visualización.
 */
export function buildTagSummary(tags: readonly CrmTag[]): string {
  if (tags.length === 0) return "Sin tags";
  if (tags.length <= 2) return tags.map((t) => t.name).join(", ");
  return `${tags[0].name} +${tags.length - 1} más`;
}
