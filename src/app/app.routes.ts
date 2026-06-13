import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { AuthenticatedGuard } from './guards/authenticated.guard';
import { NoAuthenticatedGuard } from './guards/no-authenticated.guard';

export const routes: Routes = [
  {
    path: '',
    component: FullComponent,
    canActivateChild: [AuthenticatedGuard],
    children: [
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/pages.routes').then((m) => m.PagesRoutes),
      },
      {
        path: 'communes',
        loadChildren: () => import('./pages/commune/commune.routes').then((m) => m.CommuneRoutes),
      },
      {
        path: 'neighborhoods',
        loadChildren: () => import('./pages/neighborhood/neighborhood.routes').then((m) => m.NeighborhoodRoutes),
      },
      {
        path: 'users',
        children: [
          {
            path: '',
            loadChildren: () =>import('./pages/users/users.routes').then((m) => m.UserRoutes)
          }
        ]
      },
      {
        path: 'reports',
        loadChildren: () => import('./pages/reports/reports.routes').then((m) => m.ReportsRoutes),
      },
      {
        path: 'citizens',
        loadChildren: () => import('./pages/citizen/citizen.routes').then((m) => m.CitizenRoutes),
      },
      {
        path: 'categories',
        loadChildren: () => import('./pages/category/category.routes').then((m) => m.CategoryRoutes),
      },
    ],
  },
  {
    path: '',
    component: BlankComponent,
    canActivateChild: [NoAuthenticatedGuard],
    children: [
      {
        path: 'authentication',
        loadChildren: () =>
          import('./pages/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'authentication/error',
  },
];