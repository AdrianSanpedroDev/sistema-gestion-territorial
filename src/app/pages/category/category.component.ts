import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FilterBarComponent } from '../../components/ui/filter-bar/filter-bar.component';
import { DynamicTableComponent } from '../../components/ui/table/dynamic-table/dynamic-table.component';
import { GenericModalComponent } from '../../components/ui/generic-modal/generic-modal.component';
import { CategoryService } from '../../services/category.service';
import { Category, CategoryRequestDto } from '../../models/category';
import { ColumnDef } from '../../models/component-dynamic-table/column-def';
import { ActionButton } from '../../models/component-dynamic-table/action-button';
import { TablePageEvent } from '../../models/component-dynamic-table/table-page-event';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FilterBarComponent, DynamicTableComponent, GenericModalComponent],
  templateUrl: './category.component.html'
})
export class CategoryComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);

  // Estado de la tabla
  categories: Category[] = [];
  loading = false;
  page = 1;
  pageSize = 5;
  totalItems = 0;

  // Todas las categorías para el select de categoría padre
  allCategories: Category[] = [];

  // Estado del filtro de búsqueda
  searchTerm = '';

  // Columnas para app-dynamic-table
  columns: ColumnDef[] = [
    { key: 'name',              header: 'Nombre'      },
    { key: 'description',       header: 'Descripción' },
    { key: 'id_parent_category', header: 'Cat. Padre' },
    { key: 'status',            header: 'Estado'      }
  ];

  // Botones de acción para cada fila
  actions: ActionButton[] = [
    { id: 'edit',   label: 'Editar',   class: 'mr-2 px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600' },
    { id: 'delete', label: 'Eliminar', class: 'px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700'           }
  ];

  // Estado del modal
  isModalOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  currentCategoryId: number | null = null;
  form!: FormGroup;

  ngOnInit() {
  this.initForm();
  this.categoryService.getAll().subscribe({
    next: (cats) => {
      this.allCategories = cats;
      this.loadData();        // carga la tabla solo después de tener los nombres
    },
    error: () => {
      this.allCategories = [];
      this.loadData();
    }
  });
  }


  initForm() {
    this.form = this.fb.group({
      id_parent_category: [null],  // opcional — sin Validators.required
      name:        ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      image_url:   [null],         // opcional — sin validación por ahora
      status:      ['active', Validators.required]
    });
  }

  loadAllCategories() {
    this.categoryService.getAll().subscribe({
      next: (cats) => this.allCategories = cats,
      error: () => this.allCategories = []
    });
  }

  // Getter computado — excluye la categoría actual para evitar auto-referencia
  get availableParentCategories(): Category[] {
    if (this.modalMode === 'edit' && this.currentCategoryId) {
      return this.allCategories.filter(c => c.id_category !== this.currentCategoryId);
    }
    return this.allCategories;
  }

  loadData() {
  this.loading = true;

  const request$ = this.searchTerm
    ? this.categoryService.searchByFilter(this.searchTerm, this.page, this.pageSize)
    : this.categoryService.getPaged(this.page, this.pageSize);

  request$.subscribe({
    next: (res) => {
      const response = res as any;
      const raw: Category[] = response.items || response.data || response.content || (Array.isArray(response) ? response : []);
      this.categories = raw.map(cat => ({
        ...cat,
        id_parent_category: cat.id_parent_category
          ? this.allCategories.find(p => p.id_category === cat.id_parent_category)?.name ?? cat.id_parent_category
          : null
      })) as any;
      this.totalItems = response.totalItems || response.total || response.totalElements || this.categories.length;
      this.loading    = false;
    },
    error: () => {
      this.loading    = false;
      this.categories = [];
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

  handleAction(event: { actionId: string; row: Category }) {
    if (event.actionId === 'edit') {
      this.openModal('edit', event.row);
    } else if (event.actionId === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  openModal(mode: 'create' | 'edit', category?: Category) {
    this.modalMode   = mode;
    this.isModalOpen = true;
    if (mode === 'edit' && category) {
      this.currentCategoryId = category.id_category;
      this.form.patchValue({
        id_parent_category: category.id_parent_category,
        name:               category.name,
        description:        category.description,
        image_url:          category.image_url,
        status:             category.status
      });
    } else {
      this.currentCategoryId = null;
      this.form.reset({ status: 'active', id_parent_category: null, image_url: null });
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.form.reset();
  }

  saveCategory() {
    if (this.form.invalid) return;

    this.loading = true;
    const dto: CategoryRequestDto = this.form.value;

    const request$ = this.modalMode === 'create'
      ? this.categoryService.createCategory(dto)
      : this.categoryService.updateCategory(this.currentCategoryId!, dto);

    request$.subscribe({
      next: () => {
        Swal.fire('Éxito', `Categoría ${this.modalMode === 'create' ? 'creada' : 'actualizada'} correctamente`, 'success');
        this.closeModal();
        this.loadData();
        this.loadAllCategories();
      },
      error: () => {
        Swal.fire('Error', 'Ocurrió un error al guardar', 'error');
        this.loading = false;
      }
    });
  }

  confirmDelete(category: Category) {
    Swal.fire({
      title: '¿Eliminar categoría?',
      text: `Eliminarás: ${category.name}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.categoryService.delete(category.id_category).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'La categoría ha sido eliminada.', 'success');
            this.loadData();
            this.loadAllCategories();
          },
          error: () => {
            Swal.fire('Error', 'No se pudo eliminar la categoría.', 'error');
            this.loading = false;
          }
        });
      }
    });
  }
}
