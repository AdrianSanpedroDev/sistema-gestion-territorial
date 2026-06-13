import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FilterBarComponent } from '../../components/ui/filter-bar/filter-bar.component';
import { DynamicTableComponent } from '../../components/ui/table/dynamic-table/dynamic-table.component';
import { GenericModalComponent } from '../../components/ui/generic-modal/generic-modal.component';
import { EntityService } from '../../services/entity.service';
import { Entity } from '../../models/entity';
import { ColumnDef } from '../../models/component-dynamic-table/column-def';
import { ActionButton } from '../../models/component-dynamic-table/action-button';
import { TablePageEvent } from '../../models/component-dynamic-table/table-page-event';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-entity',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FilterBarComponent, DynamicTableComponent, GenericModalComponent],
  templateUrl: './entity.component.html'
})
export class EntityComponent implements OnInit {
  private entityService = inject(EntityService);
  private fb = inject(FormBuilder);

  entities: Entity[] = [];
  loading = false;
  page = 1;
  pageSize = 5;
  totalItems = 0;
  searchTerm = '';

  columns: ColumnDef[] = [
    { key: 'logo_url', header: 'Logo', type: 'image' },
    { key: 'name', header: 'Nombre' },
    { key: 'nit', header: 'NIT' },
    { key: 'email', header: 'Correo' },
    { key: 'phone', header: 'Teléfono' },
    { key: 'status', header: 'Estado' }
  ];

  actions: ActionButton[] = [
    { id: 'edit', label: 'Editar', class: 'mr-2 px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600' },
    { id: 'delete', label: 'Eliminar', class: 'px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700' }
  ];

  isModalOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  currentEntityId: number | null = null;
  form!: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  ngOnInit() {
    this.initForm();
    this.loadData();
  }

  initForm() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100),
                  Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-\.]+$/)]],
      nit: ['', [Validators.required, Validators.maxLength(30), Validators.pattern(/^[0-9\-]+$/)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{7,15}$/)]],
      address: ['', [Validators.required, Validators.maxLength(200)]],
      status: ['active', Validators.required]
    });
  }

  loadData() {
    this.loading = true;

    const request$ = this.searchTerm
      ? this.entityService.searchByFilter(this.searchTerm, this.page, this.pageSize)
      : this.entityService.getPaged(this.page, this.pageSize);

    request$.subscribe({
      next: (res) => {
        const response = res as any;
        this.entities = response.items || response.data || response.content || (Array.isArray(response) ? response : []);
        this.totalItems = response.totalItems || response.total || response.totalElements || this.entities.length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.entities = [];
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

  handleAction(event: { actionId: string; row: Entity }) {
    if (event.actionId === 'edit') {
      this.openModal('edit', event.row);
    } else if (event.actionId === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  openModal(mode: 'create' | 'edit', entity?: Entity) {
    this.modalMode = mode;
    this.isModalOpen = true;
    if (mode === 'edit' && entity) {
      this.currentEntityId = entity.id_entity;
      this.previewUrl = entity.logo_url ?? null;
      this.selectedFile = null;
      this.form.patchValue({
        name: entity.name,
        nit: entity.nit,
        email: entity.email,
        phone: entity.phone,
        address: entity.address,
        status: entity.status
      });
    } else {
      this.currentEntityId = null;
      this.selectedFile = null;
      this.previewUrl = null;
      this.form.reset({ status: 'active' });
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.selectedFile = input.files[0];
    this.previewUrl = URL.createObjectURL(this.selectedFile);
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedFile = null;
    this.previewUrl = null;
    this.form.reset({ status: 'active' });
  }

  saveEntity() {
    if (this.form.invalid) return;
    this.loading = true;

    const formData = new FormData();
    formData.append('name', this.form.get('name')!.value);
    formData.append('nit', this.form.get('nit')!.value);
    formData.append('email', this.form.get('email')!.value);
    formData.append('phone', this.form.get('phone')!.value);
    formData.append('address', this.form.get('address')!.value);
    formData.append('status', this.form.get('status')!.value);
    if (this.selectedFile) {
      formData.append('file', this.selectedFile, this.selectedFile.name);
    }

    const request$ = this.modalMode === 'create'
      ? this.entityService.createEntity(formData)
      : this.entityService.updateEntity(this.currentEntityId!, formData);

    request$.subscribe({
      next: () => {
        Swal.fire('Éxito', `Entidad ${this.modalMode === 'create' ? 'creada' : 'actualizada'} correctamente`, 'success');
        this.closeModal();
        this.loadData();
      },
      error: (err) => {
        Swal.fire('Error', err?.error?.message || 'Ocurrió un error al guardar la entidad', 'error');
        this.loading = false;
      }
    });
  }

  confirmDelete(entity: Entity) {
    Swal.fire({
      title: '¿Eliminar entidad?',
      text: `Eliminarás: ${entity.name}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.entityService.delete(entity.id_entity).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'La entidad fue eliminada correctamente.', 'success');
            this.loadData();
          },
          error: (err) => {
            Swal.fire('Error', err?.error?.message || 'No se puede eliminar esta entidad. Verifique dependencias.', 'error');
            this.loading = false;
          }
        });
      }
    });
  }
}
