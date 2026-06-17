export interface Department {
    id_department: number;
    name: string;
    status: string;
    created_at: string;
    updated_at: string;
}

// DTO para peticiones POST (Crear) y PUT (Actualizar)
export interface DepartmentRequestDto {
    name: string;
    status: string;
}

// DTO para peticiones GET de búsqueda con filtros
export interface DepartmentSearchRequestDto {
    page?: number;
    pageSize?: number;
}

// DTO para respuestas paginadas (List paginated y Search by filter)
export interface DepartmentPaginatedResponseDto {
    items: Department[];
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

// DTO para respuestas genéricas
export interface DepartmentResponseMessageDto {
    message: string;
}