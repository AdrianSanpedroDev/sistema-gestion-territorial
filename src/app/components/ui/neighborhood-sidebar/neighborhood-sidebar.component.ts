import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Neighborhood } from '../../../models/neighborhood';

@Component({
  selector: 'app-neighborhood-sidebar',
  templateUrl: './neighborhood-sidebar.component.html',
  styleUrls: ['./neighborhood-sidebar.component.css']
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