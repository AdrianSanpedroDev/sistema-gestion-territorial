import { Routes } from '@angular/router';
import { AnnotationComponent } from './annotation.component';
import { AnnotationFormComponent } from './annotation-form/annotation-form.component';

export const AnnotationRoutes: Routes = [
  { path: '',         component: AnnotationComponent },
  { path: 'new',      component: AnnotationFormComponent },
  { path: ':id/edit', component: AnnotationFormComponent },
];
