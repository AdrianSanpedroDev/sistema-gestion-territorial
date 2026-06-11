import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { SecurityService } from '../../../services/security.service';
import Swal from 'sweetalert2';

// CAPA: Negocio (componente página)
// POR QUÉ AQUÍ: Decide qué proveedor OAuth usar y orquesta la navegación post-login.
//               NO habla con Firebase directamente — eso es tarea del SecurityService.
// CONCEPTO ANGULAR: @Component standalone — no necesita NgModule, se autocontiene
//                   con sus imports declarados aquí mismo.

@Component({
  selector: 'app-side-login',
  standalone: true,
  imports: [RouterModule, MaterialModule, CommonModule],
  templateUrl: './side-login.component.html',
})
export class AppSideLoginComponent {
  loading = false;

  // Angular inyecta automáticamente el singleton de SecurityService y Router.
  // El componente no sabe cómo se construyen, solo los usa.
  constructor(private router: Router, private security: SecurityService) {}

  loginWith(provider: 'google' | 'github'): void {
    this.loading = true;

    const login$ = provider === 'google'
      ? this.security.loginWithGoogle()
      : this.security.loginWithGithub();

    login$.subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err: Error) => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error al iniciar sesión',
          text: err?.message || 'No se pudo completar el inicio de sesión.',
        });
      }
    });
  }
}
