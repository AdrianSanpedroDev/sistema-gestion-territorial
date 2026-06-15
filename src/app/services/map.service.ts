import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import * as L from 'leaflet';
import { DraftPoint } from '../models/map';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private map!: L.Map;
  private polygonLayer!: L.Polygon;
  private markersLayer: L.LayerGroup = new L.LayerGroup();
  private annotationLayer: L.LayerGroup = new L.LayerGroup();
  private currentCoordinates: L.LatLng[] = [];
  private coordinatesSubject = new Subject<DraftPoint[]>();
  private pendingAnnotations: any[] = [];
  private pendingAnnotationClick?: (item: any) => void;

  constructor() {
    this.fixMarkerIcons();
  }

  initMap(elementId: string, centerLat: number, centerLng: number, zoom: number = 15): void {
    if (this.map) {
      this.map.remove();
    }

    this.map = L.map(elementId).setView([centerLat, centerLng], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.markersLayer.addTo(this.map);
    this.annotationLayer.addTo(this.map);
    this.polygonLayer = L.polygon([], { color: '#3b82f6', weight: 3, fillOpacity: 0.15 }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => this.onMapClick(e));

    if (this.pendingAnnotations.length) {
      this.addAnnotationMarkers(this.pendingAnnotations, this.pendingAnnotationClick);
      this.pendingAnnotations = [];
      this.pendingAnnotationClick = undefined;
    }
  }

  private onMapClick(e: L.LeafletMouseEvent): void {
    this.addPointToPolygon(e.latlng);
  }

  private addPointToPolygon(latlng: L.LatLng): void {
    this.currentCoordinates.push(latlng);
    this.refreshMapObjects();
  }

  /**
   * Elimina un punto específico por su índice y refresca el mapa completo
   */
  deletePointByIndex(index: number): void {
    if (index >= 0 && index < this.currentCoordinates.length) {
      this.currentCoordinates.splice(index, 1);
      this.refreshMapObjects();
    }
  }

  /**
   * Sincroniza el polígono y los marcadores arrastrables basándose en el estado actual
   */
  private refreshMapObjects(): void {
    // 1. Actualizar Polígono
    this.polygonLayer.setLatLngs(this.currentCoordinates);

    // 2. Limpiar y Redibujar Marcadores para actualizar sus scopes/índices
    this.markersLayer.clearLayers();
    this.currentCoordinates.forEach((latlng, idx) => {
      const marker = L.marker(latlng, { draggable: true });
      
      marker.on('drag', (e) => {
        const newLatLng = e.target.getLatLng();
        
        // REQUERIMIENTO HU-10: Preservar el id_point original al arrastrar el marcador
        const existingId = (this.currentCoordinates[idx] as any).id_point;
        this.currentCoordinates[idx] = newLatLng;
        if (existingId) {
          (this.currentCoordinates[idx] as any).id_point = existingId;
        }

        this.polygonLayer.setLatLngs(this.currentCoordinates); // Render en tiempo real
      });

      marker.on('dragend', () => {
        this.emitCoordinatesChange();
      });

      this.markersLayer.addLayer(marker);
    });

    this.emitCoordinatesChange();
  }

  addAnnotationMarkers(annotations: any[], onMarkerClick?: (annotation: any) => void): void {
    if (!this.map) {
      this.pendingAnnotations = annotations;
      this.pendingAnnotationClick = onMarkerClick;
      return;
    }

    this.annotationLayer.clearLayers();

    annotations.forEach((annotation) => {
      const latlng = L.latLng(annotation.latitude, annotation.longitude);
      const marker = L.marker(latlng, {
        icon: L.divIcon({
          className: 'annotation-marker',
          html: `<span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:${annotation.markerColor};border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.25);"></span>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        }),
      });

      const popupHtml = `
        <div style="max-width:220px;line-height:1.4;font-size:14px;">
          <strong>${annotation.description ?? 'Anotación'}</strong><br/>
          <span style="color:#4a5568">${annotation.categoryLabel}</span><br/>
          <small style="color:#718096">${annotation.registration_date ?? ''}</small><br/>
          <div style="margin-top:6px;color:#2b6cb0;font-weight:600;">Haz clic para ver detalles</div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => onMarkerClick?.(annotation));
      this.annotationLayer.addLayer(marker);
    });
  }

  clearAnnotationMarkers(): void {
    this.annotationLayer.clearLayers();
  }

  private emitCoordinatesChange(): void {
    const drafts: DraftPoint[] = this.currentCoordinates.map((c, index) => ({
      id_point: (c as any).id_point, // 🌟 ¡SOLUCIÓN! Rescatamos el ID dinámico inyectado
      latitude: c.lat,
      longitude: c.lng,
      order: index + 1,
      point_type: 'boundary'
    }));
    this.coordinatesSubject.next(drafts);
  }

  getCoordinatesObservable(): Observable<DraftPoint[]> {
    return this.coordinatesSubject.asObservable();
  }

  loadExistingPolygon(points: DraftPoint[]): void {
    this.currentCoordinates = points
      .sort((a, b) => a.order - b.order)
      .map(p => {
        const ll = L.latLng(p.latitude, p.longitude);
        // Inyectamos dinámicamente el identificador único de la base de datos al objeto LatLng
        (ll as any).id_point = (p as any).id_point || (p as any).id;
        return ll;
      });
    
    this.refreshMapObjects();
  }

  clearMap(): void {
    this.currentCoordinates = [];
    this.markersLayer.clearLayers();
    this.polygonLayer.setLatLngs([]);
    this.emitCoordinatesChange();
  }

  private fixMarkerIcons(): void {
    const icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });
    L.Marker.prototype.options.icon = icon;
  }
}