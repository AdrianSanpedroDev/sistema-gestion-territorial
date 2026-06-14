import { Point } from './point';

// Representa un punto temporal en el mapa antes de ser persistido en BD
export interface DraftPoint {
    latitude: number;
    longitude: number;
    order: number;
    point_type: string; // Por defecto será 'boundary' para el polígono
}

// Opcional: Para mantener el estado de la vista del mapa
export interface MapViewConfig {
    centerLat: number;
    centerLng: number;
    zoom: number;
}