import { MeInfo, Profile, Role, User } from './auth.models';

/** Construye el `/me` efectivo a partir de usuario + perfil (usado por los mocks; el backend real lo entrega ya armado). */
export function buildMeInfo(user: User, profile: Profile | undefined): MeInfo {
  const profileActive = !!profile && profile.status === 'active';
  const userActive = user.status === 'active';
  const opts = userActive && profileActive ? [...profile!.opts] : [];

  const canRequest = opts.includes('cap.request');
  const canApprove = opts.includes('cap.approve');
  const canAudit = opts.includes('history') || opts.includes('integrity');
  const roles: Role[] = [
    ...(canRequest ? (['request'] as const) : []),
    ...(canApprove ? (['approve'] as const) : []),
    ...(canAudit ? (['audit'] as const) : []),
  ];

  return {
    id: user.username,
    name: user.name,
    initials: initials(user.name),
    jobTitle: user.jobTitle || '—',
    email: user.email,
    profile: profile?.name ?? 'Sin perfil',
    profileActive,
    userActive,
    opts,
    canRequest,
    canApprove,
    canAudit,
    roles,
  };
}

export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}
