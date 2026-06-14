import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { Subscription, forkJoin } from 'rxjs';

// Servicios y Modelos
import { MapService } from '../../services/map.service';
import { PointService } from '../../services/point.service';
import { NeighborhoodService } from '../../services/neighborhood.service'; 
import { Neighborhood } from '../../models/neighborhood';
import { DraftPoint } from '../../models/map';
import { PointRequestDto } from '../../models/point';

// Importación de Componentes Standalone hijos
import { NeighborhoodSidebarComponent } from '../../components/ui/neighborhood-sidebar/neighborhood-sidebar.component';
import { MapComponent } from '../../components/ui/map/map.component';
import { DemarcationToolsComponent } from '../../components/ui/demarcation-tools/demarcation-tools.component';

@Component({
  selector: 'territorial-management',
  standalone: true, 
  imports: [
    CommonModule, 
    NeighborhoodSidebarComponent, 
    MapComponent,
    DemarcationToolsComponent
  ], 
  templateUrl: './territorial-management.component.html',
  styleUrls: ['./territorial-management.component.css'] // Soportado correctamente como .scss
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

    // Sincroniza los puntos del mapa con el estado local de la página
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
    this.neighborhoodService.getAll().subscribe({
      next: (res: Neighborhood[]) => {
        this.allNeighborhoods = res; 

        if (searchTerm && searchTerm.trim() !== '') {
          this.neighborhoods = this.allNeighborhoods.filter(barrio =>
            barrio.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
        } else {
          this.neighborhoods = res; 
        }
        this.isLoadingNeighborhoods = false;
      },
      error: (err) => {
        console.error('Error cargando barrios', err);
        this.isLoadingNeighborhoods = false;
      }
    });
  }

  onSearch(term: string): void {
    this.loadNeighborhoods(term);
  }

  onSelectNeighborhood(neighborhood: Neighborhood): void {
    this.selectedNeighborhood = neighborhood;
    this.mapService.clearMap(); 
    
    this.pointService.getPoints({ id_neighborhood: neighborhood.id_neighborhood }).subscribe({
      next: (points) => {
        if (points && points.length > 0) {
          const draftPoints: DraftPoint[] = points.map(p => ({
            id_point: (p as any).id_point || (p as any).id, 
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
    console.log('Modo cambiado a:', mode);
  }

  /**
   * REQUERIMIENTO DE LIMPIEZA MASIVA: Elimina todo el polígono actual del backend y resetea el mapa
   */
  onClearPoints(): void {
    if (!this.selectedNeighborhood) {
      alert('Debe seleccionar un barrio primero.');
      return;
    }

    const pointsWithBackendId = this.currentPoints.filter(p => (p as any).id_point);

    if (pointsWithBackendId.length === 0) {
      this.mapService.clearMap();
      return;
    }

    if (confirm(`¿Está seguro de que desea eliminar permanentemente TODO el polígono de "${this.selectedNeighborhood.name}" de la base de datos?`)) {
      this.isSaving = true;

      const deleteRequests = pointsWithBackendId.map(p => {
        const backendId = (p as any).id_point;
        return this.pointService.deletePoint(backendId);
      });

      forkJoin(deleteRequests).subscribe({
        next: () => {
          this.mapService.clearMap(); 
          this.isSaving = false;
          alert('¡Polígono eliminado por completo del servidor y del mapa!');
        },
        error: (err) => {
          console.error('Error al ejecutar la limpieza masiva en servidor:', err);
          alert('Ocurrió un error al intentar eliminar el polígono del servidor.');
          this.isSaving = false;
        }
      });
    }
  }

  onCancel(): void {
    this.mapService.clearMap();
    this.selectedNeighborhood = null;
  }

  /**
   * BORRADO UNITARIO REAL: Elimina del backend (si ya existía) y quita del lienzo del mapa
   */
  onDeletePoint(index: number): void {
    const pointToDelete = this.currentPoints[index];

    if (pointToDelete) {
      const backendId = (pointToDelete as any).id_point;

      if (backendId) {
        this.pointService.deletePoint(backendId).subscribe({
          next: () => {
            this.mapService.deletePointByIndex(index);
          },
          error: (err) => {
            console.error('Error al intentar borrar el punto del servidor:', err);
            alert('No se pudo eliminar el punto del servidor. Inténtalo de nuevo.');
          }
        });
      } else {
        this.mapService.deletePointByIndex(index);
      }
    }
  }

  /**
   * GUARDA EL POLÍGONO DISTINGUIENDO ENTRE NUEVOS (POST) Y EXISTENTES (PUT)
   */
  onSavePolygon(points: DraftPoint[]): void {
    if (!this.selectedNeighborhood) {
      alert('Debe seleccionar un barrio primero.');
      return;
    }

    this.isSaving = true;

    const requests = points.map(p => {
      const payload: PointRequestDto = {
        id_neighborhood: this.selectedNeighborhood!.id_neighborhood,
        latitude: p.latitude,
        longitude: p.longitude,
        order: p.order,
        point_type: p.point_type || 'boundary'
      };

      // 🌟 CAMBIO CLAVE AQUÍ: Verificamos si el punto ya existe en la BD
      const backendId = (p as any).id_point;

      if (backendId) {
        // Si tiene ID, significa que se movió o reordenó -> Hacemos PUT (HU-10)
        return this.pointService.updatePoint(backendId, payload);
      } else {
        // Si NO tiene ID, significa que es un punto recién cliqueado -> Hacemos POST
        return this.pointService.createPoint(payload);
      }
    });

    forkJoin(requests).subscribe({
      next: () => {
        alert(`¡Polígono actualizado con éxito para el barrio ${this.selectedNeighborhood!.name}!`);
        this.isSaving = false;
        // Refrescamos para mapear los nuevos IDs generados por el backend a la interfaz
        this.onSelectNeighborhood(this.selectedNeighborhood!);
      },
      error: (err: any) => {
        console.error('Error guardando o editando polígono', err);
        alert('Ocurrió un error al procesar los cambios en las coordenadas.');
        this.isSaving = false;
      }
    });
  }
}