import { MeInfo, Profile, Role, User } from './auth.models';

/** Construye el `/me` efectivo a partir de usuario + perfil (usado por los mocks; el backend real lo entrega ya armado). */
export function buildMeInfo(user: User, profile: Profile | undefined): MeInfo {
  const perfilActivo = !!profile && profile.estado === 'Activo';
  const userActive = user.estado === 'Activo';
  const opts = userActive && perfilActivo ? [...profile!.opts] : [];

  const puedeSolicitar = opts.includes('cap.request');
  const puedeAprobar = opts.includes('cap.approve');
  const puedeAuditar = opts.includes('history') || opts.includes('integrity');
  const roles: Role[] = [
    ...(puedeSolicitar ? (['request'] as const) : []),
    ...(puedeAprobar ? (['approve'] as const) : []),
    ...(puedeAuditar ? (['audit'] as const) : []),
  ];

  return {
    id: user.usuario,
    nombre: user.nombre,
    ini: initials(user.nombre),
    cargo: user.cargo || '—',
    correo: user.correo,
    perfil: profile?.nombre ?? 'Sin perfil',
    perfilActivo,
    userActive,
    opts,
    puedeSolicitar,
    puedeAprobar,
    puedeAuditar,
    roles,
  };
}

export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}
