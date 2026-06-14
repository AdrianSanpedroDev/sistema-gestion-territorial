import { Component, OnInit, OnDestroy, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { OfficialService } from '../../../services/official.service';
import { TrackingSocketService } from '../../../services/tracking-socket.service';
import { Official } from '../../../models/official';
import { OfficialTrackingPayload } from '../../../models/tracking'; // Importante para la inferencia

@Component({
  selector: 'app-tracking-sidebar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tracking-sidebar.component.html',
  styleUrls: ['./tracking-sidebar.component.scss']
})
export class TrackingSidebarComponent implements OnInit, OnDestroy {
  private officialService = inject(OfficialService);
  private socketService = inject(TrackingSocketService);
  
  private destroy$ = new Subject<void>();

  // NUEVO: Emite el funcionario seleccionado para centrar el mapa
  @Output() officialSelected = new EventEmitter<Official>();

  // Estado con inferencia estricta
  officials: Official[] = [];
  searchControl = new FormControl<string>(''); // Tipado a string
  isLoading = false;

  ngOnInit(): void {
    // 0. Asegurarnos de conectar el socket
    this.socketService.connect();

    // 1. Cargar lista inicial (búsqueda vacía)
    this.loadOfficials('');

    // 2. Lógica reactiva para la barra de búsqueda
    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((query: string | null) => {
      // Inferencia corregida: query puede ser null, usamos coalescencia nula
      this.loadOfficials(query ?? ''); 
    });

    // 3. Escuchar actualizaciones del Socket
    this.socketService.getTrackingUpdates().pipe(
      takeUntil(this.destroy$)
    ).subscribe((payload: OfficialTrackingPayload) => {
      // Inferencia corregida: le indicamos explícitamente el tipo de payload
      payload.officials.forEach((update) => {
        const index = this.officials.findIndex(o => o.id_official === update.id_official);
        if (index !== -1) {
          this.officials[index].last_gps_update = update.last_gps_update;
          this.officials[index].last_latitude = update.latitude;
          this.officials[index].last_longitude = update.longitude;
          this.officials[index].gps_active = true; 
        }
      });
    });
  }

  loadOfficials(query: string): void {
    this.isLoading = true;
    this.officialService.searchOfficials(query).subscribe({
      next: (data: Official[]) => {
        this.officials = data;
        this.isLoading = false;
      },
      error: (err: unknown) => {
        console.error('Error cargando funcionarios', err);
        this.isLoading = false;
      }
    });
  }

  isOnline(official: Official): boolean {
    return official.status === 'active' && official.gps_active;
  }

  // NUEVO: Método para emitir el evento al dar clic
  onSelectOfficial(official: Official): void {
    this.officialSelected.emit(official);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Opcional: si cierras el mapa/sidebar, limpias la conexión
    this.socketService.disconnect();
  }
}