import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FilterBarComponent } from '../../components/ui/filter-bar/filter-bar.component';
import { DynamicTableComponent } from '../../components/ui/table/dynamic-table/dynamic-table.component';
import { GenericModalComponent } from '../../components/ui/generic-modal/generic-modal.component';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category';
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

  // Datos crudos de la página actual — ids numéricos preservados para ordenamiento y validaciones
  rawCategories: Category[] = [];

  // Todas las categorías sin paginar — para el select de padre y validar hijos al eliminar
  allCategories: Category[] = [];

  loading = false;
  page = 1;
  pageSize = 5;
  totalItems = 0;
  searchTerm = '';

  columns: ColumnDef[] = [
    { key: 'image_url',           header: 'Imagen',      type: 'image' },
    { key: 'name',                header: 'Nombre'       },
    { key: 'tipo',                header: 'Tipo'         },
    { key: 'description',         header: 'Descripción'  },
    { key: 'id_parent_category',  header: 'Cat. Padre'   },
    { key: 'status',              header: 'Estado'       }
  ];

  rowClassFn = (row: any): string =>
    row.tipo === 'Subcategoría' ? 'bg-gray-50' : 'bg-white font-medium border-l-4 border-blue-400';

  actions: ActionButton[] = [
    { id: 'edit',   label: 'Editar',   class: 'mr-2 px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600' },
    { id: 'delete', label: 'Eliminar', class: 'px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700'           }
  ];

  isModalOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  currentCategoryId: number | null = null;
  form!: FormGroup;

  selectedFile: File | null = null;
  imagePreview: string | null = null;

  ngOnInit() {
    this.initForm();
    // allCategories debe cargarse primero para que categoriesSorted pueda resolver nombres
    this.categoryService.getAll().subscribe({
      next: (cats) => {
        this.allCategories = cats;
        this.loadData();
      },
      error: () => {
        this.allCategories = [];
        this.loadData();
      }
    });
  }

  initForm() {
    this.form = this.fb.group({
      id_parent_category: [null],
      name:        ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      image_url:   [null],
      status:      ['active', Validators.required]
    });
  }

  get availableParentCategories(): Category[] {
    if (this.modalMode === 'edit' && this.currentCategoryId) {
      return this.allCategories.filter(c => c.id_category !== this.currentCategoryId);
    }
    return this.allCategories;
  }

  // Array ordenado: raíz → sus hijos → siguiente raíz → sus hijos...
  // Resuelve id_parent_category al nombre para mostrarlo en la tabla
  get categoriesSorted(): any[] {
    const roots = this.rawCategories.filter(c => !c.id_parent_category);
    const result: any[] = [];

    for (const root of roots) {
      result.push({ ...root, id_parent_category: '', tipo: 'Categoría' });
      this.rawCategories
        .filter(c => c.id_parent_category === root.id_category)
        .forEach(child => result.push({ ...child, id_parent_category: root.name, tipo: 'Subcategoría' }));
    }

    // Subcategorías cuyo padre no está en la página actual
    const rootIds = new Set(roots.map(r => r.id_category));
    this.rawCategories
      .filter(c => c.id_parent_category && !rootIds.has(c.id_parent_category as number))
      .forEach(orphan => result.push({
        ...orphan,
        id_parent_category: this.getParentName(orphan.id_parent_category),
        tipo: 'Subcategoría'
      }));

    return result;
  }

  getParentName(id: number | null): string {
    if (!id) return '';
    return this.allCategories.find(c => c.id_category === id)?.name ?? String(id);
  }

  loadData() {
    this.loading = true;

    const request$ = this.searchTerm
      ? this.categoryService.searchByFilter(this.searchTerm, this.page, this.pageSize)
      : this.categoryService.getPaged(this.page, this.pageSize);

    request$.subscribe({
      next: (res) => {
        const response = res as any;
        this.rawCategories = response.items || response.data || response.content || (Array.isArray(response) ? response : []);
        this.totalItems    = response.totalItems || response.total || response.totalElements || this.rawCategories.length;
        this.loading       = false;
      },
      error: () => {
        this.loading       = false;
        this.rawCategories = [];
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

  handleAction(event: { actionId: string; row: any }) {
    // Recuperar el objeto original con id numérico para editar/eliminar correctamente
    const original = this.rawCategories.find(c => c.id_category === event.row.id_category) ?? event.row;
    if (event.actionId === 'edit') {
      this.openModal('edit', original);
    } else if (event.actionId === 'delete') {
      this.confirmDelete(original);
    }
  }

  openModal(mode: 'create' | 'edit', category?: Category) {
    this.modalMode   = mode;
    this.isModalOpen = true;
    if (mode === 'edit' && category) {
      this.currentCategoryId = category.id_category;
      this.selectedFile = null;
      this.imagePreview = category.image_url ?? null;
      this.form.patchValue({
        id_parent_category: category.id_parent_category,
        name:               category.name,
        description:        category.description,
        status:             category.status
      });
    } else {
      this.currentCategoryId = null;
      this.selectedFile = null;
      this.imagePreview = null;
      this.form.reset({ status: 'active', id_parent_category: null, image_url: null });
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.selectedFile = input.files[0];
    this.imagePreview = URL.createObjectURL(this.selectedFile);
  }

  closeModal() {
    this.isModalOpen = false;
    this.form.reset();
    this.selectedFile = null;
    this.imagePreview = null;
  }

  saveCategory() {
    if (this.form.invalid) return;

    this.loading = true;

    const formData = new FormData();
    formData.append('name',        this.form.get('name')!.value);
    formData.append('description', this.form.get('description')!.value);
    formData.append('status',      this.form.get('status')!.value);
    const parentId = this.form.get('id_parent_category')!.value;
    if (parentId !== null && parentId !== undefined) {
      formData.append('id_parent_category', String(parentId));
    }
    if (this.selectedFile) {
      formData.append('file', this.selectedFile, this.selectedFile.name);
    }

    const request$ = this.modalMode === 'create'
      ? this.categoryService.createCategory(formData)
      : this.categoryService.updateCategory(this.currentCategoryId!, formData);

    request$.subscribe({
      next: () => {
        Swal.fire('Éxito', `Categoría ${this.modalMode === 'create' ? 'creada' : 'actualizada'} correctamente`, 'success');
        this.closeModal();
        this.reloadAll();
      },
      error: () => {
        Swal.fire('Error', 'Ocurrió un error al guardar', 'error');
        this.loading = false;
      }
    });
  }

  confirmDelete(category: Category) {
    // Bloquear eliminación si la categoría tiene subcategorías asociadas
    const hasChildren = this.allCategories.some(c => c.id_parent_category === category.id_category);
    if (hasChildren) {
      Swal.fire({
        title: 'Acción requerida',
        text: `"${category.name}" tiene subcategorías asociadas. Elimínalas o reasígnalas antes de continuar.`,
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

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
            this.reloadAll();
          },
          error: () => {
            Swal.fire('Error', 'No se pudo eliminar la categoría.', 'error');
            this.loading = false;
          }
        });
      }
    });
  }

  private reloadAll() {
    this.categoryService.getAll().subscribe({
      next: (cats) => {
        this.allCategories = cats;
        this.loadData();
      },
      error: () => {
        this.allCategories = [];
        this.loadData();
      }
    });
  }
}
