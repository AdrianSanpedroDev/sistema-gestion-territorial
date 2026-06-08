import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { AuthenticatedGuard } from './guards/authenticated.guard';
import { NoAuthenticatedGuard } from './guards/no-authenticated.guard';

export const routes: Routes = [
  {
    path: '',
    component: FullComponent,
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
        path: 'users',
        canActivateChild: [AuthenticatedGuard],
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
      }
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