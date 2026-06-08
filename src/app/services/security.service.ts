import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { User, UserRole } from '../models/user';
import { StorageService } from './storage/storage.service';

// Usuarios mock disponibles para desarrollo (el backend aún no tiene auth)
const MOCK_USERS: Record<UserRole, User> = {
  admin: { id: 1, name: 'Admin Mock', email: 'admin@mock.dev', role: 'admin' },
  funcionario: { id: 2, name: 'Funcionario Mock', email: 'funcionario@mock.dev', role: 'funcionario' },
  ciudadano: { id: 3, name: 'Ciudadano Mock', email: 'ciudadano@mock.dev', role: 'ciudadano' },
};

// Rol activo por defecto durante el desarrollo
const DEFAULT_MOCK_ROLE: UserRole = 'admin';

@Injectable({
  providedIn: 'root',
})
export class SecurityService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private readonly storageKey = 'currentUser';

  constructor(private storage: StorageService) {
    try {
      const raw = this.storage.getItem(this.storageKey);
      if (raw) {
        const u: User = JSON.parse(raw);
        this.currentUserSubject.next(u);
      }
    } catch (e) {
      console.warn('Failed to load user from localStorage', e);
    }
  }

  /**
   * Mock: simula login sin llamar al backend.
   * Acepta un campo `role` en el objeto user para elegir el perfil de prueba;
   * si no viene, usa DEFAULT_MOCK_ROLE.
   */
  login(user: User): Observable<User> {
    const role: UserRole = (user.role && MOCK_USERS[user.role]) ? user.role : DEFAULT_MOCK_ROLE;
    const mockUser = MOCK_USERS[role];
    this.setUser(mockUser);
    console.log('🧪 [MOCK] Login como:', role, mockUser);
    return of(mockUser);
  }

  /** Mock: simula logout limpiando el usuario. */
  logout(): Observable<null> {
    this.clearUser();
    console.log('🧪 [MOCK] Logout');
    return of(null);
  }

  /**
   * Mock: devuelve el usuario en memoria si hay sesión activa, o lanza error 401
   * si no hay sesión. Esto permite que los guards funcionen correctamente:
   * AuthenticatedGuard redirige a login, NoAuthenticatedGuard deja pasar.
   */
  me(): Observable<User> {
    const current = this.currentUserSubject.getValue();
    if (current) {
      return of(current);
    }
    return throwError(() => ({ status: 401, error: { message: 'No hay sesión activa' } }));
  }

  /** Cambia el rol del mock en caliente (útil para desarrollo). */
  setMockRole(role: UserRole): void {
    this.setUser(MOCK_USERS[role]);
    console.log('🧪 [MOCK] Rol cambiado a:', role);
  }

  public getCurrentUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  setUser(user: User | null) {
    this.currentUserSubject.next(user);
    try {
      if (user) {
        const copy: any = { ...user };
        if ('password' in copy) delete copy.password;
        this.storage.setItem(this.storageKey, JSON.stringify(copy));
      } else {
        this.storage.removeItem(this.storageKey);
      }
    } catch (e) {
      console.warn('Failed to persist user to storage', e);
    }
  }

  clearUser() {
    this.currentUserSubject.next(null);
    try {
      this.storage.removeItem(this.storageKey);
    } catch (e) {
      console.warn('Failed to remove user from storage', e);
    }
  }
}
