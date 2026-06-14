export interface Point {
    id_point: number;
    id_neighborhood: number | null; // Nullable por el constraint XOR
    id_annotation: number | null;   // Nullable por el constraint XOR
    latitude: number;
    longitude: number;
    order: number;
    point_type: string; // Ej: 'boundary', 'sample', 'annotation'
}

// DTO para peticiones POST (Crear) y PUT (Actualizar)
export interface PointRequestDto {
    id_neighborhood?: number | null;
    id_annotation?: number | null;
    latitude: number;
    longitude: number;
    order: number;
    point_type: string;
}

// DTO para peticiones GET de búsqueda con filtros
export interface PointSearchRequestDto {
    id_neighborhood?: number;
    id_annotation?: number;
    point_type?: string;
    page?: number;
    pageSize?: number;
}

// DTO para respuestas paginadas
export interface PointPaginatedResponseDto {
    items: Point[];
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

// DTO para respuestas genéricas (ej. confirmación de DELETE)
export interface PointResponseMessageDto {
    message: string;
}