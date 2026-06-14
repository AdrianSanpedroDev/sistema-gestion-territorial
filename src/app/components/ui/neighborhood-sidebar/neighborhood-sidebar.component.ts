import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- Agregado para *ngIf y *ngFor
import { FormsModule } from '@angular/forms';   // <-- Agregado para [(ngModel)]
import { Neighborhood } from '../../../models/neighborhood'; // Verifica que esta ruta apunte bien a tu modelo

@Component({
  selector: 'app-neighborhood-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule], // <-- IMPORTANTE: Agregar esto aquí
  templateUrl: './neighborhood-sidebar.component.html',
  styleUrls: ['./neighborhood-sidebar.component.scss'] // <-- Ojo aquí, mira el paso 2
})
export class NeighborhoodSidebarComponent {
  @Input() neighborhoods: Neighborhood[] = [];
  @Input() isLoading: boolean = false;
  
  @Output() onSearch = new EventEmitter<string>();
  @Output() onSelectNeighborhood = new EventEmitter<Neighborhood>();

  selectedNeighborhoodId: number | null = null;
  searchTerm: string = '';

  handleSearch(): void {
    this.onSearch.emit(this.searchTerm);
  }

  selectNeighborhood(neighborhood: Neighborhood): void {
    this.selectedNeighborhoodId = neighborhood.id_neighborhood;
    this.onSelectNeighborhood.emit(neighborhood);
  }
}