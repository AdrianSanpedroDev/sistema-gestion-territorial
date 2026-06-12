import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-bar.component.html',
})
export class FilterBarComponent {
  // Título principal (ej: 'Comunas' o 'Barrios')
  @Input() title: string = '';
  
  // Etiqueta del botón (ej: 'Agregar comuna')
  @Input() addButtonLabel: string = 'Agregar';
  
  // Ocultar botón si no se requiere
  @Input() showAddButton: boolean = true;

  // Evento al hacer clic en el botón agregar
  @Output() addClicked = new EventEmitter<void>();

  onAdd() {
    this.addClicked.emit();
  }
}