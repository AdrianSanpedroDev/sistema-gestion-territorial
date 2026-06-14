// DTO para iniciar el rastreo de funcionarios
export interface TrackingStartRequestDto {
  ids: number[];
}

// DTO para detener el rastreo
// 'ids' es opcional porque enviar un objeto vacío {} detiene todos
export interface TrackingStopRequestDto {
  ids?: number[]; 
}
// Detalle de los IDs ignorados al intentar iniciar el tracking
export interface TrackingIgnoredDetails {
  inactive: number[];
  invalid: number[];
  missing: number[];
  missing_coords: number[];
}

// DTO de la respuesta al iniciar el tracking
export interface TrackingStartResponseDto {
  ignored: TrackingIgnoredDetails;
  started_ids: number[];
}

// DTO de la respuesta al detener el tracking
export interface TrackingStopResponseDto {
  invalid: number[];
  not_tracking: number[];
  stopped_all: boolean;
  stopped_ids: number[];
}

// Representa la actualización individual de la ubicación de un funcionario
export interface OfficialLocationUpdate {
  id_official: number;
  latitude: number;
  longitude: number;
  last_gps_update: string; // Formato ISO 8601 (ej. "2026-05-27T14:00:00")
}

// Representa el payload completo que llega en el evento 'official_tracking'
export interface OfficialTrackingPayload {
  officials: OfficialLocationUpdate[];
}

// Opcional: Para manejar el estado de las tarjetas superiores en la UI
export interface TrackingSummaryStats {
  activeOfficials: number; // "Funcionarios activos"
  offlineOfficials: number; // "Sin conexión"
  totalOfficials: number; // "Total"
}