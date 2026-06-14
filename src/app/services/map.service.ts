import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import * as L from 'leaflet';
import { DraftPoint } from '../models/map';
//este servicio usa leaflet para el mapa
@Injectable({
  providedIn: 'root'
})
export class MapService {
  private map!: L.Map;
  private polygonLayer!: L.Polygon;
  private markersLayer: L.LayerGroup = new L.LayerGroup();
  
  // Arreglo temporal de coordenadas dibujadas
  private currentCoordinates: L.LatLng[] = [];

  // Emitirá las coordenadas cada vez que cambien (al hacer clic o arrastrar)
  private coordinatesSubject = new Subject<DraftPoint[]>();

  constructor() {}

  /**
   * 1. Inicializa el mapa en un contenedor HTML dado
   */
  initMap(elementId: string, centerLat: number, centerLng: number, zoom: number = 15): void {
    if (this.map) {
      this.map.remove(); // Limpiar instancia previa si existe
    }

    this.map = L.map(elementId).setView([centerLat, centerLng], zoom);

    // Cargar capa base (OpenStreetMap por defecto)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.markersLayer.addTo(this.map);
    
    // Inicializar el polígono (Flujo: uniendo puntos en tiempo real)
    this.polygonLayer = L.polygon([], { color: '#3388ff', weight: 3 }).addTo(this.map);

    // Escuchar clics en el mapa para agregar puntos
    this.map.on('click', (e: L.LeafletMouseEvent) => this.onMapClick(e));
  }

  /**
   * 2. Maneja el evento de clic en el mapa
   */
  private onMapClick(e: L.LeafletMouseEvent): void {
    const latlng = e.latlng;
    this.addPointToPolygon(latlng);
  }

  /**
   * 3. Añade un punto al polígono actual y dibuja un marcador
   */
  private addPointToPolygon(latlng: L.LatLng): void {
    this.currentCoordinates.push(latlng);
    this.updatePolygonRender();
    this.addDraggableMarker(latlng, this.currentCoordinates.length - 1);
    this.emitCoordinatesChange();
  }

  /**
   * 4. Dibuja un marcador arrastrable (Cumple el Flujo alternativo 3a)
   */
  private addDraggableMarker(latlng: L.LatLng, index: number): void {
    const marker = L.marker(latlng, { draggable: true });
    
    marker.on('drag', (e) => {
      const newLatLng = e.target.getLatLng();
      this.currentCoordinates[index] = newLatLng;
      this.updatePolygonRender(); // Actualiza polígono en tiempo real al arrastrar
      this.emitCoordinatesChange();
    });

    this.markersLayer.addLayer(marker);
  }

  /**
   * 5. Refresca el polígono visualmente en el mapa
   */
  private updatePolygonRender(): void {
    this.polygonLayer.setLatLngs(this.currentCoordinates);
  }

  /**
   * 6. Convierte las coordenadas de Leaflet a nuestro modelo DraftPoint y las emite
   */
  private emitCoordinatesChange(): void {
    const drafts: DraftPoint[] = this.currentCoordinates.map((c, index) => ({
      latitude: c.lat,
      longitude: c.lng,
      order: index + 1,
      point_type: 'boundary' // Tipo por defecto para el perímetro del barrio
    }));
    this.coordinatesSubject.next(drafts);
  }

  /**
   * 7. Observable al que el Componente se va a suscribir
   */
  getCoordinatesObservable(): Observable<DraftPoint[]> {
    return this.coordinatesSubject.asObservable();
  }

  /**
   * 8. Carga un polígono existente (por si el barrio ya tenía puntos demarcados)
   */
  loadExistingPolygon(points: DraftPoint[]): void {
    this.clearMap();
    // Ordenar los puntos usando el campo 'order'
    const sortedPoints = points.sort((a, b) => a.order - b.order);
    
    sortedPoints.forEach(p => {
      const latlng = L.latLng(p.latitude, p.longitude);
      this.addPointToPolygon(latlng);
    });
  }

  /**
   * Limpia marcadores y coordenadas (Útil para reiniciar o cambiar de barrio)
   */
  clearMap(): void {
    this.currentCoordinates = [];
    this.markersLayer.clearLayers();
    this.updatePolygonRender();
    this.emitCoordinatesChange();
  }
}