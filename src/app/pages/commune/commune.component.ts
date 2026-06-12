import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FilterBarComponent } from '../../components/ui/filter-bar/filter-bar.component';
import { DynamicTableComponent } from '../../components/ui/table/dynamic-table/dynamic-table.component';
import { GenericModalComponent } from '../../components/ui/generic-modal/generic-modal.component';
import { CommuneService } from '../../services/commune.service';
import { Commune, CommuneRequestDto } from '../../models/commune';
import { ColumnDef } from '../../models/component-dynamic-table/column-def';
import { ActionButton } from '../../models/component-dynamic-table/action-button';
import { TablePageEvent } from '../../models/component-dynamic-table/table-page-event';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-commune',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FilterBarComponent, DynamicTableComponent, GenericModalComponent],
  templateUrl: './commune.component.html'
})
export class CommunesComponent implements OnInit {
  private communeService = inject(CommuneService);
  private fb = inject(FormBuilder);

  // Mocks para los filtros (Asumiendo que luego los llenarás con los servicios reales)
  departments = [{ id: 1, name: 'Caldas' }, { id: 2, name: 'Cundinamarca' }];
  cities = [
    { id: 1, id_department: 1, name: 'Manizales' }, 
    { id: 251, id_department: 2, name: 'Bogotá' }
  ];
  
  // Estado de los filtros
  selectedDepartmentId: number | null = null;
  selectedFilterCityId: number | null = null;
  searchTerm: string = '';

  // Estado de la tabla
  communes: Commune[] = [];
  loading = false;
  page = 1;
  pageSize = 5;
  totalItems = 0;

  columns: ColumnDef[] = [
    { key: 'name', header: 'Comuna' },
    { key: 'id_city', header: 'Ciudad' }, // Reemplazar con 'city.name' si el backend manda el objeto anidado
    { key: 'id_department', header: 'Departamento' }, // Mock/Reemplazar luego
    // { key: 'neighborhoods_count', header: 'Barrios Asociados' }, // TODO: Descomentar cuando el backend provea este dato
    { key: 'status', header: 'Estado' }
  ];

  actions: ActionButton[] = [
    { id: 'edit', label: 'Editar', class: 'mr-2 px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600' },
    { id: 'delete', label: 'Eliminar', class: 'px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700' }
  ];

  isModalOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  currentCommuneId: number | null = null;
  form!: FormGroup;

  ngOnInit() {
    this.initForm();
    this.loadData();
  }

  initForm() {
    this.form = this.fb.group({
      id_department: [''], // Solo para UI, no suele ir en el DTO final si la ciudad ya define el depto
      id_city: ['', Validators.required],
      name: ['', Validators.required],
      status: ['active', Validators.required]
    });
  }

  loadData() {
    this.loading = true;
    
    // Si tu servicio soporta búsqueda por texto, agrégalo a los parámetros del método.
    // Por ahora usamos la lógica base que enviamos en los servicios.
    const request$ = this.selectedFilterCityId 
      ? this.communeService.searchByFilter(this.selectedFilterCityId, this.page, this.pageSize)
      : this.communeService.getPaged(this.page, this.pageSize);

    request$.subscribe({
      next: (res) => {
        const response = res as any;
        // Extracción robusta de datos: Cubre la mayoría de formas en que un backend devuelve info
        this.communes = response.items || response.data || response.content || (Array.isArray(response) ? response : []);
        this.totalItems = response.totalItems || response.total || response.totalElements || this.communes.length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.communes = []; // Evita romper la vista en caso de error
      }
    });
  }

  onSearch(event: any) {
    this.searchTerm = event.target.value;
    // TODO: Implementar lógica de búsqueda en backend si es requerida
  }

  onDepartmentFilterChange(event: any) {
    this.selectedDepartmentId = event.target.value ? Number(event.target.value) : null;
    this.selectedFilterCityId = null; // Reiniciar ciudad al cambiar depto
    this.page = 1;
    this.loadData();
  }

  onCityFilterChange(event: any) {
    this.selectedFilterCityId = event.target.value ? Number(event.target.value) : null;
    this.page = 1;
    this.loadData();
  }

  onPageChange(event: TablePageEvent) {
    this.page = event.page;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  handleAction(event: { actionId: string; row: Commune }) {
    if (event.actionId === 'edit') {
      this.openModal('edit', event.row);
    } else if (event.actionId === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  openModal(mode: 'create' | 'edit', commune?: Commune) {
    this.modalMode = mode;
    this.isModalOpen = true;
    if (mode === 'edit' && commune) {
      this.currentCommuneId = commune.id_commune;
      this.form.patchValue({
        id_city: commune.id_city,
        name: commune.name,
        status: commune.status
      });
    } else {
      this.currentCommuneId = null;
      this.form.reset({ status: 'active' });
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.form.reset();
  }

  saveCommune() {
    if (this.form.invalid) return;
    
    this.loading = true;
    // Extraemos solo lo necesario para el backend
    const { id_department, ...dto } = this.form.value; 

    const request$ = this.modalMode === 'create'
      ? this.communeService.createCommune(dto)
      : this.communeService.updateCommune(this.currentCommuneId!, dto);

    request$.subscribe({
      next: () => {
        Swal.fire('Éxito', `Comuna ${this.modalMode === 'create' ? 'creada' : 'actualizada'} correctamente`, 'success');
        this.closeModal();
        this.loadData();
      },
      error: () => {
        Swal.fire('Error', 'Ocurrió un error al procesar la solicitud', 'error');
        this.loading = false;
      }
    });
  }

  confirmDelete(commune: Commune) {
    Swal.fire({
      title: '¿Eliminar comuna?',
      text: `Eliminarás: ${commune.name}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.communeService.delete(commune.id_commune).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'La comuna ha sido eliminada.', 'success');
            this.loadData();
          },
          error: () => {
            Swal.fire('Error', 'No se puede eliminar. Verifique barrios asociados.', 'error');
            this.loading = false;
          }
        });
      }
    });
  }
}