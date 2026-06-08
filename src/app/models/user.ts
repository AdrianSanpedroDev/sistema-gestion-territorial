export type UserRole = 'admin' | 'funcionario' | 'ciudadano';

export interface User {
    id?: number;
    name?: string;
    username?: string;
    email?: string;
    phone?: string;
    website?: string;
    password?: string; // Solo para login, no debe ser almacenada ni enviada al frontend
    role?: UserRole;
}