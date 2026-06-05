import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersService } from 'src/app/services/users.service';
import { User } from 'src/app/models/user';
import { DynamicTableComponent} from 'src/app/components/ui/table/dynamic-table/dynamic-table.component';
import { ColumnDef } from 'src/app/models/component-dynamic-table/column-def';
import { ActionButton } from 'src/app/models/component-dynamic-table/action-button';
import { TablePageEvent } from 'src/app/models/component-dynamic-table/table-page-event';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, DynamicTableComponent],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class ListComponent implements OnInit {

  users: User[] = [];
  loading = false;

  page = 1;
  pageSize = 5;
  total = 0;
  totalPages = 1;

  columns: ColumnDef[] = [
    { header: 'ID', key: 'id' },
    { header: 'Nombre', key: 'name' },
    { header: 'Usuario', key: 'username' },
    { header: 'Email', key: 'email' },
  ];

  actions: ActionButton[] = [
    { id: 'view', label: 'Ver', class: 'px-2 py-1 mr-2 rounded bg-blue-500 text-white',icon: 'heroEye' },
    { id: 'edit', label: 'Editar', class: 'px-2 py-1 mr-2 rounded bg-yellow-400 text-black',icon: 'heroPencil', },
    { id: 'delete', label: 'Eliminar', class: 'px-2 py-1 rounded bg-red-500 text-white',icon: 'heroTrash', },
  ];

  constructor(private usersService: UsersService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(page = this.page, pageSize = this.pageSize): void {
    this.loading = true;
    this.usersService.getPaged(page, pageSize).subscribe({
      next: (resp) => {
        this.users = resp.data || [];
        this.page = resp.page || page;
        this.pageSize = resp.pageSize || pageSize;
        this.total = resp.totalItems ?? this.users.length;
        this.totalPages = resp.totalPages ?? Math.max(1, Math.ceil(this.total / this.pageSize));
        this.loading = false;
      },
      error: () => {
        this.users = [];
        this.total = 0;
        this.totalPages = 1;
        this.loading = false;
      }
    });
  }
  onPageChange(event: TablePageEvent): void {
    this.page = event.page;
    this.pageSize = event.pageSize;
    console.log('Página cambiada:', event);
    this.loadUsers(this.page, this.pageSize);
  }

  onTableAction(event: { actionId: string; row: User }): void {
    const { actionId, row } = event;
    // Manejar acciones desde el componente padre
    if (actionId === 'view') {
      console.log('Ver', row);
    } else if (actionId === 'edit') {
      console.log('Editar', row);
    } else if (actionId === 'delete') {
      console.log('Eliminar', row);
    } else {
      console.log('Acción desconocida', actionId, row);
    }
  }

}