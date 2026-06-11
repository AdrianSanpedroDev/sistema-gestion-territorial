export type UserRole = 'admin' | 'funcionario' | 'ciudadano';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  photoURL?: string;
}