import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateChild,
  Router,
  RouterStateSnapshot
} from '@angular/router';

import { of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { SecurityService } from '../services/security.service';

@Injectable({
  providedIn: 'root'
})
export class NoAuthenticatedGuard implements CanActivateChild {

  constructor(
    private securityService: SecurityService,
    private router: Router
  ) {}

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

    console.log('🔓 Verificando NO autenticación para ruta:', state.url);

    return this.securityService.me().pipe(

      tap((user) => this.securityService.setUser(user)),

      map((user) => {

        // SI HAY SESIÓN
        if (user) {
          return this.router.createUrlTree(['/dashboard']);
        }

        // SI NO HAY SESIÓN
        return true;
      }),

      catchError(() => {

        // normalmente 401 = no autenticado
        this.securityService.clearUser();

        return of(true);
      })
    );
  }
}