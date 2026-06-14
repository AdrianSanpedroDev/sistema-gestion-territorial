import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CitizenService } from '../../../services/citizen.service';
import { CitizenRequestDto } from '../../../models/citizen';
import { MapPickerComponent } from '../../../components/ui/map-picker/map-picker.component';
import { Coordinates } from '../../../models/coordinates';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-citizen-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MapPickerComponent],
  templateUrl: './citizen-form.component.html',
  styleUrl: './citizen-form.component.scss'
})
export class CitizenFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private citizenService = inject(CitizenService);

  form!: FormGroup;
  isEditMode = false;
  citizenId: number | null = null;
  initialLatitude?: number;
  initialLongitude?: number;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.citizenId = +id;
      this.loadCitizen();
    }
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      name:      ['', [Validators.required, Validators.minLength(3),
                       Validators.maxLength(100), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
      email:     ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      phone:     ['', [Validators.required, Validators.pattern(/^\d{7,15}$/)]],
      address:   ['', [Validators.required, Validators.maxLength(200)]],
      status:    ['active', Validators.required],
      latitude:  [null],
      longitude: [null]
    });
  }

  private loadCitizen(): void {
    this.citizenService.getById(this.citizenId!).subscribe({
      next: (citizen) => {
        this.form.patchValue(citizen);
        if (citizen.latitude && citizen.longitude) {
          this.initialLatitude = citizen.latitude;
          this.initialLongitude = citizen.longitude;
        }
      },
      error: () => Swal.fire('Error', 'No se pudo cargar el ciudadano', 'error')
    });
  }

  onLocationSelected(coords: Coordinates): void {
    this.form.patchValue({
      latitude: coords.latitude,
      longitude: coords.longitude
    });
  }

  save(): void {
    if (this.form.invalid) return;
    const dto: CitizenRequestDto = this.form.value;
    const request$ = this.isEditMode
      ? this.citizenService.updateCitizen(this.citizenId!, dto)
      : this.citizenService.createCitizen(dto);

    request$.subscribe({
      next: () => {
        Swal.fire('Éxito', `Ciudadano ${this.isEditMode ? 'actualizado' : 'creado'} correctamente`, 'success');
        this.router.navigate(['/citizens']);
      },
      error: (err) => Swal.fire('Error', err?.error?.message || 'Error al guardar', 'error')
    });
  }

  cancel(): void {
    this.router.navigate(['/citizens']);
  }
}
