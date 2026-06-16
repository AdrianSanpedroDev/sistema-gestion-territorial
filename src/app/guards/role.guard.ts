import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { SecurityService } from '../services/security.service';
import { UserRole } from '../models/user';

export const roleGuard: CanActivateFn = (route) => {
  const security = inject(SecurityService);
  const router = inject(Router);
  const roles: UserRole[] = route.data['roles'];

  return security.me().pipe(
    take(1),
    map(user => roles.includes(user.role) ? true : router.createUrlTree(['/dashboard'])),
  );
};
