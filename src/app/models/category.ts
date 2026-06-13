// Interfaz principal — representa una categoría tal como la devuelve el backend
export interface Category {
  id_category: number;
  id_parent_category: number | null;
  name: string;
  description: string;
  image_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

// DTO para POST (crear) y PUT (actualizar) — solo los campos que edita el usuario
export interface CategoryRequestDto {
  id_parent_category: number | null;
  name: string;
  description: string;
  image_url: string | null;
  status: string;
}

// DTO para la búsqueda con filtros — nota: el backend usa "q", no "search"
export interface CategorySearchRequestDto {
  q?: string;
  page?: number;
  pageSize?: number;
}

// DTO para respuestas paginadas del backend
export interface CategoryPaginatedResponseDto {
  items: Category[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// DTO para mensajes genéricos del backend (ej. confirmación de DELETE)
export interface CategoryResponseMessageDto {
  message: string;
}
