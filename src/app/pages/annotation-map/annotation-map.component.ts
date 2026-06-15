import {
  Component, OnInit, AfterViewInit, OnDestroy,
  ViewChild, ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import * as L from 'leaflet';
import Swal from 'sweetalert2';

import { environment } from '../../../environments/environments';
import { AnnotationService } from '../../services/annotation.service';
import { CategoryService } from '../../services/category.service';
import { NeighborhoodService } from '../../services/neighborhood.service';
import { CitizenService } from '../../services/citizen.service';
import { SecurityService } from '../../services/security.service';
import { VoteService } from '../../services/vote.service';

import { Annotation, AnnotationCategory, Evidence } from '../../models/annotation';
import { Category } from '../../models/category';
import { Neighborhood } from '../../models/neighborhood';
import { Vote } from '../../models/vote';

// Nodo del árbol jerárquico de categorías (categoría + sus subcategorías + conteo).
interface CategoryNode extends Category {
  children: CategoryNode[];
  count: number;
  expanded: boolean;
}

// Detalle de la anotación seleccionada (panel derecho).
interface AnnotationDetail {
  annotation: Annotation;
  rootCategoryNames: string[];   // categorías padre asignadas
  subCategoryNames: string[];    // subcategorías asignadas
  categoryLabel: string;         // etiqueta principal (para el popup)
  evidences: Evidence[];
}

// Distribución de estrellas (1–5) para las barras del promedio.
interface RatingDistribution {
  stars: number;
  count: number;
  percentage: number;
}

@Component({
  selector: 'app-annotation-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './annotation-map.component.html',
  styleUrls: ['./annotation-map.component.scss'],
})
export class AnnotationMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  // --- Mapa propio (NO se reutiliza el MapService de polígonos de Nico / CU-09) ---
  private map?: L.Map;
  private markersLayer = L.layerGroup();

  // --- Categorías / árbol de filtros ---
  allCategories: Category[] = [];
  categoryTree: CategoryNode[] = [];
  private categoryNodeMap = new Map<number, CategoryNode>();
  selectedCategoryIds: number[] = [];

  // Filtro "Sin categoría": anotaciones sin ninguna fila en la tabla pivot.
  noCategorySelected = false;
  uncategorizedCount = 0;

  // --- Anotaciones y su relación con categorías (tabla pivot) ---
  allAnnotations: Annotation[] = [];
  private annotationCategoryMap = new Map<number, number[]>();
  filteredAnnotations: Annotation[] = [];

  // --- Filtro por territorio (F2) ---
  neighborhoods: Neighborhood[] = [];
  selectedNeighborhoodId: number | null = null;

  // --- Detalle + calificación (CU-13) ---
  selectedAnnotationDetail: AnnotationDetail | null = null;
  loadingAnnotations = false;
  noAnnotationResults = false;

  // Estado de votación de la anotación seleccionada.
  averageRating = 0;
  totalVotes = 0;
  ratingDistribution: RatingDistribution[] = [];
  myStars = 0;
  myComment = '';
  private existingVote: Vote | null = null;
  savingVote = false;

  // Ciudadano autenticado (resuelto por email contra el backend).
  private currentCitizenId: number | null = null;
  isCitizen = false;
  canRate = false;

  private categoryColors = ['#1d4ed8', '#16a34a', '#ea580c', '#9333ea', '#0ea5e9', '#d97706'];
  private apiUrl = environment.apiUrl;

  constructor(
    private annotationService: AnnotationService,
    private categoryService: CategoryService,
    private neighborhoodService: NeighborhoodService,
    private citizenService: CitizenService,
    private securityService: SecurityService,
    private voteService: VoteService,
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.resolveCurrentCitizen();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  // ======================= MAPA (Leaflet autocontenido) =======================

  private initMap(): void {
    this.fixMarkerIcons();
    // Manizales por defecto.
    this.map = L.map(this.mapContainer.nativeElement).setView([5.06889, -75.51738], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    this.markersLayer.addTo(this.map);

    // Si los datos llegaron antes que la vista, pintamos ya los marcadores.
    this.renderMarkers();
  }

  private renderMarkers(): void {
    if (!this.map) return;
    this.markersLayer.clearLayers();

    this.filteredAnnotations.forEach((annotation) => {
      const color = this.getPrimaryCategoryColor(annotation);
      const marker = L.marker([annotation.latitude, annotation.longitude], {
        icon: L.divIcon({
          className: 'annotation-marker',
          html: `<span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.25);"></span>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        }),
      });

      marker.bindPopup(`
        <div style="max-width:220px;line-height:1.4;font-size:14px;">
          <strong>${annotation.description ?? 'Anotación'}</strong><br/>
          <span style="color:#4a5568">${this.getPrimaryCategoryLabel(annotation)}</span>
        </div>
      `);
      marker.on('click', () => this.selectAnnotation(annotation));
      this.markersLayer.addLayer(marker);
    });
  }

  private fixMarkerIcons(): void {
    const icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });
    L.Marker.prototype.options.icon = icon;
  }

  // ======================= CARGA DE DATOS =======================

  // Normaliza arrays planos o respuestas paginadas { items } a un array simple.
  private toArray<T>(response: T[] | { items: T[] }): T[] {
    return Array.isArray(response) ? response : (response as { items: T[] })?.items ?? [];
  }

  private loadData(): void {
    this.loadingAnnotations = true;
    forkJoin({
      annotations: this.annotationService.getAll(),
      annotationCategories: this.annotationService.getAllAnnotationCategories(),
      categories: this.categoryService.getAll(),
      neighborhoods: this.neighborhoodService.getAll(),
    }).subscribe({
      next: ({ annotations, annotationCategories, categories, neighborhoods }) => {
        this.allAnnotations = this.toArray(annotations);
        this.allCategories = this.toArray(categories);
        this.neighborhoods = this.toArray(neighborhoods);

        this.buildAnnotationCategoryMap(this.toArray(annotationCategories));
        this.buildCategoryTree(this.allCategories);
        this.updateCategoryCounts();
        this.applyFilters();
        this.loadingAnnotations = false;
      },
      error: (err) => {
        console.error('Error cargando datos del mapa de anotaciones', err);
        this.loadingAnnotations = false;
      },
    });
  }

  // Email del usuario Firebase → id_citizen del backend (no hay mapeo directo de uid).
  private resolveCurrentCitizen(): void {
    this.securityService.getCurrentUser().subscribe((user) => {
      this.isCitizen = user?.role === 'ciudadano';
      if (!user?.email) {
        this.canRate = false;
        return;
      }
      this.citizenService.getAll().subscribe({
        next: (res) => {
          const citizens = this.toArray(res);
          const match = citizens.find(
            (c) => c.email?.toLowerCase() === user.email.toLowerCase(),
          );
          this.currentCitizenId = match?.id_citizen ?? null;
          // CU-13: solo un ciudadano registrado (con id_citizen) puede calificar.
          this.canRate = this.isCitizen && this.currentCitizenId !== null;
        },
        error: () => (this.canRate = false),
      });
    });
  }

  // ======================= ÁRBOL DE CATEGORÍAS =======================

  private buildAnnotationCategoryMap(items: AnnotationCategory[]): void {
    this.annotationCategoryMap.clear();
    items.forEach((item) => {
      const list = this.annotationCategoryMap.get(item.id_annotation) ?? [];
      list.push(item.id_category);
      this.annotationCategoryMap.set(item.id_annotation, list);
    });
  }

  private buildCategoryTree(categories: Category[]): void {
    this.categoryNodeMap.clear();
    const nodeMap = new Map<number, CategoryNode>();

    categories.forEach((category) => {
      nodeMap.set(category.id_category, { ...category, children: [], count: 0, expanded: false });
    });

    const roots: CategoryNode[] = [];
    nodeMap.forEach((node) => {
      const parent = node.id_parent_category ? nodeMap.get(node.id_parent_category) : undefined;
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    this.categoryTree = roots;
    nodeMap.forEach((node, id) => this.categoryNodeMap.set(id, node));
  }

  // Conteo de anotaciones por nodo (incluye las de sus subcategorías) — paso 4 del CU-14.
  private updateCategoryCounts(): void {
    const index = new Map<number, Set<number>>();
    this.allAnnotations.forEach((annotation) => {
      (this.annotationCategoryMap.get(annotation.id_annotation) ?? []).forEach((categoryId) => {
        const set = index.get(categoryId) ?? new Set<number>();
        set.add(annotation.id_annotation);
        index.set(categoryId, set);
      });
    });

    const computeCount = (node: CategoryNode): void => {
      const descendantIds = this.getDescendantCategoryIds(node);
      const annotationIds = new Set<number>();
      index.forEach((ids, categoryId) => {
        if (descendantIds.has(categoryId)) ids.forEach((id) => annotationIds.add(id));
      });
      node.count = annotationIds.size;
      node.children.forEach(computeCount);
    };

    this.categoryTree.forEach(computeCount);

    // Conteo de anotaciones sin ninguna categoría asociada.
    this.uncategorizedCount = this.allAnnotations.filter(
      (a) => (this.annotationCategoryMap.get(a.id_annotation) ?? []).length === 0,
    ).length;
  }

  private getDescendantCategoryIds(node: CategoryNode): Set<number> {
    const ids = new Set<number>([node.id_category]);
    node.children.forEach((child) => {
      this.getDescendantCategoryIds(child).forEach((id) => ids.add(id));
    });
    return ids;
  }

  // ======================= FILTROS (CU-14) =======================

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

  toggleNoCategory(): void {
    this.noCategorySelected = !this.noCategorySelected;
    this.applyFilters();
  }

  clearFilters(): void {
    this.selectedCategoryIds = [];
    this.noCategorySelected = false;
    this.selectedNeighborhoodId = null;
    this.applyFilters();
  }

  onNeighborhoodChange(): void {
    this.applyFilters();
  }

  // Expande las categorías seleccionadas a todos sus descendientes (flujo 8a:
  // seleccionar la categoría padre incluye todas sus subcategorías).
  private computeSelectedCategoryIds(): Set<number> {
    const selected = new Set<number>();
    if (!this.selectedCategoryIds.length) return selected;
    this.selectedCategoryIds.forEach((categoryId) => {
      const node = this.categoryNodeMap.get(categoryId);
      if (node) this.getDescendantCategoryIds(node).forEach((id) => selected.add(id));
    });
    return selected;
  }

  private applyFilters(): void {
    const selectedCategoryIds = this.computeSelectedCategoryIds();
    const hasCategoryFilter = selectedCategoryIds.size > 0 || this.noCategorySelected;

    this.filteredAnnotations = this.allAnnotations.filter((annotation) => {
      const categoryIds = this.annotationCategoryMap.get(annotation.id_annotation) ?? [];

      // Sin ningún filtro de categoría → mostrar todas. Con filtro → unión de
      // las categorías marcadas y (si aplica) las anotaciones sin categoría.
      const matchesCategory =
        !hasCategoryFilter ||
        (this.noCategorySelected && categoryIds.length === 0) ||
        categoryIds.some((categoryId) => selectedCategoryIds.has(categoryId));

      const matchesNeighborhood =
        this.selectedNeighborhoodId === null ||
        annotation.id_neighborhood === this.selectedNeighborhoodId;

      return matchesCategory && matchesNeighborhood;
    });

    this.noAnnotationResults = this.filteredAnnotations.length === 0;
    this.renderMarkers();
  }

  // ======================= COLOR / ETIQUETA DE CATEGORÍA =======================

  // Primer nodo de categoría válido (ignora ids huérfanos que ya no existen).
  private firstValidCategory(annotation: Annotation): CategoryNode | null {
    const categoryIds = this.annotationCategoryMap.get(annotation.id_annotation) ?? [];
    for (const id of categoryIds) {
      const node = this.categoryNodeMap.get(id);
      if (node) return node;
    }
    return null;
  }

  private getPrimaryCategoryLabel(annotation: Annotation): string {
    const node = this.firstValidCategory(annotation);
    return node ? this.findRootCategory(node).name : 'Sin categoría';
  }

  private getPrimaryCategoryColor(annotation: Annotation): string {
    const category = this.firstValidCategory(annotation);
    if (!category) return '#475569';
    const root = this.findRootCategory(category);
    const rootIndex = this.categoryTree.findIndex((c) => c.id_category === root.id_category);
    return this.categoryColors[(rootIndex < 0 ? 0 : rootIndex) % this.categoryColors.length];
  }

  private findRootCategory(node: CategoryNode): CategoryNode {
    if (!node.id_parent_category) return node;
    const parent = this.categoryNodeMap.get(node.id_parent_category);
    return parent ? this.findRootCategory(parent) : node;
  }

  // Color del nodo en la leyenda/árbol (mismo criterio que el marcador).
  categoryColor(node: CategoryNode): string {
    const root = this.findRootCategory(node);
    const rootIndex = this.categoryTree.findIndex((c) => c.id_category === root.id_category);
    return this.categoryColors[(rootIndex < 0 ? 0 : rootIndex) % this.categoryColors.length];
  }

  // ======================= DETALLE + CALIFICACIÓN (CU-13) =======================

  selectAnnotation(annotation: Annotation): void {
    const categoryIds = this.annotationCategoryMap.get(annotation.id_annotation) ?? [];
    const rootNames = new Set<string>();
    const subNames = new Set<string>();

    categoryIds.forEach((id) => {
      const node = this.categoryNodeMap.get(id);
      if (!node) return;
      if (node.id_parent_category) {
        subNames.add(node.name);
        // La categoría padre se deriva del árbol aunque no esté asignada explícitamente.
        rootNames.add(this.findRootCategory(node).name);
      } else {
        rootNames.add(node.name);
      }
    });

    this.selectedAnnotationDetail = {
      annotation,
      rootCategoryNames: [...rootNames],
      subCategoryNames: [...subNames],
      categoryLabel: this.getPrimaryCategoryLabel(annotation),
      evidences: [],
    };

    // Resetear estado de calificación antes de recargar.
    this.resetRatingState();

    this.loadEvidences(annotation.id_annotation);
    this.loadVotes(annotation.id_annotation);
    this.loadMyVote(annotation.id_annotation);
  }

  closeDetail(): void {
    this.selectedAnnotationDetail = null;
  }

  private resetRatingState(): void {
    this.averageRating = 0;
    this.totalVotes = 0;
    this.ratingDistribution = [];
    this.myStars = 0;
    this.myComment = '';
    this.existingVote = null;
  }

  private loadEvidences(annotationId: number): void {
    this.annotationService.getEvidences(annotationId).subscribe({
      next: (res) => {
        if (this.selectedAnnotationDetail?.annotation.id_annotation === annotationId) {
          this.selectedAnnotationDetail.evidences = this.toArray(res);
        }
      },
      error: () => {
        if (this.selectedAnnotationDetail?.annotation.id_annotation === annotationId) {
          this.selectedAnnotationDetail.evidences = [];
        }
      },
    });
  }

  // Promedio + distribución se calculan en frontend (el backend no los devuelve).
  private loadVotes(annotationId: number): void {
    this.voteService.getByAnnotation(annotationId).subscribe({
      next: (allVotes) => {
        if (this.selectedAnnotationDetail?.annotation.id_annotation !== annotationId) return;
        // Defensa: el backend /votes/search no filtra de forma fiable por id_annotation,
        // así que volvemos a filtrar en el cliente para no mezclar votos de otras anotaciones.
        const votes = allVotes.filter((v) => v.id_annotation === annotationId);
        this.totalVotes = votes.length;
        this.averageRating = votes.length
          ? votes.reduce((sum, v) => sum + v.stars, 0) / votes.length
          : 0;
        this.ratingDistribution = [5, 4, 3, 2, 1].map((stars) => {
          const count = votes.filter((v) => v.stars === stars).length;
          return {
            stars,
            count,
            percentage: votes.length ? (count / votes.length) * 100 : 0,
          };
        });
      },
      error: () => this.resetRatingState(),
    });
  }

  // ¿El ciudadano autenticado ya votó? → precargar para editar (flujo 4a).
  private loadMyVote(annotationId: number): void {
    if (this.currentCitizenId === null) return;
    this.voteService.getByAnnotationAndCitizen(annotationId, this.currentCitizenId).subscribe({
      next: (allVotes) => {
        if (this.selectedAnnotationDetail?.annotation.id_annotation !== annotationId) return;
        // Defensa: re-filtramos en el cliente por anotación y ciudadano, porque el
        // backend /votes/search no respeta de forma fiable el parámetro id_annotation.
        const votes = allVotes.filter(
          (v) => v.id_annotation === annotationId && v.id_citizen === this.currentCitizenId,
        );
        this.existingVote = votes[0] ?? null;
        if (this.existingVote) {
          this.myStars = this.existingVote.stars;
          this.myComment = this.existingVote.comment ?? '';
        }
      },
    });
  }

  setMyStars(stars: number): void {
    if (!this.canRate) return;
    this.myStars = stars;
  }

  get alreadyVoted(): boolean {
    return this.existingVote !== null;
  }

  get roundedAverage(): number {
    return Math.round(this.averageRating);
  }

  submitRating(): void {
    if (!this.canRate || !this.selectedAnnotationDetail) return;
    if (this.myStars < 1 || this.myStars > 5) {
      Swal.fire('Calificación requerida', 'Selecciona entre 1 y 5 estrellas.', 'warning');
      return;
    }

    const annotationId = this.selectedAnnotationDetail.annotation.id_annotation;
    this.savingVote = true;

    const onSuccess = () => {
      this.savingVote = false;
      this.loadVotes(annotationId);
      this.loadMyVote(annotationId);
      Swal.fire('¡Gracias!', 'Tu calificación quedó registrada.', 'success');
    };
    const onError = (err: { error?: { message?: string } }) => {
      this.savingVote = false;
      Swal.fire('Error', err?.error?.message ?? 'No se pudo registrar la calificación.', 'error');
    };

    if (this.existingVote) {
      // Flujo alternativo 4a: editar el voto existente.
      this.voteService
        .updateVote(this.existingVote.id_vote, { stars: this.myStars, comment: this.myComment })
        .subscribe({ next: onSuccess, error: onError });
    } else {
      this.voteService
        .createVote({
          id_citizen: this.currentCitizenId!,
          id_annotation: annotationId,
          stars: this.myStars,
          comment: this.myComment,
        })
        .subscribe({ next: onSuccess, error: onError });
    }
  }

  evidenceUrl(evidence: Evidence): string {
    return `${this.apiUrl}/images/${evidence.file_url}`;
  }
}
