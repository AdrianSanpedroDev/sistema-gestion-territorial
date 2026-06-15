// Modelo de Votación (CU-13 — Calificar anotación).
// Las interfaces viven SOLO aquí (regla de capas: nunca `any` en componentes/servicios).

// Representa un voto tal como lo devuelve el backend.
export interface Vote {
  id_vote: number;
  id_citizen: number;
  id_annotation: number;
  stars: number;        // 1–5 (la BD valida con CHECK)
  comment?: string;
  vote_date: string;    // ISO 8601, autogenerado por el backend
}

// DTO para POST (crear voto por primera vez).
export interface VoteRequestDto {
  id_citizen: number;
  id_annotation: number;
  stars: number;
  comment?: string;
}

// DTO para PUT (editar el voto existente — flujo alternativo 4a del CU-13).
export interface VoteUpdateDto {
  stars: number;
  comment?: string;
}
