import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FilterBarComponent } from '../../components/ui/filter-bar/filter-bar.component';
import { DynamicTableComponent } from '../../components/ui/table/dynamic-table/dynamic-table.component';
import { GenericModalComponent } from '../../components/ui/generic-modal/generic-modal.component';
import { NeighborhoodService } from '../../services/neighborhood.service';
import { CommuneService } from '../../services/commune.service';
import { Neighborhood, NeighborhoodRequestDto } from '../../models/neighborhood';
import { Commune } from '../../models/commune';
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
  private communeService = inject(CommuneService);
  private fb = inject(FormBuilder);

  // Catálogo Real
  communes: Commune[] = [];
  selectedFilterCommuneId: number | null = null;
  searchTerm: string = '';

  // Interceptamos para colocar nombre dinámico a la comuna
  neighborhoods: (Neighborhood & { communeName?: string })[] = [];
  loading = false;
  page = 1;
  pageSize = 5;
  totalItems = 0;

  columns: ColumnDef[] = [
    { key: 'name', header: 'Barrio' },
    { key: 'communeName', header: 'Comuna' }, // <- Cambiado a nuestra propiedad mapeada
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
    this.loadCatalogs();
  }

  initForm() {
    this.form = this.fb.group({
      id_commune: ['', Validators.required],
      name: ['', Validators.required],
      status: ['active', Validators.required]
    });
  }

  loadCatalogs() {
    this.loading = true;
    this.communeService.getAll().subscribe({
      next: (res) => {
        this.communes = (res as any).items || res || [];
        this.loadData();
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar las comunas', 'error');
      }
    });
  }

  loadData() {
    this.loading = true;
    
    const request$ = (this.selectedFilterCommuneId || this.searchTerm)
      ? this.neighborhoodService.searchByFilter(this.selectedFilterCommuneId, this.searchTerm, this.page, this.pageSize)
      : this.neighborhoodService.getPaged(this.page, this.pageSize);

    request$.subscribe({
      next: (res) => {
        const response = res as any;
        const rawNeighborhoods: Neighborhood[] = response.items || response.data || response.content || (Array.isArray(response) ? response : []);
        
        // Mapeamos el nombre real de la comuna
        this.neighborhoods = rawNeighborhoods.map(n => {
          const comm = this.communes.find(c => c.id_commune === n.id_commune);
          return {
            ...n,
            communeName: comm ? comm.name : 'Desconocida'
          };
        });

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
    this.page = 1;
    this.loadData();
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

  handleAction(event: { actionId: string; row: Neighborhood & { communeName?: string } }) {
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
      this.form.reset({ status: 'active', id_commune: '' });
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