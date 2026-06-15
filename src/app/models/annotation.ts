export interface Annotation {
  id_annotation: number;
  id_neighborhood: number | null;
  id_citizen: number;
  description: string;
  latitude: number;
  longitude: number;
  status: string;
  registration_date: string;
  citizen_name?: string;        // el backend puede devolverlo enriquecido
  neighborhood_name?: string;
}

export interface AnnotationCategory {
  id_annotation_category: number;
  id_category: number;
  id_annotation: number;
}

export interface Evidence {
  id_evidence: number;
  id_annotation: number;
  file_url: string;
  file_type: string;
  file_size: number;
  upload_date: string;
}

export interface InterestedParty {
  id_interested_party: number;
  id_entity: number;
  id_annotation: number;
  association_date: string;
}

export interface AnnotationRequestDto {
  id_neighborhood: number | null;
  id_citizen: number;
  description: string;
  latitude: number;
  longitude: number;
  status: string;
}

export interface AnnotationPaginatedResponseDto {
  items: Annotation[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
