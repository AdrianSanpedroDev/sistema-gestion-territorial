export interface Entity {
  id_entity: number;
  name: string;
  description: string;
  type: 'public' | 'private';
  nit: string;
  email: string;
  phone: string;
  address: string;
  logo_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface EntityRequestDto {
  name: string;
  description: string;
  type: 'public' | 'private';
  nit: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  logo_url?: string | null;
}

export interface EntitySearchRequestDto {
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface EntityPaginatedResponseDto {
  items: Entity[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface EntityResponseMessageDto {
  message: string;
}
