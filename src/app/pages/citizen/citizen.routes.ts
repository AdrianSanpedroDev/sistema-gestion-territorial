import { Routes } from '@angular/router';
import { CitizenComponent } from './citizen.component';
import { CitizenFormComponent } from './citizen-form/citizen-form.component';

export const CitizenRoutes: Routes = [
  {
    path: '',
    component: CitizenComponent
  },
  {
    path: 'new',
    component: CitizenFormComponent
  },
  {
    path: ':id/edit',
    component: CitizenFormComponent
  }
];
