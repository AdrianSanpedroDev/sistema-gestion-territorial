import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-generic-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './generic-modal.component.html',
})
export class GenericModalComponent {
  // Controla la visibilidad del modal
  @Input() isOpen: boolean = false;
  
  // Título dinámico (ej: 'Agregar Comuna', 'Editar Barrio')
  @Input() title: string = '';
  
  // Permite deshabilitar el botón de guardar (útil si el formulario es inválido)
  @Input() isSaveDisabled: boolean = false;
  
  // Texto del botón de acción principal
  @Input() saveLabel: string = 'Guardar cambios';

  @Output() closeModal = new EventEmitter<void>();
  @Output() saveChanges = new EventEmitter<void>();

  onClose() {
    this.closeModal.emit();
  }

  onSave() {
    if (!this.isSaveDisabled) {
      this.saveChanges.emit();
    }
  }
}