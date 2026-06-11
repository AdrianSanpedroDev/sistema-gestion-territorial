import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateChild,
  Router,
  RouterStateSnapshot
} from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SecurityService } from '../services/security.service';

@Injectable({
  providedIn: 'root'
})
export class NoAuthenticatedGuard implements CanActivateChild {

  constructor(
    private securityService: SecurityService,
    private router: Router
  ) {}

  canActivateChild(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) {
    return this.securityService.me().pipe(
      map((user) => {
        if (user) {
          return this.router.createUrlTree(['/dashboard']);
        }
        return true;
      }),
      catchError(() => of(true))
    );
  }
}
