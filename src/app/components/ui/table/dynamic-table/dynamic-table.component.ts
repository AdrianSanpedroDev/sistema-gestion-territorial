import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColumnDef } from 'src/app/models/component-dynamic-table/column-def';
import { ActionButton } from 'src/app/models/component-dynamic-table/action-button';
import { TablePageEvent } from 'src/app/models/component-dynamic-table/table-page-event';

@Component({
  selector: 'app-dynamic-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dynamic-table.component.html',
  styleUrls: ['./dynamic-table.component.scss'],
})
export class DynamicTableComponent<T extends Record<string, any>> {
  @Input() columns: ColumnDef[] = [];
  @Input() actions: ActionButton[] = [];
  @Input() data: T[] = [];

  @Input() page = 1;
  @Input() pageSize = 5;
  @Input() totalItems = 0;
  @Input('totalPages') externalTotalPages?: number;
  @Input() loading = false;

  @Output() pageChange = new EventEmitter<TablePageEvent>();
  @Output() action = new EventEmitter<{ actionId: string; row: T }>();

  /**
   * Calcular total de páginas basado en el total de registros y tamaño de página,
   * o usar el valor externo si se proporciona (útil cuando el total de páginas ya viene calculado desde el backend).
   * Esto permite que el componente sea flexible y pueda funcionar tanto con paginación manejada por el cliente como por el servidor.
   */
  get totalPages(): number {
    return this.externalTotalPages ?? Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  /**
   * Calcular el rango de registros que se están mostrando actualmente (desde - hasta),
   * para mostrarlo en la interfaz (ej: "Mostrando 11 a 20 de 53 registros").
   * Si no hay registros, mostrar "0 a 0".
   * Si el total de registros es menor que el tamaño de página, ajustar el rango para no mostrar un número mayor al total.
   */
  get fromItem(): number {
    return this.totalItems === 0 ? 0 : (this.page - 1) * this.pageSize + 1;
  }
  /**
   * Calcular el número del último registro que se muestra en la página actual,
   * asegurándose de no exceder el total de registros disponibles.
   * Si no hay registros, mostrar "0".
   */
  get toItem(): number {
    return Math.min(this.page * this.pageSize, this.totalItems);
  }

  /**
   * Emitir evento de cambio de página al componente padre,
   * quien se encargará de cargar los datos correspondientes a esa página.
   * @param page 
   * @returns 
   */
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) return;

    this.pageChange.emit({
      page,
      pageSize: this.pageSize,
    });
  }
  /**
   * Detectar cambio en el tamaño de página (cantidad de registros por página),
   * y emitir evento al componente padre para que recargue los datos con el nuevo tamaño de página.
   * @param pageSize 
   */
  changePageSize(pageSize: number): void {
    this.pageChange.emit({
      page: 1,
      pageSize,
    });
  }
  /**
   * Capturar el evento de cual acción se hizo click (ver, actualizar, eliminar),
   * y luego emite al componente padre, quien se encargará de
   * manejar la lógica de cada acción.
   * @param actionId identificador de la acción (ej: 'view', 'edit', 'delete')
   * @param row registro completo de la fila donde se hizo click, 
   * para que el padre tenga toda la información necesaria para manejar la acción
   */
  onActionClick(actionId: string, row: T): void {
    this.action.emit({ actionId, row });
  }

  /** obtener valor por clave anidada */
  getValue(row: T, key: string): any {
    if (!row || !key) return '';
    const parts = key.split('.');
    let value: any = row as any;
    for (const p of parts) {
      if (value == null) return '';
      value = value[p];
    }
    return value ?? '';
  }
}

