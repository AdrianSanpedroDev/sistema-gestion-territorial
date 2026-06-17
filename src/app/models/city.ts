export interface City {
    id_city: number;
    id_department: number;
    name: string;
    status: string;
    created_at: string;
    updated_at: string;
}

// DTO para peticiones POST (Crear) y PUT (Actualizar)
export interface CityRequestDto {
    id_department: number;
    name: string;
    status: string;
}

// DTO para peticiones GET de búsqueda con filtros
export interface CitySearchRequestDto {
    id_department?: number;
    page?: number;
    pageSize?: number;
}

// DTO para respuestas paginadas (List paginated y Search by filter)
export interface CityPaginatedResponseDto {
    items: City[];
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

// DTO para respuestas genéricas
export interface CityResponseMessageDto {
    message: string;
}