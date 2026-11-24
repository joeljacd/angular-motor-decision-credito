import { Observable } from 'rxjs';
import { ActiveState, User } from '../auth/auth.models';

/** Datos de un usuario hallado en el directorio activo (AD). */
export interface DirectoryUser {
  usuario: string;
  nombre: string;
  correo: string;
  area: string;
}

export interface NewUser {
  usuario: string;
  nombre: string;
  perfil: number;
  estado: ActiveState;
}

export abstract class UsersApi {
  /** GET /users */
  abstract list(): Observable<User[]>;
  /** GET /directory/{username} — 404 si no existe en el directorio. */
  abstract lookupDirectory(username: string): Observable<DirectoryUser>;
  /** POST /users */
  abstract create(user: NewUser): Observable<User>;
  /** PATCH /users/{username}  (nombre y/o estado) */
  abstract update(username: string, changes: Partial<Pick<User, 'nombre' | 'estado'>>): Observable<User>;
}
