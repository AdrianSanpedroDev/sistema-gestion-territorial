import { Component, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapService } from '../../../services/map.service';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule], // Se remueve DemarcationToolsComponent de aquí
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit, OnDestroy {
  // Configuración del mapa (Manizales por defecto)
  @Input() initialLat = 5.06889;
  @Input() initialLng = -75.51738;
  @Input() initialZoom = 14;

  constructor(private mapService: MapService) {}

  ngAfterViewInit(): void {
    // Inicializa el mapa usando la ID del contenedor HTML
    this.mapService.initMap('territorial-map', this.initialLat, this.initialLng, this.initialZoom);
  }

  ngOnDestroy(): void {
    this.mapService.clearMap();
  }
}