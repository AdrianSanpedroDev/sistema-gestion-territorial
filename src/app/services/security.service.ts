import { Injectable, inject } from '@angular/core';
import { Auth, signInWithPopup, signInWithEmailAndPassword, signOut, GoogleAuthProvider, GithubAuthProvider, onAuthStateChanged, User as FirebaseUser } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, from, throwError, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  private currentUserSubject = new BehaviorSubject<User | null>(null);

  // Promise que se resuelve cuando Firebase responde por primera vez (con o sin sesión).
  // Evita la condición de carrera donde el guard lee null antes de que Firebase restaure la sesión.
  private authInitialized: Promise<void>;
  private resolveAuthInit!: () => void;

  constructor() {
    this.authInitialized = new Promise(resolve => { this.resolveAuthInit = resolve; });

    onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await this.getOrCreateUser(firebaseUser);
        this.currentUserSubject.next(user);
      } else {
        this.currentUserSubject.next(null);
      }
      this.resolveAuthInit();
    });
  }

  loginWithGoogle(): Observable<User> {
    const provider = new GoogleAuthProvider();
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

  loginWithEmail(email: string, password: string): Observable<User> {
    return from(
      signInWithEmailAndPassword(this.auth, email, password)
        .then(result => this.getOrCreateUser(result.user))
    );
  }

  logout(): Observable<void> {
    return from(signOut(this.auth));
  }

  // Espera a que Firebase inicialice antes de responder, eliminando la condición de carrera en guards.
  me(): Observable<User> {
    return from(this.authInitialized).pipe(
      switchMap(() => {
        const current = this.currentUserSubject.getValue();
        if (current) return of(current);
        return throwError(() => ({ status: 401, error: { message: 'No hay sesión activa' } }));
      })
    );
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  private async getOrCreateUser(firebaseUser: FirebaseUser): Promise<User> {
    const userRef = doc(this.firestore, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    const latestPhoto = firebaseUser.photoURL ?? undefined;

    if (userSnap.exists()) {
      const existing = userSnap.data() as User;
      // Sincroniza la foto aunque el documento ya exista, por si cambió en Google/GitHub
      if (existing.photoURL !== latestPhoto) {
        await updateDoc(userRef, { photoURL: latestPhoto ?? null });
      }
      return { ...existing, photoURL: latestPhoto };
    }

    const newUser: User = {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName ?? 'Usuario',
      email: firebaseUser.email ?? '',
      role: 'ciudadano',
      photoURL: latestPhoto,
    };

    await setDoc(userRef, newUser);
    return newUser;
  }
}
