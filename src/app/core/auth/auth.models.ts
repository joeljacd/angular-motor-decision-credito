import { OptionKey } from './permissions';

export type ActiveState = 'Activo' | 'Inactivo';

export interface Profile {
  id: number;
  codigo: string;
  nombre: string;
  desc: string;
  estado: ActiveState;
  /** dd/MM/yyyy */
  upd: string;
  opts: OptionKey[];
}

export interface User {
  id: string;
  /** Usuario de red (Active Directory), sin dominio. */
  usuario: string;
  nombre: string;
  correo: string;
  /** id del perfil */
  perfil: number;
  estado: ActiveState;
  /** "dd/MM/yyyy HH:mm" o "—" */
  acceso: string;
  cargo: string;
}

export type Role = 'request' | 'approve' | 'audit';

/** Respuesta de `/me`: identidad + capacidades efectivas del usuario autenticado. */
export interface MeInfo {
  id: string;
  nombre: string;
  /** Iniciales para el avatar. */
  ini: string;
  cargo: string;
  correo: string;
  perfil: string;
  perfilActivo: boolean;
  userActive: boolean;
  /** Opciones efectivas (vacío si usuario o perfil están inactivos). */
  opts: OptionKey[];
  puedeSolicitar: boolean;
  puedeAprobar: boolean;
  puedeAuditar: boolean;
  roles: Role[];
}

export interface Session {
  token: string;
  userId: string;
  /** ISO */
  startedAt: string;
}
