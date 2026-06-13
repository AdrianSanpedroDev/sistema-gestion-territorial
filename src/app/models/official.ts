export interface Official {
  id_official: number;
  id_entity: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  gps_active: boolean;
  last_gps_update: string | null;
  last_latitude: number | null;
  last_longitude: number | null;
  entityName?: string;
}

export interface OfficialRequestDto {
  id_entity: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  gps_active: boolean;
}

export interface OfficialSearchRequestDto {
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface OfficialPaginatedResponseDto {
  items: Official[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface OfficialResponseMessageDto {
  message: string;
}
