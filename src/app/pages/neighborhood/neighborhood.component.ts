import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FilterBarComponent } from '../../components/ui/filter-bar/filter-bar.component';
import { DynamicTableComponent } from '../../components/ui/table/dynamic-table/dynamic-table.component';
import { GenericModalComponent } from '../../components/ui/generic-modal/generic-modal.component';
import { NeighborhoodService } from '../../services/neighborhood.service';
import { Neighborhood, NeighborhoodRequestDto } from '../../models/neighborhood';
import { ColumnDef } from '../../models/component-dynamic-table/column-def';
import { ActionButton } from '../../models/component-dynamic-table/action-button';
import { TablePageEvent } from '../../models/component-dynamic-table/table-page-event';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-neighborhood',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FilterBarComponent, DynamicTableComponent, GenericModalComponent],
  templateUrl: './neighborhood.component.html'
})
export class NeighborhoodsComponent implements OnInit {
  private neighborhoodService = inject(NeighborhoodService);
  private fb = inject(FormBuilder);

  communes = [{ id: 1, name: 'Comuna 8 - Bosques del Norte' }, { id: 2, name: 'Comuna 1' }];
  selectedFilterCommuneId: number | null = null;
  searchTerm: string = '';

  neighborhoods: Neighborhood[] = [];
  loading = false;
  page = 1;
  pageSize = 5;
  totalItems = 0;

  columns: ColumnDef[] = [
    { key: 'name', header: 'Barrio' },
    { key: 'id_commune', header: 'Comuna' },
    // { key: 'points_count', header: 'Puntos' }, // TODO: Agregar cuando backend mande el dato
    // { key: 'annotations_count', header: 'Anotaciones' }, // TODO: Agregar cuando backend mande el dato
    { key: 'status', header: 'Estado' }
  ];

  actions: ActionButton[] = [
    { id: 'edit', label: 'Editar', class: 'mr-2 px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600' },
    { id: 'delete', label: 'Eliminar', class: 'px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700' }
  ];

  isModalOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  currentNeighborhoodId: number | null = null;
  form!: FormGroup;

  ngOnInit() {
    this.initForm();
    this.loadData();
  }

  initForm() {
    this.form = this.fb.group({
      id_commune: ['', Validators.required],
      name: ['', Validators.required],
      status: ['active', Validators.required]
    });
  }

  loadData() {
    this.loading = true;
    
    const request$ = this.selectedFilterCommuneId 
      ? this.neighborhoodService.searchByFilter(this.selectedFilterCommuneId, this.page, this.pageSize)
      : this.neighborhoodService.getPaged(this.page, this.pageSize);

    request$.subscribe({
      next: (res) => {
        const response = res as any;
        // Misma corrección robusta de arrays
        this.neighborhoods = response.items || response.data || response.content || (Array.isArray(response) ? response : []);
        this.totalItems = response.totalItems || response.total || response.totalElements || this.neighborhoods.length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.neighborhoods = [];
      }
    });
  }

  onSearch(event: any) {
    this.searchTerm = event.target.value;
    // TODO: Conectar searchTerm a endpoint si es necesario
  }

  onFilterChange(event: any) {
    this.selectedFilterCommuneId = event.target.value ? Number(event.target.value) : null;
    this.page = 1;
    this.loadData();
  }

  onPageChange(event: TablePageEvent) {
    this.page = event.page;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  handleAction(event: { actionId: string; row: Neighborhood }) {
    if (event.actionId === 'edit') {
      this.openModal('edit', event.row);
    } else if (event.actionId === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  openModal(mode: 'create' | 'edit', neighborhood?: Neighborhood) {
    this.modalMode = mode;
    this.isModalOpen = true;
    if (mode === 'edit' && neighborhood) {
      this.currentNeighborhoodId = neighborhood.id_neighborhood;
      this.form.patchValue({
        id_commune: neighborhood.id_commune,
        name: neighborhood.name,
        status: neighborhood.status
      });
    } else {
      this.currentNeighborhoodId = null;
      this.form.reset({ status: 'active' });
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.form.reset();
  }

  saveNeighborhood() {
    if (this.form.invalid) return;
    
    this.loading = true;
    const dto: NeighborhoodRequestDto = this.form.value;

    const request$ = this.modalMode === 'create'
      ? this.neighborhoodService.createNeighborhood(dto)
      : this.neighborhoodService.updateNeighborhood(this.currentNeighborhoodId!, dto);

    request$.subscribe({
      next: () => {
        Swal.fire('Éxito', `Barrio ${this.modalMode === 'create' ? 'creado' : 'actualizado'} correctamente`, 'success');
        this.closeModal();
        this.loadData();
      },
      error: () => {
        Swal.fire('Error', 'Ocurrió un error al guardar', 'error');
        this.loading = false;
      }
    });
  }

  confirmDelete(neighborhood: Neighborhood) {
    Swal.fire({
      title: '¿Eliminar barrio?',
      text: `Eliminarás: ${neighborhood.name}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.neighborhoodService.delete(neighborhood.id_neighborhood).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'El barrio ha sido eliminado.', 'success');
            this.loadData();
          },
          error: () => {
            Swal.fire('Error', 'No se puede eliminar. Verifique puntos asociados.', 'error');
            this.loading = false;
          }
        });
      }
    });
  }
}