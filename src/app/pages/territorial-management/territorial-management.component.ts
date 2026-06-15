import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, forkJoin } from 'rxjs';

// Servicios y Modelos
import { MapService } from '../../services/map.service';
import { PointService } from '../../services/point.service';
import { NeighborhoodService } from '../../services/neighborhood.service';
import { AnnotationService } from '../../services/annotation.service';
import { CategoryService } from '../../services/category.service';
import { Neighborhood } from '../../models/neighborhood';
import { DraftPoint } from '../../models/map';
import { PointRequestDto } from '../../models/point';
import { Annotation, AnnotationCategory, Evidence } from '../../models/annotation';
import { Category } from '../../models/category';

// Importación de Componentes Standalone hijos
import { NeighborhoodSidebarComponent } from '../../components/ui/neighborhood-sidebar/neighborhood-sidebar.component';
import { MapComponent } from '../../components/ui/map/map.component';
import { DemarcationToolsComponent } from '../../components/ui/demarcation-tools/demarcation-tools.component';

interface CategoryNode extends Category {
  children: CategoryNode[];
  count: number;
  expanded: boolean;
}

interface AnnotationDetail {
  annotation: Annotation;
  categoryNames: string[];
  categoryLabel: string;
  evidences: Evidence[];
  rating: string;
}

@Component({
  selector: 'territorial-management',
  standalone: true,
  imports: [
    CommonModule,
    NeighborhoodSidebarComponent,
    MapComponent,
    DemarcationToolsComponent,
  ],
  templateUrl: './territorial-management.component.html',
  styleUrls: ['./territorial-management.component.css'],
})
export class TerritorialManagementComponent implements OnInit, OnDestroy {
  allNeighborhoods: Neighborhood[] = [];
  neighborhoods: Neighborhood[] = [];
  selectedNeighborhood: Neighborhood | null = null;
  isLoadingNeighborhoods = false;

  currentPoints: DraftPoint[] = [];
  coordsSubscription!: Subscription;

  isSaving = false;

  allCategories: Category[] = [];
  categoryTree: CategoryNode[] = [];
  categoryNodeMap = new Map<number, CategoryNode>();
  selectedCategoryIds: number[] = [];

  allAnnotations: Annotation[] = [];
  annotationCategories: AnnotationCategory[] = [];
  annotationCategoryMap = new Map<number, number[]>();
  filteredAnnotations: Annotation[] = [];

  selectedAnnotationDetail: AnnotationDetail | null = null;
  loadingAnnotations = false;
  noAnnotationResults = false;

  private categoryColors = ['#1d4ed8', '#16a34a', '#ea580c', '#9333ea', '#0ea5e9', '#d97706'];

  constructor(
    private mapService: MapService,
    private pointService: PointService,
    private neighborhoodService: NeighborhoodService,
    private annotationService: AnnotationService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.loadNeighborhoods();
    this.loadAnnotationsAndCategories();

    this.coordsSubscription = this.mapService.getCoordinatesObservable().subscribe(points => {
      this.currentPoints = points;
    });
  }

  ngOnDestroy(): void {
    this.coordsSubscription?.unsubscribe();
  }

  private loadAnnotationsAndCategories(): void {
    this.loadingAnnotations = true;
    forkJoin({
      annotations: this.annotationService.getAll(),
      annotationCategories: this.annotationService.getAllAnnotationCategories(),
      categories: this.categoryService.getAll(),
    }).subscribe({
      next: ({ annotations, annotationCategories, categories }) => {
        this.allAnnotations = annotations;
        this.annotationCategories = annotationCategories;
        this.allCategories = categories;

        this.buildAnnotationCategoryMap();
        this.buildCategoryTree(categories);
        this.updateCategoryCounts();
        this.applyFilters();
        this.loadingAnnotations = false;
      },
      error: (err) => {
        console.error('Error cargando anotaciones o categorías', err);
        this.loadingAnnotations = false;
      },
    });
  }

  private buildAnnotationCategoryMap(): void {
    this.annotationCategoryMap.clear();
    this.annotationCategories.forEach((item) => {
      const list = this.annotationCategoryMap.get(item.id_annotation) ?? [];
      list.push(item.id_category);
      this.annotationCategoryMap.set(item.id_annotation, list);
    });
  }

  private buildCategoryTree(categories: Category[]): void {
    this.categoryNodeMap.clear();
    const nodeMap = new Map<number, CategoryNode>();

    categories.forEach((category) => {
      nodeMap.set(category.id_category, {
        ...category,
        children: [],
        count: 0,
        expanded: false,
      });
    });

    const roots: CategoryNode[] = [];
    nodeMap.forEach((node) => {
      if (node.id_parent_category) {
        const parent = nodeMap.get(node.id_parent_category);
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    this.categoryTree = roots;
    nodeMap.forEach((node, id) => this.categoryNodeMap.set(id, node));
  }

  private updateCategoryCounts(): void {
    const annotationCategoryIndex = new Map<number, Set<number>>();
    this.allAnnotations.forEach((annotation) => {
      const categoryIds = this.annotationCategoryMap.get(annotation.id_annotation) ?? [];
      categoryIds.forEach((categoryId) => {
        const set = annotationCategoryIndex.get(categoryId) ?? new Set<number>();
        set.add(annotation.id_annotation);
        annotationCategoryIndex.set(categoryId, set);
      });
    });

    const computeCount = (node: CategoryNode): number => {
      const descendantIds = this.getDescendantCategoryIds(node);
      const annotationIds = new Set<number>();

      annotationCategoryIndex.forEach((ids, categoryId) => {
        if (descendantIds.has(categoryId)) {
          ids.forEach((annotationId) => annotationIds.add(annotationId));
        }
      });

      const count = annotationIds.size;
      node.count = count;
      node.children.forEach(computeCount);
      return count;
    };

    this.categoryTree.forEach(computeCount);
  }

  private getDescendantCategoryIds(node: CategoryNode): Set<number> {
    const ids = new Set<number>([node.id_category]);
    node.children.forEach((child) => {
      this.getDescendantCategoryIds(child).forEach((id) => ids.add(id));
    });
    return ids;
  }

  isCategorySelected(node: CategoryNode): boolean {
    return this.selectedCategoryIds.includes(node.id_category);
  }

  toggleCategorySelection(node: CategoryNode): void {
    const idx = this.selectedCategoryIds.indexOf(node.id_category);
    if (idx === -1) {
      this.selectedCategoryIds.push(node.id_category);
    } else {
      this.selectedCategoryIds.splice(idx, 1);
    }
    this.applyFilters();
  }

  toggleCategoryExpand(node: CategoryNode): void {
    node.expanded = !node.expanded;
  }

  clearCategoryFilters(): void {
    this.selectedCategoryIds = [];
    this.applyFilters();
  }

  private computeSelectedCategoryIds(): Set<number> {
    const selected = new Set<number>();

    if (!this.selectedCategoryIds.length) {
      return selected;
    }

    this.selectedCategoryIds.forEach((categoryId) => {
      const node = this.categoryNodeMap.get(categoryId);
      if (node) {
        this.getDescendantCategoryIds(node).forEach((id) => selected.add(id));
      }
    });
    return selected;
  }

  private applyFilters(): void {
    const selectedCategoryIds = this.computeSelectedCategoryIds();
    this.filteredAnnotations = this.allAnnotations.filter((annotation) => {
      const matchesCategory =
        selectedCategoryIds.size === 0 ||
        (this.annotationCategoryMap.get(annotation.id_annotation) ?? [])
          .some((categoryId) => selectedCategoryIds.has(categoryId));

      const matchesNeighborhood = this.selectedNeighborhood
        ? annotation.id_neighborhood === this.selectedNeighborhood.id_neighborhood
        : true;

      return matchesCategory && matchesNeighborhood;
    });

    const markers = this.filteredAnnotations.map((annotation) => ({
      ...annotation,
      categoryLabel: this.getPrimaryCategoryLabel(annotation),
      markerColor: this.getPrimaryCategoryColor(annotation),
    }));

    this.mapService.addAnnotationMarkers(markers, (annotation) => this.selectAnnotation(annotation));
    this.noAnnotationResults = this.filteredAnnotations.length === 0;
    if (this.noAnnotationResults && this.filteredAnnotations.length === 0) {
      this.selectedAnnotationDetail = null;
    }
  }

  private getPrimaryCategoryLabel(annotation: Annotation): string {
    const categoryIds = this.annotationCategoryMap.get(annotation.id_annotation) ?? [];
    if (!categoryIds.length) return 'Sin categoría';
    const category = this.categoryNodeMap.get(categoryIds[0]);
    return category?.name ?? 'Sin categoría';
  }

  private getPrimaryCategoryColor(annotation: Annotation): string {
    const categoryIds = this.annotationCategoryMap.get(annotation.id_annotation) ?? [];
    if (!categoryIds.length) return '#475569';

    const category = this.categoryNodeMap.get(categoryIds[0]);
    if (!category) return '#475569';

    const root = this.findRootCategory(category);
    const rootIndex = this.allCategories.findIndex((cat) => cat.id_category === root.id_category);
    return this.categoryColors[rootIndex % this.categoryColors.length];
  }

  private findRootCategory(node: CategoryNode): CategoryNode {
    if (!node.id_parent_category) {
      return node;
    }
    const parent = this.categoryNodeMap.get(node.id_parent_category);
    return parent ? this.findRootCategory(parent) : node;
  }

  private selectAnnotation(annotation: Annotation): void {
    const categoryIds = this.annotationCategoryMap.get(annotation.id_annotation) ?? [];
    const categoryNames = categoryIds
      .map((id) => this.categoryNodeMap.get(id)?.name)
      .filter((name): name is string => !!name);

    this.selectedAnnotationDetail = {
      annotation,
      categoryNames,
      categoryLabel: this.getPrimaryCategoryLabel(annotation),
      evidences: [],
      rating: 'N/A',
    };

    this.annotationService.getEvidences(annotation.id_annotation).subscribe({
      next: (evidences) => {
        if (this.selectedAnnotationDetail?.annotation.id_annotation === annotation.id_annotation) {
          this.selectedAnnotationDetail.evidences = evidences;
        }
      },
      error: () => {
        if (this.selectedAnnotationDetail?.annotation.id_annotation === annotation.id_annotation) {
          this.selectedAnnotationDetail.evidences = [];
        }
      },
    });
  }

  private getAnnotationSummary(annotation: Annotation): string {
    return annotation.description || 'Sin descripción';
  }

  onSelectNeighborhood(neighborhood: Neighborhood): void {
    this.selectedNeighborhood = neighborhood;
    this.mapService.clearMap();

    this.pointService.searchPoints({ id_neighborhood: neighborhood.id_neighborhood }).subscribe({
      next: (response) => {
        const points = response.items;
        if (points && points.length > 0) {
          const draftPoints: DraftPoint[] = points.map((p) => ({
            id_point: p.id_point,
            latitude: p.latitude,
            longitude: p.longitude,
            order: p.order,
            point_type: p.point_type,
          }));
          this.mapService.loadExistingPolygon(draftPoints);
        }
        this.applyFilters();
      },
      error: (err) => {
        console.error(`Error cargando puntos del barrio ${neighborhood.id_neighborhood}`, err);
        this.applyFilters();
      },
    });
  }

  // --- LÓGICA DEL SIDEBAR DE BARRIOS ---

  loadNeighborhoods(searchTerm?: string): void {
    this.isLoadingNeighborhoods = true;
    this.neighborhoodService.getAll().subscribe({
      next: (res: Neighborhood[]) => {
        this.allNeighborhoods = res;
        this.neighborhoods = searchTerm?.trim()
          ? this.allNeighborhoods.filter((barrio) =>
              barrio.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : res;
        this.isLoadingNeighborhoods = false;
      },
      error: (err) => {
        console.error('Error cargando barrios', err);
        this.isLoadingNeighborhoods = false;
      },
    });
  }

  onSearch(term: string): void {
    this.loadNeighborhoods(term);
  }

  // --- LÓGICA DE LAS HERRAMIENTAS DE DEMARCACIÓN ---

  onModeChange(mode: 'add' | 'edit'): void {
    console.log('Modo cambiado a:', mode);
  }

  onClearPoints(): void {
    if (!this.selectedNeighborhood) {
      alert('Debe seleccionar un barrio primero.');
      return;
    }

    const pointsWithBackendId = this.currentPoints.filter((p) => (p as any).id_point);
    if (pointsWithBackendId.length === 0) {
      this.mapService.clearMap();
      return;
    }

    if (
      confirm(
        `¿Está seguro de que desea eliminar permanentemente TODO el polígono de "${this.selectedNeighborhood.name}" de la base de datos?`
      )
    ) {
      this.isSaving = true;

      const deleteRequests = pointsWithBackendId.map((p) => {
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
        },
      });
    }
  }

  onCancel(): void {
    this.mapService.clearMap();
    this.selectedNeighborhood = null;
  }

  onDeletePoint(index: number): void {
    const pointToDelete = this.currentPoints[index];
    if (!pointToDelete) {
      return;
    }

    const backendId = (pointToDelete as any).id_point;
    if (backendId) {
      this.pointService.deletePoint(backendId).subscribe({
        next: () => {
          this.mapService.deletePointByIndex(index);
        },
        error: (err) => {
          console.error('Error al intentar borrar el punto del servidor:', err);
          alert('No se pudo eliminar el punto del servidor. Inténtalo de nuevo.');
        },
      });
    } else {
      this.mapService.deletePointByIndex(index);
    }
  }

  onSavePolygon(points: DraftPoint[]): void {
    if (!this.selectedNeighborhood) {
      alert('Debe seleccionar un barrio primero.');
      return;
    }

    this.isSaving = true;
    const requests = points.map((p) => {
      const payload: PointRequestDto = {
        id_neighborhood: this.selectedNeighborhood!.id_neighborhood,
        latitude: p.latitude,
        longitude: p.longitude,
        order: p.order,
        point_type: p.point_type || 'boundary',
      };

      const backendId = (p as any).id_point;
      return backendId
        ? this.pointService.updatePoint(backendId, payload)
        : this.pointService.createPoint(payload);
    });

    forkJoin(requests).subscribe({
      next: () => {
        alert(`¡Polígono actualizado con éxito para el barrio ${this.selectedNeighborhood!.name}!`);
        this.isSaving = false;
        this.onSelectNeighborhood(this.selectedNeighborhood!);
      },
      error: (err: any) => {
        console.error('Error guardando o editando polígono', err);
        alert('Ocurrió un error al procesar los cambios en las coordenadas.');
        this.isSaving = false;
      },
    });
  }
}
