import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FilterBarComponent } from '../../components/ui/filter-bar/filter-bar.component';
import { DynamicTableComponent } from '../../components/ui/table/dynamic-table/dynamic-table.component';
import { GenericModalComponent } from '../../components/ui/generic-modal/generic-modal.component';
import { CommuneService } from '../../services/commune.service';
import { CityService } from '../../services/city.service';
import { DepartmentService } from '../../services/department.service';
import { Commune } from '../../models/commune';
import { City } from '../../models/city';
import { Department } from '../../models/department';
import { ColumnDef } from '../../models/component-dynamic-table/column-def';
import { ActionButton } from '../../models/component-dynamic-table/action-button';
import { TablePageEvent } from '../../models/component-dynamic-table/table-page-event';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-commune',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FilterBarComponent, DynamicTableComponent, GenericModalComponent],
  templateUrl: './commune.component.html'
})
export class CommunesComponent implements OnInit {
  private communeService = inject(CommuneService);
  private cityService = inject(CityService);
  private departmentService = inject(DepartmentService);
  private fb = inject(FormBuilder);

  // Catálogos reales
  departments: Department[] = [];
  allCities: City[] = [];
  filteredCities: City[] = []; // Ciudades filtradas por el departamento seleccionado

  // Estado de los filtros
  selectedDepartmentId: number | null = null;
  selectedFilterCityId: number | null = null;
  searchTerm: string = '';

  // Estado de la tabla (usamos un tipo extendido para incluir los nombres dinámicos sin dañar la interface)
  communes: (Commune & { cityName?: string; departmentName?: string })[] = [];
  loading = false;
  page = 1;
  pageSize = 5;
  totalItems = 0;

  columns: ColumnDef[] = [
    { key: 'name', header: 'Comuna' },
    { key: 'cityName', header: 'Ciudad' }, 
    { key: 'departmentName', header: 'Departamento' }, 
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
    this.loadCatalogs(); // Primero cargamos catálogos, luego los datos
  }

  initForm() {
    this.form = this.fb.group({
      id_department: [''], 
      id_city: ['', Validators.required],
      name: ['', Validators.required],
      status: ['active', Validators.required]
    });

    // Detectar cambios en el departamento dentro del modal para filtrar las ciudades
    this.form.get('id_department')?.valueChanges.subscribe(deptId => {
      if (deptId) {
        this.filteredCities = this.allCities.filter(c => c.id_department === Number(deptId));
      } else {
        this.filteredCities = [...this.allCities];
      }
      // Opcional: limpiar la ciudad si el depto cambia
      if (this.isModalOpen && this.form.get('id_city')?.value) {
        this.form.patchValue({ id_city: '' });
      }
    });
  }

  loadCatalogs() {
    this.loading = true;
    // forkJoin permite ejecutar múltiples peticiones en paralelo y esperar a que ambas terminen
    forkJoin({
      deps: this.departmentService.getAll(),
      cities: this.cityService.getAll()
    }).subscribe({
      next: (res) => {
        // Extraer arrays por si vienen envueltos en un response DTO
        this.departments = (res.deps as any).items || res.deps || [];
        this.allCities = (res.cities as any).items || res.cities || [];
        this.filteredCities = [...this.allCities];
        this.loadData(); // Ahora sí, cargamos las comunas
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los catálogos', 'error');
      }
    });
  }

  loadData() {
    this.loading = true;
    
    // Si hay búsqueda por texto o filtro de ciudad, usamos el searchByFilter
    const request$ = (this.selectedFilterCityId || this.searchTerm)
      ? this.communeService.searchByFilter(this.selectedFilterCityId, this.searchTerm, this.page, this.pageSize)
      : this.communeService.getPaged(this.page, this.pageSize);

    request$.subscribe({
      next: (res) => {
        const response = res as any;
        const rawCommunes: Commune[] = response.items || response.data || response.content || (Array.isArray(response) ? response : []);
        
        // Mapeo MÁGICO: Cruzamos el id_city con nuestros catálogos en memoria
        this.communes = rawCommunes.map(c => {
          const city = this.allCities.find(x => x.id_city === c.id_city);
          const dept = city ? this.departments.find(d => d.id_department === city.id_department) : null;
          return {
            ...c,
            cityName: city ? city.name : 'Desconocida',
            departmentName: dept ? dept.name : 'Desconocido'
          };
        });

        this.totalItems = response.totalItems || response.total || response.totalElements || this.communes.length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.communes = [];
      }
    });
  }

  onSearch(event: any) {
    this.searchTerm = event.target.value;
    this.page = 1;
    this.loadData();
  }

  onDepartmentFilterChange(event: any) {
    this.selectedDepartmentId = event.target.value ? Number(event.target.value) : null;
    
    if (this.selectedDepartmentId) {
      this.filteredCities = this.allCities.filter(c => c.id_department === this.selectedDepartmentId);
    } else {
      this.filteredCities = [...this.allCities];
    }
    
    this.selectedFilterCityId = null; 
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

  handleAction(event: { actionId: string; row: Commune & { departmentName?: string, cityName?: string } }) {
    if (event.actionId === 'edit') {
      this.openModal('edit', event.row);
    } else if (event.actionId === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  openModal(mode: 'create' | 'edit', commune?: Commune) {
    this.modalMode = mode;
    
    if (mode === 'edit' && commune) {
      this.currentCommuneId = commune.id_commune;
      
      // Auto-seleccionar departamento en el select basado en la ciudad
      const city = this.allCities.find(c => c.id_city === commune.id_city);
      
      this.form.patchValue({
        id_department: city ? city.id_department : '',
        id_city: commune.id_city,
        name: commune.name,
        status: commune.status
      });
    } else {
      this.currentCommuneId = null;
      this.form.reset({ status: 'active', id_department: '', id_city: '' });
      this.filteredCities = [...this.allCities];
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.form.reset();
  }

  saveCommune() {
    if (this.form.invalid) return;
    
    this.loading = true;
    const { id_department, ...dto } = this.form.value; 

    const request$ = this.modalMode === 'create'
      ? this.communeService.createCommune(dto)
      : this.communeService.updateCommune(this.currentCommuneId!, dto);

    request$.subscribe({
      next: () => {
        Swal.fire('Éxito', `Comuna ${this.modalMode === 'create' ? 'creada' : 'actualizada'} correctamente`, 'success');
        this.closeModal();
        this.loadCatalogs(); // Recargamos para reflejar cambios frescos
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