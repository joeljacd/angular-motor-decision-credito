import { Observable } from 'rxjs';
import { ActiveState, User } from '../auth/auth.models';

/** Datos de un usuario hallado en el directorio activo (AD). */
export interface DirectoryUser {
  username: string;
  name: string;
  email: string;
  area: string;
}

export interface NewUser {
  username: string;
  name: string;
  profile: number;
  status: ActiveState;
}

export abstract class UsersApi {
  /** GET /users */
  abstract list(): Observable<User[]>;
  /** GET /directory/{username} — 404 si no existe en el directorio. */
  abstract lookupDirectory(username: string): Observable<DirectoryUser>;
  /** POST /users */
  abstract create(user: NewUser): Observable<User>;
  /** PATCH /users/{username}  (nombre y/o estado) */
  abstract update(username: string, changes: Partial<Pick<User, 'name' | 'status'>>): Observable<User>;
}
