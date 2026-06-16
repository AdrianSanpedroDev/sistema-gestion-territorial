import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { SecurityService } from '../../services/security.service';

@Component({
  selector: 'app-starter',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './starter.component.html',
})
export class StarterComponent {
  private security = inject(SecurityService);
  user$ = this.security.getCurrentUser();
}
