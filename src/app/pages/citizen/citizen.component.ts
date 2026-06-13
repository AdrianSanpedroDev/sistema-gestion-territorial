import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FilterBarComponent } from '../../components/ui/filter-bar/filter-bar.component';
import { DynamicTableComponent } from '../../components/ui/table/dynamic-table/dynamic-table.component';
import { GenericModalComponent } from '../../components/ui/generic-modal/generic-modal.component';
import { CitizenService } from '../../services/citizen.service';
import { Citizen, CitizenRequestDto } from '../../models/citizen';
import { ColumnDef } from '../../models/component-dynamic-table/column-def';
import { ActionButton } from '../../models/component-dynamic-table/action-button';
import { TablePageEvent } from '../../models/component-dynamic-table/table-page-event';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-citizen',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FilterBarComponent, DynamicTableComponent, GenericModalComponent],
  templateUrl: './citizen.component.html'
})
export class CitizenComponent implements OnInit {
  private citizenService = inject(CitizenService);
  private fb = inject(FormBuilder);

  // Estado de la tabla
  citizens: Citizen[] = [];
  loading = false;
  page = 1;
  pageSize = 5;
  totalItems = 0;

  // Estado del filtro de búsqueda
  searchTerm = '';

  // Definición de columnas para app-dynamic-table
  columns: ColumnDef[] = [
    { key: 'name',    header: 'Nombre'    },
    { key: 'email',   header: 'Correo'    },
    { key: 'phone',   header: 'Teléfono'  },
    { key: 'address', header: 'Dirección' },
    { key: 'status',  header: 'Estado'    }
  ];

  // Botones de acción para cada fila
  actions: ActionButton[] = [
    { id: 'edit',   label: 'Editar',   class: 'mr-2 px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600' },
    { id: 'delete', label: 'Eliminar', class: 'px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700'           }
  ];

  // Estado del modal
  isModalOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  currentCitizenId: number | null = null;
  form!: FormGroup;

  ngOnInit() {
    this.initForm();
    this.loadData();
  }

  initForm() {
    this.form = this.fb.group({
      name:    ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100),
                     Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
      email:   ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      phone:   ['', [Validators.required, Validators.pattern(/^\d{7,15}$/)]],
      address: ['', [Validators.required, Validators.maxLength(200)]],
      status:  ['active', Validators.required]
    });
  }

  loadData() {
    this.loading = true;

    const request$ = this.searchTerm
      ? this.citizenService.searchByFilter(this.searchTerm, this.page, this.pageSize)
      : this.citizenService.getPaged(this.page, this.pageSize);

    request$.subscribe({
      next: (res) => {
        const response = res as any;
        this.citizens   = response.items || response.data || response.content || (Array.isArray(response) ? response : []);
        this.totalItems = response.totalItems || response.total || response.totalElements || this.citizens.length;
        this.loading    = false;
      },
      error: () => {
        this.loading  = false;
        this.citizens = [];
      }
    });
  }

  onSearch(event: any) {
    this.searchTerm = event.target.value;
    this.page = 1;
    this.loadData();
  }

  onPageChange(event: TablePageEvent) {
    this.page     = event.page;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  handleAction(event: { actionId: string; row: Citizen }) {
    if (event.actionId === 'edit') {
      this.openModal('edit', event.row);
    } else if (event.actionId === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  openModal(mode: 'create' | 'edit', citizen?: Citizen) {
    this.modalMode   = mode;
    this.isModalOpen = true;
    if (mode === 'edit' && citizen) {
      this.currentCitizenId = citizen.id_citizen;
      this.form.patchValue({
        name:    citizen.name,
        email:   citizen.email,
        phone:   citizen.phone,
        address: citizen.address,
        status:  citizen.status
      });
    } else {
      this.currentCitizenId = null;
      this.form.reset({ status: 'active' });
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.form.reset();
  }

  saveCitizen() {
    if (this.form.invalid) return;

    this.loading = true;
    const dto: CitizenRequestDto = this.form.value;

    const request$ = this.modalMode === 'create'
      ? this.citizenService.createCitizen(dto)
      : this.citizenService.updateCitizen(this.currentCitizenId!, dto);

    request$.subscribe({
      next: () => {
        Swal.fire('Éxito', `Ciudadano ${this.modalMode === 'create' ? 'creado' : 'actualizado'} correctamente`, 'success');
        this.closeModal();
        this.loadData();
      },
      error: () => {
        Swal.fire('Error', 'Ocurrió un error al guardar', 'error');
        this.loading = false;
      }
    });
  }

  confirmDelete(citizen: Citizen) {
    Swal.fire({
      title: '¿Eliminar ciudadano?',
      text: `Eliminarás a: ${citizen.name}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.citizenService.delete(citizen.id_citizen).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'El ciudadano ha sido eliminado.', 'success');
            this.loadData();
          },
          error: () => {
            Swal.fire('Error', 'No se pudo eliminar el ciudadano.', 'error');
            this.loading = false;
          }
        });
      }
    });
  }
}
