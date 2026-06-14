import { Component, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { MapService } from '../../../services/map.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @Input() initialLat: number = 5.06889; // Latitud por defecto (ej. Manizales)
  @Input() initialLng: number = -75.51738; // Longitud por defecto
  @Input() initialZoom: number = 14;

  constructor(private mapService: MapService) {}

  ngAfterViewInit(): void {
    // Inicializamos el mapa una vez que el DOM está listo
    this.mapService.initMap('territorial-map', this.initialLat, this.initialLng, this.initialZoom);
  }

  ngOnDestroy(): void {
    // Es buena práctica limpiar si el componente se destruye
    this.mapService.clearMap();
  }
}