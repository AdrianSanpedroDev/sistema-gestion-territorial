import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

import { forkJoin, of } from 'rxjs';

import { AnnotationService } from '../../../services/annotation.service';
import { CategoryService } from '../../../services/category.service';
import { CitizenService } from '../../../services/citizen.service';
import { EntityService } from '../../../services/entity.service';
import { NeighborhoodService } from '../../../services/neighborhood.service';
import { PointService } from '../../../services/point.service';

import { Annotation, AnnotationCategory, AnnotationRequestDto, Evidence, InterestedParty } from '../../../models/annotation';
import { Category } from '../../../models/category';
import { Citizen } from '../../../models/citizen';
import { Coordinates } from '../../../models/coordinates';
import { Entity } from '../../../models/entity';
import { Neighborhood } from '../../../models/neighborhood';

import { MapPickerComponent } from '../../../components/ui/map-picker/map-picker.component';


@Component({
  selector: 'app-annotation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MapPickerComponent],
  templateUrl: './annotation-form.component.html',
})
export class AnnotationFormComponent implements OnInit {
  private fb                  = inject(FormBuilder);
  private route               = inject(ActivatedRoute);
  private router              = inject(Router);
  private annotationService   = inject(AnnotationService);
  private citizenService      = inject(CitizenService);
  private neighborhoodService = inject(NeighborhoodService);
  private pointService        = inject(PointService);
  private categoryService = inject(CategoryService);
  private entityService = inject(EntityService);

  isEditMode     = false;
  annotationId?: number;

  citizens:      Citizen[]      = [];
  neighborhoods: Neighborhood[] = [];
  polygonCoords: Coordinates[]  = [];

  initialLatitude?:  number;
  initialLongitude?: number;

  allCategories:  Category[] = [];
  selectedCategoryIds: number[] = [];  // solo en modo crear
  selectedAnnotationCategories: AnnotationCategory[] = [];  // solo en modo editar

  allEntities:               Entity[]           = [];
  selectedEntityIds:         number[]           = [];  // solo en modo crear
  selectedInterestedParties: InterestedParty[]  = [];  // solo en modo editar

  selectedFiles:     File[]      = [];
  existingEvidences: Evidence[]  = [];


  form = this.fb.group({
    id_citizen:      [null as number | null, Validators.required],
    id_neighborhood: [null as number | null],
    description:     ['', [Validators.required, Validators.maxLength(500)]],
    status:          ['active', Validators.required],
    latitude:        [null as number | null, Validators.required],
    longitude:       [null as number | null, Validators.required],
  });

  ngOnInit(): void {
    this.form.get('id_neighborhood')!.valueChanges.subscribe((id) => {
      this.polygonCoords = [];
      if (id) this.loadPolygon(Number(id));
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!idParam;
    if (this.isEditMode) {
      this.annotationId = Number(idParam);
      this.loadAnnotation();
    }

    this.loadCitizens();
    this.loadNeighborhoods();
    this.loadCategories();
    this.loadEntities();

  }

  private loadAnnotation(): void {
    this.annotationService.getById(this.annotationId!).subscribe({
      next: (annotation: Annotation) => {
        this.form.patchValue({
          id_citizen:      annotation.id_citizen,
          id_neighborhood: annotation.id_neighborhood,
          description:     annotation.description,
          status:          annotation.status,
          latitude:        annotation.latitude,
          longitude:       annotation.longitude,
        }, { emitEvent: false });

        this.initialLatitude  = annotation.latitude;
        this.initialLongitude = annotation.longitude;
        this.annotationService.getAnnotationCategories(this.annotationId!).subscribe({
          next: (cats) => (this.selectedAnnotationCategories = cats),
          error: () => {},
        });
        this.annotationService.getInterestedParties(this.annotationId!).subscribe({
          next: (parties) => (this.selectedInterestedParties = parties),
          error: () => {},
        });
        this.annotationService.getEvidences(this.annotationId!).subscribe({
          next: (evs) => (this.existingEvidences = evs),
          error: () => {},
        });

        if (annotation.id_neighborhood) {
          this.loadPolygon(annotation.id_neighborhood);
        }
      },
      error: (err) =>
        Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message ?? 'No se pudo cargar la anotación.' }),
    });
  }

  private loadCitizens(): void {
    this.citizenService.getAll().subscribe({
      next: (data) => (this.citizens = data),
      error: () => {},
    });
  }

  private loadNeighborhoods(): void {
    this.neighborhoodService.getAll().subscribe({
      next: (data) => (this.neighborhoods = data),
      error: () => {},
    });
  }

  private loadPolygon(neighborhoodId: number): void {
    this.pointService.getPoints({ id_neighborhood: neighborhoodId }).subscribe({
      next: (points) => {
        this.polygonCoords = points
          .sort((a, b) => a.order - b.order)
          .map((p) => ({ latitude: p.latitude, longitude: p.longitude }));
      },
      error: () => {},
    });
  }

  onLocationSelected(coords: Coordinates): void {
    this.form.patchValue({ latitude: coords.latitude, longitude: coords.longitude });
    if (this.polygonCoords.length && !this.isPointInPolygon(coords, this.polygonCoords)) {
      Swal.fire({
        icon: 'warning',
        title: 'Fuera del barrio',
        text: 'La ubicación seleccionada está fuera del polígono del barrio seleccionado.',
      });
    }
  }

  private isPointInPolygon(point: Coordinates, poly: Coordinates[]): boolean {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].latitude,  yi = poly[i].longitude;
      const xj = poly[j].latitude,  yj = poly[j].longitude;
      const intersect =
        yi > point.longitude !== yj > point.longitude &&
        point.latitude < ((xj - xi) * (point.longitude - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  private loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (data) => (this.allCategories = data),
      error: () => {},
    });
  }

  isCategorySelected(cat: Category): boolean {
    if (this.isEditMode) {
      return this.selectedAnnotationCategories.some((ac) => ac.id_category === cat.id_category);
    }
    return this.selectedCategoryIds.includes(cat.id_category);
  }

  toggleCategory(cat: Category): void {
    if (this.isEditMode) {
      const existing = this.selectedAnnotationCategories.find(
        (ac) => ac.id_category === cat.id_category
      );
      if (existing) {
        this.annotationService.removeCategory(existing.id_annotation_category).subscribe({
          next: () => {
            this.selectedAnnotationCategories = this.selectedAnnotationCategories.filter(
              (ac) => ac.id_annotation_category !== existing.id_annotation_category
            );
          },
          error: (err) =>
            Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message ?? 'Error al quitar categoría.' }),
        });
      } else {
        this.annotationService.addCategory(this.annotationId!, cat.id_category).subscribe({
          next: (ac) => this.selectedAnnotationCategories.push(ac),
          error: (err) =>
            Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message ?? 'Error al agregar categoría.' }),
        });
      }
    } else {
      const idx = this.selectedCategoryIds.indexOf(cat.id_category);
      if (idx === -1) {
        this.selectedCategoryIds.push(cat.id_category);
      } else {
        this.selectedCategoryIds.splice(idx, 1);
      }
    }
  }

  private loadEntities(): void {
    this.entityService.getAll().subscribe({
      next: (data) => (this.allEntities = data),
      error: () => {},
    });
  }

  isEntitySelected(entity: Entity): boolean {
    if (this.isEditMode) {
      return this.selectedInterestedParties.some((p) => p.id_entity === entity.id_entity);
    }
    return this.selectedEntityIds.includes(entity.id_entity);
  }

  toggleEntity(entity: Entity): void {
    if (this.isEditMode) {
      const existing = this.selectedInterestedParties.find(
        (p) => p.id_entity === entity.id_entity
      );
      if (existing) {
        this.annotationService.removeInterestedParty(existing.id_interested_party).subscribe({
          next: () => {
            this.selectedInterestedParties = this.selectedInterestedParties.filter(
              (p) => p.id_interested_party !== existing.id_interested_party
            );
          },
          error: (err) =>
            Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message ?? 'Error al quitar entidad.' }),
        });
      } else {
        this.annotationService.addInterestedParty(this.annotationId!, entity.id_entity).subscribe({
          next: (party) => this.selectedInterestedParties.push(party),
          error: (err) =>
            Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message ?? 'Error al agregar entidad.' }),
        });
      }
    } else {
      const idx = this.selectedEntityIds.indexOf(entity.id_entity);
      if (idx === -1) {
        this.selectedEntityIds.push(entity.id_entity);
      } else {
        this.selectedEntityIds.splice(idx, 1);
      }
    }
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const nuevos = Array.from(input.files);
    const totalFotos = this.existingEvidences.length + this.selectedFiles.length + nuevos.length;

    if (totalFotos > 5) {
      Swal.fire({ icon: 'warning', title: 'Límite de fotos', text: 'Solo puedes subir un máximo de 5 fotografías.' });
      input.value = '';
      return;
    }

    this.selectedFiles.push(...nuevos);
    input.value = '';
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  removeEvidence(id: number): void {
    this.annotationService.deleteEvidence(id).subscribe({
      next: () => {
        this.existingEvidences = this.existingEvidences.filter((e) => e.id_evidence !== id);
      },
      error: (err) =>
        Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message ?? 'No se pudo eliminar la foto.' }),
    });
  }



  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const dto: AnnotationRequestDto = {
      id_citizen:      this.form.value.id_citizen!,
      id_neighborhood: this.form.value.id_neighborhood ?? null,
      description:     this.form.value.description!,
      status:          this.form.value.status!,
      latitude:        this.form.value.latitude!,
      longitude:       this.form.value.longitude!,
    };

    if (this.isEditMode) {
      this.annotationService.updateAnnotation(this.annotationId!, dto).subscribe({
        next: () => this.router.navigate(['/annotations']),
        error: (err) =>
          Swal.fire({ icon: 'error', title: 'Error al guardar', text: err.error?.message ?? 'Ocurrió un error.' }),
      });
    } else {
      this.annotationService.createAnnotation(dto).subscribe({
        next: (created) => this.saveSubResources(created.id_annotation),
        error: (err) =>
          Swal.fire({ icon: 'error', title: 'Error al guardar', text: err.error?.message ?? 'Ocurrió un error.' }),
      });
    }
  }

  private saveSubResources(annotationId: number): void {
    const categoryTasks$ = this.selectedCategoryIds.map((catId) =>
      this.annotationService.addCategory(annotationId, catId)
    );
    const entityTasks$ = this.selectedEntityIds.map((entityId) =>
      this.annotationService.addInterestedParty(annotationId, entityId)
    );
    const evidenceTasks$ = this.selectedFiles.length
      ? [this.annotationService.uploadEvidences(annotationId, this.selectedFiles)]
      : [];

    const allTasks$ = [...categoryTasks$, ...entityTasks$, ...evidenceTasks$];
    const all$ = allTasks$.length ? forkJoin(allTasks$) : of([]);

    all$.subscribe({
      next: () => this.router.navigate(['/annotations']),
      error: () => this.router.navigate(['/annotations']),
    });
  }




  cancel(): void {
    this.router.navigate(['/annotations']);
  }
}
