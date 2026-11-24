import { OptionKey } from './permissions';

export type ActiveState = 'active' | 'inactive';

export interface Profile {
  id: number;
  code: string;
  name: string;
  description: string;
  status: ActiveState;
  /** dd/MM/yyyy */
  updatedAt: string;
  opts: OptionKey[];
}

export interface User {
  id: string;
  /** Usuario de red (Active Directory), sin dominio. */
  username: string;
  name: string;
  email: string;
  /** id del perfil */
  profile: number;
  status: ActiveState;
  /** "dd/MM/yyyy HH:mm" o "—" */
  lastAccess: string;
  jobTitle: string;
}

export type Role = 'request' | 'approve' | 'audit';

/** Respuesta de `/me`: identidad + capacidades efectivas del usuario autenticado. */
export interface MeInfo {
  id: string;
  name: string;
  /** Iniciales para el avatar. */
  initials: string;
  jobTitle: string;
  email: string;
  profile: string;
  profileActive: boolean;
  userActive: boolean;
  /** Opciones efectivas (vacío si usuario o perfil están inactivos). */
  opts: OptionKey[];
  canRequest: boolean;
  canApprove: boolean;
  canAudit: boolean;
  roles: Role[];
}

export interface Session {
  token: string;
  userId: string;
  /** ISO */
  startedAt: string;
}
