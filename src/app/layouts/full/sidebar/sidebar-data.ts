import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Principal',
  },
  {
    displayName: 'Dashboard',
    iconName: 'solar:widget-line-duotone',
    route: '/dashboard',
  },
  {
    displayName: 'Reportes',
    iconName: 'solar:chart-2-line-duotone',
    route: '/reports',
  },
  {
    displayName: 'Comunas',
    iconName: 'solar:city-line-duotone',
    route: '/communes',
  },
  {
    displayName: 'Barrios',
    iconName: 'solar:home-2-line-duotone',
    route: '/neighborhoods',
  },
  {
    displayName: 'Ciudadanos',
    iconName: 'solar:users-group-rounded-line-duotone',
    route: '/citizens',
  },
  {
    displayName: 'Anotaciones',
    iconName: 'solar:notes-line-duotone',
    route: '/annotations',
  },
  {
    displayName: 'Categorías',
    iconName: 'solar:tag-line-duotone',
    route: '/categories',
  },
  {
    displayName: 'Entidades',
    iconName: 'solar:buildings-line-duotone',
    route: '/entities',
  },
  {
    displayName: 'Funcionarios',
    iconName: 'solar:user-circle-line-duotone',
    route: '/officials',
  },
  {
    displayName: 'Mapa de anotaciones',
    iconName: 'solar:map-point-line-duotone',
    route: '/annotations-map',
  },
  {
    displayName: 'Demarcación',
    iconName: 'solar:pen-new-square-line-duotone',
    route: '/gestion-territorial',
  },
  {
    displayName: 'Seguimiento',
    iconName: 'solar:routing-line-duotone',
    route: '/tracking',
  },
];
