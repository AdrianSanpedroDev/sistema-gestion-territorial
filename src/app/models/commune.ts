export interface Commune {
    id_commune: number;
    id_city: number;
    name: string;
    status: string;
    created_at: string;
    updated_at: string;
}

// DTO para peticiones POST (Crear) y PUT (Actualizar)
export interface CommuneRequestDto {
    id_city: number;
    name: string;
    status: string;
}

// DTO para peticiones GET de búsqueda con filtros
export interface CommuneSearchRequestDto {
    id_city?: number;
    page?: number;
    pageSize?: number;
}

// DTO para respuestas paginadas (List paginated y Search by filter)
export interface CommunePaginatedResponseDto {
    items: Commune[];
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

// DTO para respuestas genéricas (ej. confirmación de DELETE o errores capturados)
export interface CommuneResponseMessageDto {
    message: string;
}