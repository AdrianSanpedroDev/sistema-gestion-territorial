import { Component, Input, Output, EventEmitter,
         AfterViewInit, OnDestroy, OnChanges, SimpleChanges,
         ViewChild, ElementRef } from '@angular/core';

import * as L from 'leaflet';
import { Coordinates } from '../../../models/coordinates';

@Component({
  selector: 'app-map-picker',
  standalone: true,
  imports: [],
  templateUrl: './map-picker.component.html',
  styleUrl: './map-picker.component.scss'
})
export class MapPickerComponent implements AfterViewInit, OnChanges, OnDestroy {

  @Input() initialLatitude?: number;
  @Input() initialLongitude?: number;
  @Input() polygon?: Coordinates[];

  @Output() locationSelected = new EventEmitter<Coordinates>();

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  private map?: L.Map;
  private marker?: L.Marker;

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;

    if (changes['initialLatitude'] || changes['initialLongitude']) {
      const lat = this.initialLatitude;
      const lng = this.initialLongitude;
      if (lat != null && lng != null) {
        this.map.setView([lat, lng], 15);
        this.placeMarker(lat, lng);
      }
    }

    if (changes['polygon'] && this.polygon?.length) {
      this.drawPolygon();
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initMap(): void {
    const lat = this.initialLatitude ?? 4.7110;
    const lng = this.initialLongitude ?? -74.0721;
    const zoom = this.initialLatitude ? 15 : 12;

    this.map = L.map(this.mapContainer.nativeElement).setView([lat, lng], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.fixMarkerIcons();

    if (this.initialLatitude && this.initialLongitude) {
      this.placeMarker(this.initialLatitude, this.initialLongitude);
    }

    if (this.polygon?.length) {
      this.drawPolygon();
    }

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.placeMarker(e.latlng.lat, e.latlng.lng);
      this.locationSelected.emit({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    });
  }

  private placeMarker(lat: number, lng: number): void {
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng]).addTo(this.map!);
    }
  }

  private drawPolygon(): void {
    const latlngs = this.polygon!.map(
      c => [c.latitude, c.longitude] as L.LatLngTuple
    );
    L.polygon(latlngs, { color: '#3b82f6', fillOpacity: 0.15 }).addTo(this.map!);
  }

  private fixMarkerIcons(): void {
    const icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = icon;
  }
}
