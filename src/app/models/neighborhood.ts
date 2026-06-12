export interface Neighborhood {
    id_neighborhood: number;
    id_commune: number;
    name: string;
    status: string;
    created_at: string;
    updated_at: string;
}

// DTO para peticiones POST (Crear) y PUT (Actualizar)
export interface NeighborhoodRequestDto {
    id_commune: number;
    name: string;
    status: string;
}

// DTO para peticiones GET de búsqueda con filtros
export interface NeighborhoodSearchRequestDto {
    id_commune?: number;
    page?: number;
    pageSize?: number;
}

// DTO para respuestas paginadas (List paginated y Search by filter)
export interface NeighborhoodPaginatedResponseDto {
    items: Neighborhood[];
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

// DTO para respuestas genéricas (ej. confirmación de DELETE o errores capturados)
export interface NeighborhoodResponseMessageDto {
    message: string;
}