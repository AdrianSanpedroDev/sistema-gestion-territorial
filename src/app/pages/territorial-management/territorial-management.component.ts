import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- IMPORTANTE para el *ngIf y *ngFor
import { Subscription, forkJoin } from 'rxjs';

// Servicios y Modelos
import { MapService } from '../../services/map.service';
import { PointService } from '../../services/point.service';
import { NeighborhoodService } from '../../services/neighborhood.service'; 
import { Neighborhood } from '../../models/neighborhood';
import { DraftPoint } from '../../models/map';
import { PointRequestDto } from '../../models/point';

// IMPORTA TUS COMPONENTES HIJOS AQUÍ (Verifica que la ruta sea correcta)
import { NeighborhoodSidebarComponent } from '../../components/ui/neighborhood-sidebar/neighborhood-sidebar.component';
import { MapComponent } from '../../components/ui/map/map.component';
import { DemarcationToolsComponent } from '../../components/ui/demarcation-tools/demarcation-tools.component';

@Component({
  selector: 'app-territorial-management',
  standalone: true, // <-- 1. Agrega esto para que la página sea independiente
  imports: [
    CommonModule, 
    NeighborhoodSidebarComponent, 
    MapComponent, 
    DemarcationToolsComponent
  ], // <-- 2. Registra los componentes hijos aquí
  templateUrl: './territorial-management.component.html',
  styleUrls: ['./territorial-management.component.css'] // <-- 3. CAMBIADO A .scss
})
export class TerritorialManagementComponent implements OnInit, OnDestroy {
  // Estado de los Barrios
  allNeighborhoods: Neighborhood[] = [];
  neighborhoods: Neighborhood[] = [];
  selectedNeighborhood: Neighborhood | null = null;
  isLoadingNeighborhoods: boolean = false;

  // Estado del Mapa y Coordenadas
  currentPoints: DraftPoint[] = [];
  coordsSubscription!: Subscription;

  // Estado de la interfaz
  isSaving: boolean = false;

  constructor(
    private mapService: MapService,
    private pointService: PointService,
    private neighborhoodService: NeighborhoodService
  ) {}

  ngOnInit(): void {
    this.loadNeighborhoods();

    // Nos suscribimos a los cambios en el mapa (cuando el usuario hace clic o arrastra)
    this.coordsSubscription = this.mapService.getCoordinatesObservable().subscribe(points => {
      this.currentPoints = points;
    });
  }

  ngOnDestroy(): void {
    if (this.coordsSubscription) {
      this.coordsSubscription.unsubscribe();
    }
  }

  // --- LÓGICA DEL SIDEBAR DE BARRIOS ---

  loadNeighborhoods(searchTerm?: string): void {
  this.isLoadingNeighborhoods = true;

  // Usamos 'getAll()' que es el método real de tu CrudService
  this.neighborhoodService.getAll().subscribe({
    next: (res: Neighborhood[]) => {
      // Guardamos la copia completa en memoria
      this.allNeighborhoods = res; 

      // Si el usuario escribió un término en el buscador, filtramos localmente
      if (searchTerm && searchTerm.trim() !== '') {
        this.neighborhoods = this.allNeighborhoods.filter(barrio =>
          barrio.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      } else {
        // Si no hay término de búsqueda, mostramos todos los barrios
        this.neighborhoods = res; 
      }
      
      this.isLoadingNeighborhoods = false;
    },
    error: (err) => {
      console.error('Error cargando barrios desde el CrudService', err);
      this.isLoadingNeighborhoods = false;
    }
  });
}

  onSearch(term: string): void {
    this.loadNeighborhoods(term);
  }

  onSelectNeighborhood(neighborhood: Neighborhood): void {
    this.selectedNeighborhood = neighborhood;
    this.mapService.clearMap(); // Limpiamos el mapa al cambiar de barrio
    
    // Verificamos si el barrio ya tiene puntos (polígono) guardados en BD
    this.pointService.getPoints({ id_neighborhood: neighborhood.id_neighborhood }).subscribe({
      next: (points) => {
        if (points && points.length > 0) {
          // Adaptamos el modelo de base de datos al modelo del mapa y lo dibujamos
          const draftPoints: DraftPoint[] = points.map(p => ({
            latitude: p.latitude,
            longitude: p.longitude,
            order: p.order,
            point_type: p.point_type
          }));
          this.mapService.loadExistingPolygon(draftPoints);
        }
      }
    });
  }

  // --- LÓGICA DE LAS HERRAMIENTAS DE DEMARCACIÓN ---

  onModeChange(mode: 'add' | 'edit'): void {
    // Si Leaflet requiriera configuraciones extra según el modo, se llamarían aquí
    // Por ahora, nuestro MapService permite agregar clics y arrastrar marcadores por defecto.
    console.log('Modo cambiado a:', mode);
  }

  onClearPoints(): void {
    this.mapService.clearMap();
  }

  onCancel(): void {
    this.mapService.clearMap();
    this.selectedNeighborhood = null;
  }

  onSavePolygon(points: DraftPoint[]): void {
    if (!this.selectedNeighborhood) {
      alert('Debe seleccionar un barrio primero.');
      return;
    }

    this.isSaving = true;

    // Preparamos los DTOs para enviar al backend
    // NOTA: Como en tu API se guarda punto por punto, usaremos forkJoin para enviar
    // todas las peticiones POST en paralelo y esperar a que terminen.
    const requests = points.map(p => {
      const payload: PointRequestDto = {
        id_neighborhood: this.selectedNeighborhood!.id_neighborhood,
        latitude: p.latitude,
        longitude: p.longitude,
        order: p.order,
        point_type: p.point_type || 'boundary'
      };
      return this.pointService.createPoint(payload);
    });

    // ATENCIÓN: Si vas a editar (HU-10), aquí primero deberías eliminar los puntos
    // anteriores de ese barrio antes de guardar los nuevos. Para la HU-09 (creación pura), esto basta:
    forkJoin(requests).subscribe({
      next: (responses) => {
        alert(`¡Polígono guardado exitosamente para el barrio ${this.selectedNeighborhood!.name}!`);
        this.isSaving = false;
        // Opcional: recargar los puntos desde el servidor para confirmar
      },
      error: (err: any) => {
        console.error('Error guardando polígono', err);
        alert('Ocurrió un error al guardar las coordenadas.');
        this.isSaving = false;
      }
    });
  }
}