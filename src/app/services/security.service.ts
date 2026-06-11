import { Injectable, inject } from '@angular/core';
import { Auth, signInWithPopup, signOut, GoogleAuthProvider, GithubAuthProvider, onAuthStateChanged, User as FirebaseUser } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { User } from '../models/user';

// CAPA: Acceso a Datos (Servicio)
// POR QUÉ AQUÍ: Único lugar autorizado para hablar con Firebase Auth y Firestore.
//               Si un componente usara Firebase directamente, violaría la separación de capas.
// CONCEPTO ANGULAR: @Injectable providedIn root → singleton. BehaviorSubject → estado reactivo del usuario.

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  // inject() es la forma moderna de inyectar dependencias en Angular (alternativa al constructor)
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  private currentUserSubject = new BehaviorSubject<User | null>(null);

  constructor() {
    // onAuthStateChanged escucha en tiempo real si el usuario inicia o cierra sesión en Firebase.
    // Se ejecuta automáticamente al arrancar la app, lo que permite restaurar la sesión
    // si el usuario ya había iniciado sesión antes (Firebase guarda el token localmente).
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await this.getOrCreateUser(firebaseUser);
        this.currentUserSubject.next(user);
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  loginWithGoogle(): Observable<User> {
    const provider = new GoogleAuthProvider();
    // from() convierte una Promise en un Observable para que los componentes
    // puedan suscribirse con .subscribe() como con cualquier otro servicio Angular
    return from(
      signInWithPopup(this.auth, provider)
        .then(result => this.getOrCreateUser(result.user))
    );
  }

  loginWithGithub(): Observable<User> {
    const provider = new GithubAuthProvider();
    return from(
      signInWithPopup(this.auth, provider)
        .then(result => this.getOrCreateUser(result.user))
    );
  }

  logout(): Observable<void> {
    return from(signOut(this.auth));
  }

  // Usado por los guards para verificar si hay sesión activa
  me(): Observable<User> {
    const current = this.currentUserSubject.getValue();
    if (current) {
      return from(Promise.resolve(current));
    }
    return throwError(() => ({ status: 401, error: { message: 'No hay sesión activa' } }));
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  // Consulta Firestore para obtener el rol del usuario.
  // Si es la primera vez que inicia sesión, crea su documento con rol 'ciudadano'.
  // El rol solo puede ser cambiado manualmente desde la consola de Firebase.
  private async getOrCreateUser(firebaseUser: FirebaseUser): Promise<User> {
    const userRef = doc(this.firestore, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as User;
    }

    const newUser: User = {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName ?? 'Usuario',
      email: firebaseUser.email ?? '',
      role: 'ciudadano',
      photoURL: firebaseUser.photoURL ?? undefined,
    };

    await setDoc(userRef, newUser);
    return newUser;
  }
}
