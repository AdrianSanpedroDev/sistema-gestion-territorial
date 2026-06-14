import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';   
import { Neighborhood } from '../../../models/neighborhood'; 

@Component({
  selector: 'app-neighborhood-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './neighborhood-sidebar.component.html',
  styleUrls: ['./neighborhood-sidebar.component.scss'] 
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