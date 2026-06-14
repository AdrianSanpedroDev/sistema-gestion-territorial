import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FilterBarComponent } from '../../components/ui/filter-bar/filter-bar.component';
import { DynamicTableComponent } from '../../components/ui/table/dynamic-table/dynamic-table.component';
import { CitizenService } from '../../services/citizen.service';
import { Citizen } from '../../models/citizen';
import { ColumnDef } from '../../models/component-dynamic-table/column-def';
import { ActionButton } from '../../models/component-dynamic-table/action-button';
import { TablePageEvent } from '../../models/component-dynamic-table/table-page-event';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-citizen',
  standalone: true,
  imports: [CommonModule, FilterBarComponent, DynamicTableComponent],
  templateUrl: './citizen.component.html'
})
export class CitizenComponent implements OnInit {
  private citizenService = inject(CitizenService);
  private router = inject(Router);

  citizens: Citizen[] = [];
  loading = false;
  page = 1;
  pageSize = 5;
  totalItems = 0;
  searchTerm = '';

  columns: ColumnDef[] = [
    { key: 'name',       header: 'Nombre'            },
    { key: 'email',      header: 'Correo'            },
    { key: 'phone',      header: 'Teléfono'          },
    { key: 'address',    header: 'Dirección'         },
    { key: 'status',     header: 'Estado'            },
    { key: 'created_at', header: 'Fecha de registro' }
  ];

  actions: ActionButton[] = [
    { id: 'edit',   label: 'Editar',   class: 'mr-2 px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600' },
    { id: 'delete', label: 'Eliminar', class: 'px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700'           }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    const request$ = this.searchTerm
      ? this.citizenService.searchByFilter(this.searchTerm, this.page, this.pageSize)
      : this.citizenService.getPaged(this.page, this.pageSize);

    request$.subscribe({
      next: (res) => {
        this.citizens   = res.items;        // era res.data
        this.totalItems = res.totalItems;
        this.loading    = false;
    },

      error: () => {
        this.citizens = [];
        this.loading  = false;
      }
    });
  }

  onSearch(event: any): void {
    this.searchTerm = event.target.value;
    this.page = 1;
    this.loadData();
  }

  onPageChange(event: TablePageEvent): void {
    this.page     = event.page;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  navigateToCreate(): void {
    this.router.navigate(['/citizens/new']);
  }

  handleAction(event: { actionId: string; row: Citizen }): void {
    if (event.actionId === 'edit') {
      this.router.navigate(['/citizens', event.row.id_citizen, 'edit']);
    } else if (event.actionId === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  private confirmDelete(citizen: Citizen): void {
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
