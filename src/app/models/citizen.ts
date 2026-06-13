// Interfaz principal — representa un ciudadano tal como lo devuelve el backend
export interface Citizen {
  id_citizen: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// DTO para POST (crear) y PUT (actualizar) — solo los campos que el usuario edita
export interface CitizenRequestDto {
  name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
}

// DTO para la búsqueda con filtros
export interface CitizenSearchRequestDto {
  search?: string;
  page?: number;
  pageSize?: number;
}

// DTO para respuestas paginadas
export interface CitizenPaginatedResponseDto {
  items: Citizen[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// DTO para mensajes genéricos del backend (ej. confirmación de DELETE)
export interface CitizenResponseMessageDto {
  message: string;
}
