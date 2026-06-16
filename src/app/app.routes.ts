import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { AuthenticatedGuard } from './guards/authenticated.guard';
import { NoAuthenticatedGuard } from './guards/no-authenticated.guard';
import { roleGuard } from './guards/role.guard';

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
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./pages/commune/commune.routes').then((m) => m.CommuneRoutes),
      },
      {
        path: 'neighborhoods',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./pages/neighborhood/neighborhood.routes').then((m) => m.NeighborhoodRoutes),
      },
      {
        path: 'tracking',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'funcionario'] },
        loadChildren: () =>
          import('./pages/tracking-page/tracking-page.routes').then((m) => m.TRACKING_ROUTES),
      },
      {
        path: 'users',
        children: [
          {
            path: '',
            loadChildren: () => import('./pages/users/users.routes').then((m) => m.UserRoutes)
          }
        ]
      },
      {
        path: 'reports',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'funcionario'] },
        loadChildren: () => import('./pages/reports/reports.routes').then((m) => m.ReportsRoutes),
      },
      {
        path: 'citizens',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./pages/citizen/citizen.routes').then((m) => m.CitizenRoutes),
      },
      {
        path: 'categories',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./pages/category/category.routes').then((m) => m.CategoryRoutes),
      },
      {
        path: 'entities',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./pages/entity/entity.routes').then((m) => m.EntityRoutes),
      },
      {
        path: 'officials',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./pages/official/official.routes').then((m) => m.OfficialRoutes),
      },
      {
        path: 'annotations',
        loadChildren: () => import('./pages/annotation/annotation.routes').then((m) => m.AnnotationRoutes),
      },
      {
        path: 'gestion-territorial',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'funcionario'] },
        loadChildren: () =>
          import('./pages/territorial-management/territorial-management.routes')
            .then((m) => m.TERRITORIAL_ROUTES),
      },
      {
        path: 'annotations-map',
        loadChildren: () =>
          import('./pages/annotation-map/annotation-map.routes')
            .then((m) => m.ANNOTATION_MAP_ROUTES),
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
