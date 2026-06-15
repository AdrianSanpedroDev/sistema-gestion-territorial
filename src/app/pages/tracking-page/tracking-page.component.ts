import { Component, OnInit, OnDestroy, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as L from 'leaflet';

import { TrackingSidebarComponent } from '../../components/ui/tracking-sidebar/tracking-sidebar.component';
import { TrackingSocketService } from '../../services/tracking-socket.service';
import { OfficialService } from '../../services/official.service';
import { Official } from '../../models/official';
import { OfficialTrackingPayload, OfficialLocationUpdate } from '../../models/tracking';

@Component({
  selector: 'app-tracking-page',
  standalone: true,
  imports: [CommonModule, TrackingSidebarComponent],
  templateUrl: './tracking-page.component.html',
  styleUrls: ['./tracking-page.component.scss']
})
export class TrackingPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private socketService = inject(TrackingSocketService);
  private officialService = inject(OfficialService);
  
  private destroy$ = new Subject<void>();
  private map!: L.Map;
  
  // Diccionario para mantener la referencia de los marcadores en el mapa
  private markers: { [id_official: number]: L.Marker } = {};

  // Estadísticas para el Header
  stats = { active: 0, offline: 0, total: 0 };
  lastUpdateTime: Date = new Date();

  ngOnInit(): void {
    this.socketService.connect();
    this.loadInitialData();
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.listenToTrackingUpdates();
  }

  private initMap(): void {
    // Coordenadas centrales de Manizales
    this.map = L.map('main-tracking-map', { zoomControl: false }).setView([5.06889, -75.51738], 14);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Controles de zoom en la esquina inferior derecha como en el mockup
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
  }

  private loadInitialData(): void {
    // Cargamos todos para calcular estadísticas iniciales
    this.officialService.searchOfficials('').subscribe(officials => {
      this.stats.total = officials.length;
      this.stats.active = officials.filter(o => o.status === 'active' && o.gps_active).length;
      this.stats.offline = this.stats.total - this.stats.active;

      // Dibujar marcadores iniciales
      officials.forEach(off => {
        if (off.last_latitude && off.last_longitude) {
          this.updateOrAddMarker({
            id_official: off.id_official,
            latitude: off.last_latitude,
            longitude: off.last_longitude,
            last_gps_update: off.last_gps_update ?? new Date().toISOString(),
            name: off.name // <-- Agrega esta línea para que coincida con el modelo actualizado
          }, off.name, off.gps_active);
        }
      });
    });
  }

  private listenToTrackingUpdates(): void {
    this.socketService.getTrackingUpdates().pipe(
      takeUntil(this.destroy$)
    ).subscribe((payload: OfficialTrackingPayload) => {
      this.lastUpdateTime = new Date();
      
      payload.officials.forEach(update => {
        // Extraemos el nombre que ya viene desde el socket (Python), 
        // y si por alguna razón no viene, le ponemos un fallback.
        const officialName = update.name || 'Funcionario'; 
        
        this.updateOrAddMarker(update, officialName, true); 
      });
    });
  }

  /**
   * Crea o actualiza un marcador personalizado usando L.divIcon
   */
  private updateOrAddMarker(update: OfficialLocationUpdate, name: string, isOnline: boolean): void {
    const latlng = new L.LatLng(update.latitude, update.longitude);

    if (this.markers[update.id_official]) {
      // Si ya existe, solo animamos su posición
      this.markers[update.id_official].setLatLng(latlng);
    } else {
      // Si no existe, creamos el HTML personalizado basado en tu mockup
      const statusClass = isOnline ? 'bg-green-500' : 'bg-gray-400';
      const initial = name.charAt(0).toUpperCase();

      const customIcon = L.divIcon({
        className: 'custom-official-marker',
        html: `
          <div class="flex flex-col items-center">
            <div class="relative">
              <div class="w-10 h-10 rounded-full border-2 border-white shadow-md bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                ${initial}
              </div>
              <span class="absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${statusClass}"></span>
            </div>
            <div class="mt-1 bg-white px-2 py-0.5 rounded shadow-sm text-xs font-semibold text-gray-800 whitespace-nowrap">
              ${name}
            </div>
            <div class="bg-white px-1 rounded shadow-sm text-[10px] text-gray-500 whitespace-nowrap mt-0.5">
              ${new Date(update.last_gps_update).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
        `,
        iconSize: [80, 70], // Ajusta según el tamaño de tu HTML
        iconAnchor: [40, 35] // El punto del mapa que corresponde al centro del div
      });

      const marker = L.marker(latlng, { icon: customIcon }).addTo(this.map);
      this.markers[update.id_official] = marker;
    }
  }

  // Método que recibe el evento del sidebar
  onOfficialSelectedFromSidebar(official: Official): void {
    if (official.last_latitude && official.last_longitude) {
      // Centramos el mapa en el funcionario seleccionado con una animación fluida
      this.map.flyTo([official.last_latitude, official.last_longitude], 16, {
        animate: true,
        duration: 1.5
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) {
      this.map.remove();
    }
  }
}