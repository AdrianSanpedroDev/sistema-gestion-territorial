import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FilterBarComponent } from '../../components/ui/filter-bar/filter-bar.component';
import { DynamicTableComponent } from '../../components/ui/table/dynamic-table/dynamic-table.component';
import { GenericModalComponent } from '../../components/ui/generic-modal/generic-modal.component';
import { OfficialService } from '../../services/official.service';
import { EntityService } from '../../services/entity.service';
import { Official, OfficialRequestDto } from '../../models/official';
import { Entity } from '../../models/entity';
import { ColumnDef } from '../../models/component-dynamic-table/column-def';
import { ActionButton } from '../../models/component-dynamic-table/action-button';
import { TablePageEvent } from '../../models/component-dynamic-table/table-page-event';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-official',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FilterBarComponent, DynamicTableComponent, GenericModalComponent],
  templateUrl: './official.component.html'
})
export class OfficialComponent implements OnInit {
  private officialService = inject(OfficialService);
  private entityService = inject(EntityService);
  private fb = inject(FormBuilder);

  officials: Official[] = [];
  entities: Entity[] = [];
  loading = false;
  page = 1;
  pageSize = 10;
  totalItems = 0;
  searchTerm = '';

  columns: ColumnDef[] = [
    { key: 'name', header: 'Nombre' },
    { key: 'email', header: 'Correo' },
    { key: 'phone', header: 'Celular' },
    { key: 'role', header: 'Rol' },
    { key: 'entityName', header: 'Entidad' },
    { key: 'status', header: 'Estado' }
  ];

  actions: ActionButton[] = [
    { id: 'edit', label: 'Editar', class: 'mr-2 px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600' },
    { id: 'delete', label: 'Eliminar', class: 'px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700' }
  ];

  isModalOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  currentOfficialId: number | null = null;
  form!: FormGroup;

  ngOnInit() {
    this.initForm();
    this.loadEntities();
  }

  initForm() {
    this.form = this.fb.group({
      id_entity: [null, Validators.required],
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.maxLength(30)]],
      role: ['', [Validators.required, Validators.maxLength(50)]],
      status: ['active', Validators.required],
      gps_active: [true]
    });
  }

  loadEntities() {
    this.entityService.getAll().subscribe({
      next: (entities) => {
        this.entities = entities;
        this.loadData();
      },
      error: () => {
        this.entities = [];
        this.loadData();
      }
    });
  }

  loadData() {
    this.loading = true;

    const request$ = this.searchTerm
      ? this.officialService.searchByFilter(this.searchTerm, this.page, this.pageSize)
      : this.officialService.getPaged(this.page, this.pageSize);

    request$.subscribe({
      next: (res) => {
        const response = res as any;
        const items: Official[] = response.items || response.data || response.content || (Array.isArray(response) ? response : []);
        this.officials = items.map((official) => ({
          ...official,
          entityName: this.entities.find((entity) => entity.id_entity === official.id_entity)?.name ?? String(official.id_entity)
        }));
        this.totalItems = response.totalItems || response.total || response.totalElements || this.officials.length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.officials = [];
      }
    });
  }

  onSearch(event: any) {
    this.searchTerm = event.target.value;
    this.page = 1;
    this.loadData();
  }

  onPageChange(event: TablePageEvent) {
    this.page = event.page;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  handleAction(event: { actionId: string; row: Official }) {
    if (event.actionId === 'edit') {
      this.openModal('edit', event.row);
    } else if (event.actionId === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  openModal(mode: 'create' | 'edit', official?: Official) {
    this.modalMode = mode;
    this.isModalOpen = true;

    if (mode === 'edit' && official) {
      this.currentOfficialId = official.id_official;
      this.form.patchValue({
        id_entity: official.id_entity,
        name: official.name,
        email: official.email,
        phone: official.phone,
        role: official.role,
        status: official.status,
        gps_active: official.gps_active
      });
    } else {
      this.currentOfficialId = null;
      this.form.reset({ id_entity: null, status: 'active', gps_active: true });
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.form.reset({ id_entity: null, status: 'active', gps_active: true });
  }

  saveOfficial() {
    if (this.form.invalid) return;
    this.loading = true;

    const officialDto: OfficialRequestDto = {
      id_entity: this.form.get('id_entity')!.value,
      name: this.form.get('name')!.value,
      email: this.form.get('email')!.value,
      phone: this.form.get('phone')!.value,
      role: this.form.get('role')!.value,
      status: this.form.get('status')!.value,
      gps_active: this.form.get('gps_active')!.value
    };

    const request$ = this.modalMode === 'create'
      ? this.officialService.createOfficial(officialDto)
      : this.officialService.updateOfficial(this.currentOfficialId!, officialDto);

    request$.subscribe({
      next: () => {
        Swal.fire('Éxito', `Funcionario ${this.modalMode === 'create' ? 'creado' : 'actualizado'} correctamente`, 'success');
        this.closeModal();
        this.loadData();
      },
      error: () => {
        Swal.fire('Error', 'Ocurrió un error al guardar el funcionario', 'error');
        this.loading = false;
      }
    });
  }

  confirmDelete(official: Official) {
    Swal.fire({
      title: '¿Eliminar funcionario?',
      text: `Eliminarás: ${official.name}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.officialService.delete(official.id_official).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'El funcionario fue eliminado correctamente.', 'success');
            this.loadData();
          },
          error: () => {
            Swal.fire('Error', 'No se puede eliminar este funcionario. Verifica dependencias.', 'error');
            this.loading = false;
          }
        });
      }
    });
  }
}
