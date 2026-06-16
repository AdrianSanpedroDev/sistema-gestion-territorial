import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MaterialModule } from '../../material.module';

interface ModuleShortcut {
  icon: string;
  title: string;
  description: string;
  route: string;
}

@Component({
  selector: 'app-starter',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './starter.component.html',
})
export class StarterComponent {
  private router = inject(Router);

  modules: ModuleShortcut[] = [
    { icon: 'solar:notes-line-duotone',                title: 'Anotaciones',          description: 'Gestiona las anotaciones del territorio',         route: '/annotations' },
    { icon: 'solar:users-group-rounded-line-duotone',  title: 'Ciudadanos',            description: 'Administra el registro de ciudadanos',             route: '/citizens' },
    { icon: 'solar:tag-line-duotone',                  title: 'Categorías',            description: 'Organiza las categorías de anotaciones',           route: '/categories' },
    { icon: 'solar:buildings-line-duotone',            title: 'Entidades',             description: 'Gestiona las entidades registradas',               route: '/entities' },
    { icon: 'solar:user-circle-line-duotone',          title: 'Funcionarios',          description: 'Administra el personal de campo',                  route: '/officials' },
    { icon: 'solar:city-line-duotone',                 title: 'Comunas',               description: 'Gestiona las comunas del territorio',              route: '/communes' },
    { icon: 'solar:home-2-line-duotone',               title: 'Barrios',               description: 'Administra los barrios y sus divisiones',          route: '/neighborhoods' },
    { icon: 'solar:map-point-line-duotone',            title: 'Mapa de anotaciones',   description: 'Visualiza anotaciones georreferenciadas',          route: '/annotations-map' },
    { icon: 'solar:pen-new-square-line-duotone',       title: 'Demarcación',           description: 'Delimita polígonos de barrios en el mapa',         route: '/gestion-territorial' },
    { icon: 'solar:routing-line-duotone',              title: 'Seguimiento',           description: 'Monitorea funcionarios en tiempo real',            route: '/tracking' },
    { icon: 'solar:chart-2-line-duotone',              title: 'Reportes',              description: 'Genera reportes con inteligencia artificial',      route: '/reports' },
  ];

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
