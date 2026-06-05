import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';

@Component({
  selector: 'app-report-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './report-chat.component.html',
})
export class ReportChatComponent {
  @Input() loading = false;
  @Output() querySubmit = new EventEmitter<string>();

  query = '';

  submit(): void {
    if (!this.query.trim()) return;
    this.querySubmit.emit(this.query.trim());
  }
}
