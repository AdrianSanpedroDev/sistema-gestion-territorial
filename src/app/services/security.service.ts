import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environments';
import { User } from '../models/user';
import { StorageService } from './storage/storage.service';

@Injectable({
  providedIn: 'root',
})
export class SecurityService {
  private api = environment.apiUrl;

  private currentUserSubject = new BehaviorSubject<User | null>(null);

  private readonly storageKey = 'currentUser';

  constructor(private http: HttpClient, private storage: StorageService) {
    // Al crear el servicio, intentar cargar usuario persistido
    try {
      const raw = this.storage.getItem(this.storageKey);
      if (raw) {
        const u: User = JSON.parse(raw);
        this.currentUserSubject.next(u);
      }
    } catch (e) {
      // ignore parse errors
      console.warn('Failed to load user from localStorage', e);
    }
  }

  /**
   * Este método realiza el proceso de login:
   * 1. Envía las credenciales al backend para autenticación.
   * 2. Si el login es exitoso, llama a /me para obtener los datos del usuario actual.
   * 3. Actualiza el estado del usuario en el servicio y lo persiste en storage.
   * Es importante que el backend esté configurado para manejar sesiones (por ejemplo, con cookies)
   * y que el endpoint /me valide la sesión y devuelva el usuario correspondiente.
   * @param user 
   * @returns 
   */


  login(user: User): Observable<any> {
    const url = `${this.api}/auth/login`;
    return this.http.post<any>(url, user, { withCredentials: true }).pipe(
      tap(() => console.log('✅ Login exitoso, llamando /me...')),
      switchMap(() =>
        this.me().pipe(
          tap((u) => {
            console.log('✅ /me respondió:', u);
            this.setUser(u);
          }),
          catchError((err) => {
            console.error('❌ /me falló:', err.status, err.error);
            this.setUser(null);
            return of(null);
          })
        )
      )
    );
  }

  /**
   * Este método realiza el proceso de logout:
   * 1. Llama al endpoint de logout en el backend para invalidar la sesión.
   * 2. Limpia el estado del usuario en el servicio y en el storage.
   * Es importante que el backend maneje correctamente la invalidación de la sesión (por ejemplo, eliminando la cookie).
   * @returns 
   */
  logout(): Observable<any> {
    const url = `${this.api}/auth/logout`;
    return this.http.post(url, {}, { withCredentials: true }).pipe(
      tap(() => this.clearUser())
    );
  }

  /**
   * Llama al endpoint /me para obtener los datos del usuario actual. 
   * Se espera que el backend valide la sesión
   * y devuelva el usuario correspondiente o un error si no hay sesión válida.
   * La cookie de sesión debe ser enviada automáticamente por el navegador
   * debido a { withCredentials: true }.
   * @returns 
   */

  me(): Observable<User> {
    const url = `${this.api}/auth/me`;
    return this.http.get<User>(url, { withCredentials: true });
  }

  /** Devuelve el observable público del usuario actual */
  public getCurrentUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  /**
   * Actualiza el estado del usuario actual en el servicio y lo persiste en storage.
   * Este método se llama después de un login exitoso para establecer el usuario actual,
   * o después de un logout para limpiar el usuario.
   * Es importante no almacenar la contraseña en el storage por razones de seguridad.
   * @param user 
   */

  setUser(user: User | null) {
    console.log('🔐 Estableciendo usuario actual:', user);
    this.currentUserSubject.next(user);
    // Persistir en storage (no almacenar password)
    // Si no guardo al usuario en local storage, cada vez que recargue la página 
    // se perderá la información del usuario actual
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

