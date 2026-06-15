import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { AnnotationService } from '../../services/annotation.service';
import { Annotation } from '../../models/annotation';
import { ColumnDef } from '../../models/component-dynamic-table/column-def';
import { ActionButton } from '../../models/component-dynamic-table/action-button';
import { TablePageEvent } from '../../models/component-dynamic-table/table-page-event';

import { FilterBarComponent } from '../../components/ui/filter-bar/filter-bar.component';
import { DynamicTableComponent } from '../../components/ui/table/dynamic-table/dynamic-table.component';

@Component({
  selector: 'app-annotation',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterBarComponent, DynamicTableComponent],
  templateUrl: './annotation.component.html',
})
export class AnnotationComponent implements OnInit {
  private annotationService = inject(AnnotationService);
  private router = inject(Router);

  annotations: Annotation[] = [];
  page = 1;
  pageSize = 5;
  totalItems = 0;
  loading = false;
  searchTerm = '';

  columns: ColumnDef[] = [
    { key: 'description',       header: 'Descripción' },
    { key: 'citizen_name',      header: 'Ciudadano' },
    { key: 'neighborhood_name', header: 'Barrio' },
    { key: 'status',            header: 'Estado' },
    { key: 'registration_date', header: 'Fecha' },
  ];

  actions: ActionButton[] = [
    { id: 'edit',   label: 'Editar',   class: 'mr-2 px-3 py-1 rounded bg-yellow-500 text-white text-sm hover:bg-yellow-600' },
    { id: 'delete', label: 'Eliminar', class: 'px-3 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700' },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    const request$ = this.searchTerm
      ? this.annotationService.searchByFilter(this.searchTerm, this.page, this.pageSize)
      : this.annotationService.getPaged(this.page, this.pageSize);

    request$.subscribe({
      next: (res) => {
        this.annotations = res.items;
        this.totalItems = res.totalItems;
        this.loading = false;
      },
      error: (err) => {
        Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message ?? 'No se pudieron cargar las anotaciones.' });
        this.loading = false;
      },
    });
  }

  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.page = 1;
    this.loadData();
    }


  onPageChange(event: TablePageEvent): void {
    this.page = event.page;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  navigateToCreate(): void {
    this.router.navigate(['/annotations/new']);
  }

  handleAction(event: { actionId: string; row: Annotation }): void {
    if (event.actionId === 'edit') {
      this.router.navigate(['/annotations', event.row.id_annotation, 'edit']);
    } else if (event.actionId === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  private confirmDelete(annotation: Annotation): void {
    Swal.fire({
      title: '¿Eliminar anotación?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.annotationService.delete(annotation.id_annotation).subscribe({
          next: () => this.loadData(),
          error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message ?? 'No se pudo eliminar.' }),
        });
      }
    });
  }
}
