import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { SecurityService } from '../../../services/security.service';
import { User } from '../../../models/user';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-side-login',
  imports: [RouterModule, MaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './side-login.component.html',
})
export class AppSideLoginComponent {
  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  error: string | null = null;
  loading = false;

  constructor(private router: Router, private security: SecurityService) {}

  get f() {
    return this.form.controls;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error = null;
    this.loading = true;

    const user: User = {
      email: this.f.email.value ?? undefined,
      password: this.f.password.value ?? undefined,
    };

    this.security.login(user).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || '';
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: "Usuario o contraseña incorrectos. Por favor, inténtalo de nuevo.",
        });
      }
    });
  }
}

