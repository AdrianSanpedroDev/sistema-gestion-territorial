import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SecurityService } from '../../../services/security.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-side-login',
  standalone: true,
  imports: [RouterModule, MaterialModule, CommonModule, FormsModule],
  templateUrl: './side-login.component.html',
})
export class AppSideLoginComponent {
  loading = false;
  email = '';
  password = '';

  constructor(private router: Router, private security: SecurityService) {}

  loginWith(provider: 'google' | 'github'): void {
    this.loading = true;
    const login$ = provider === 'google'
      ? this.security.loginWithGoogle()
      : this.security.loginWithGithub();

    login$.subscribe({
      next: () => { this.loading = false; this.router.navigate(['/dashboard']); },
      error: (err: Error) => {
        this.loading = false;
        Swal.fire({ icon: 'error', title: 'Error al iniciar sesión', text: err?.message || 'No se pudo completar el inicio de sesión.' });
      }
    });
  }

  loginWithEmail(): void {
    if (!this.email.trim() || !this.password.trim()) return;
    this.loading = true;

    this.security.loginWithEmail(this.email, this.password).subscribe({
      next: () => { this.loading = false; this.router.navigate(['/dashboard']); },
      error: (err: Error) => {
        this.loading = false;
        Swal.fire({ icon: 'error', title: 'Error al iniciar sesión', text: err?.message || 'Correo o contraseña incorrectos.' });
      }
    });
  }
}
