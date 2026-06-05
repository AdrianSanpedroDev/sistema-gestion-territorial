import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { SecurityService } from '../services/security.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticatedGuard implements  CanActivateChild {

  constructor(private securityService: SecurityService,
    private router: Router
  ) {}

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    console.log('🔒 Verificando autenticación para ruta:', state.url);
    return this.securityService.me().pipe(
      tap((user) => this.securityService.setUser(user)),
      map((user) => !!user),
      catchError(() => {
        this.router.navigate(['/authentication/login']);
        this.securityService.clearUser();
        return of(false);
      })
    );
  }

}





