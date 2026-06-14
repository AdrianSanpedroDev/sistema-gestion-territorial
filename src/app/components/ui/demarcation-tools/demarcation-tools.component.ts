import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- Agregado
import { DraftPoint } from '../../../models/map';

@Component({
  selector: 'app-demarcation-tools',
  standalone: true, // <-- Agregado
  imports: [CommonModule], // <-- Agregado
  templateUrl: './demarcation-tools.component.html',
  styleUrls: ['./demarcation-tools.component.scss'] 
})
export class DemarcationToolsComponent {
  @Input() points: DraftPoint[] = [];
  @Input() isSaving: boolean = false;
  @Input() selectedNeighborhoodName: string = 'Ninguno';

  @Output() onModeChange = new EventEmitter<'add' | 'edit'>();
  @Output() onClear = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<DraftPoint[]>();

  currentMode: 'add' | 'edit' = 'add';

  setMode(mode: 'add' | 'edit'): void {
    this.currentMode = mode;
    this.onModeChange.emit(mode);
  }

  clearPoints(): void {
    this.onClear.emit();
  }

  cancelDemarcation(): void {
    this.onCancel.emit();
  }

  savePolygon(): void {
    if (this.points.length >= 3) {
      this.onSave.emit(this.points);
    } else {
      alert('Un polígono necesita al menos 3 puntos.');
    }
  }
}