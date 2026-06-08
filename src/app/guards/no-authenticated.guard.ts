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
    console.log('🔓 [MOCK] Verificando NO autenticación para ruta:', state.url);
    return this.securityService.me().pipe(
      tap((user) => this.securityService.setUser(user)),
      map((user) => {
        if (user) {
          return this.router.createUrlTree(['/dashboard']);
        }
        return true;
      }),
      catchError(() => {
        this.securityService.clearUser();
        return of(true);
      })
    );
  }
}
