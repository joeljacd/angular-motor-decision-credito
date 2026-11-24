import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Profile, User } from '../../auth/auth.models';
import { NOW } from '../../util/clock';
import { formatDmy } from '../../util/date';
import { ProfileDraft, ProfilesApi } from '../profiles.api';
import { DirectoryUser, NewUser, UsersApi } from '../users.api';
import { MockApiError, MockBase } from './mock-apis';

/** Directorio activo simulado: solo estos usuarios "existen" en AD. */
const DIRECTORY: Record<string, Omit<DirectoryUser, 'usuario' | 'correo'>> = {
  amolina: { nombre: 'Alejandra Molina', area: 'Riesgos' },
  ctapia: { nombre: 'Cristina Tapia', area: 'Banca Personas' },
  egarcia: { nombre: 'Eduardo García', area: 'Crédito Pyme' },
  rnaranjo: { nombre: 'Roberto Naranjo', area: 'Cobranzas' },
  sloor: { nombre: 'Sebastián Loor', area: 'Tecnología' },
};
export const MOCK_DIRECTORY_USERS = Object.keys(DIRECTORY);

@Injectable()
export class MockUsersApi extends MockBase implements UsersApi {
  list(): Observable<User[]> {
    return this.respond(() => this.db.users);
  }

  lookupDirectory(username: string): Observable<DirectoryUser> {
    return this.respond(() => {
      const key = username.trim().toLowerCase();
      const entry = DIRECTORY[key];
      if (!entry) throw new MockApiError(404, 'Usuario no encontrado en el directorio activo');
      return { usuario: key, correo: `${key}@bancoamazonas.ec`, ...entry };
    });
  }

  create(user: NewUser): Observable<User> {
    return this.respond(() => {
      if (this.db.users.some((u) => u.usuario === user.usuario)) throw new MockApiError(409, 'El usuario ya está registrado');
      const created: User = { id: user.usuario, correo: `${user.usuario}@bancoamazonas.ec`, acceso: '—', cargo: '', ...user };
      this.db.users.push(created);
      return created;
    });
  }

  update(username: string, changes: Partial<Pick<User, 'nombre' | 'estado'>>): Observable<User> {
    return this.respond(() => {
      const user = this.db.users.find((u) => u.usuario === username);
      if (!user) throw new MockApiError(404, 'Usuario no encontrado');
      Object.assign(user, changes);
      return user;
    });
  }
}

@Injectable()
export class MockProfilesApi extends MockBase implements ProfilesApi {
  private readonly now = inject(NOW);

  list(): Observable<Profile[]> {
    return this.respond(() => this.db.profiles);
  }

  create(draft: ProfileDraft): Observable<Profile> {
    return this.respond(() => {
      const id = Math.max(0, ...this.db.profiles.map((p) => p.id)) + 1;
      const created: Profile = { id, codigo: `PRF-${String(id).padStart(3, '0')}`, upd: formatDmy(this.now()), ...draft };
      this.db.profiles.push(created);
      return created;
    });
  }

  update(id: number, draft: ProfileDraft): Observable<Profile> {
    return this.respond(() => {
      const profile = this.find(id);
      Object.assign(profile, draft, { upd: formatDmy(this.now()) });
      return profile;
    });
  }

  setStatus(id: number, estado: Profile['estado']): Observable<Profile> {
    return this.respond(() => {
      const profile = this.find(id);
      // El perfil Administrador es la red de seguridad: nunca queda inactivo.
      if (profile.id === 1 && estado === 'Inactivo') throw new MockApiError(409, 'El perfil Administrador no se puede inactivar');
      profile.estado = estado;
      profile.upd = formatDmy(this.now());
      return profile;
    });
  }

  private find(id: number): Profile {
    const profile = this.db.profiles.find((p) => p.id === id);
    if (!profile) throw new MockApiError(404, 'Perfil no encontrado');
    return profile;
  }
}
