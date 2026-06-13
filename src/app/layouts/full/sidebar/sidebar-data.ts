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
    iconName: 'solar:chart-2-line-duotone',
    route: '/communes',
  },
  {
    displayName: 'Barrios',
    iconName: 'solar:chart-2-line-duotone',
    route: '/neighborhoods',
  },
  {
    displayName: 'Ciudadanos',
    iconName: 'solar:users-group-rounded-line-duotone',
    route: '/citizens',
  },
  {
    displayName: 'Categorías',
    iconName: 'solar:tag-line-duotone',
    route: '/categories',
  },

];
