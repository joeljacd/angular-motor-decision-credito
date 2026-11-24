import { Routes } from '@angular/router';
import { authGuard, guestGuard, permissionGuard } from '@core/auth';
import { homeRedirectGuard } from './layout/nav/home-redirect.guard';

/**
 * Rutas protegidas: cada pantalla declara `data: { option }` (clave de permiso) y `title` (clave i18n).
 * El menú sale de layout/nav/nav.config.ts — mantener ambos en sincronía al agregar pantallas.
 */
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'login.title',
    loadComponent: () => import('./features/auth/login/login-page').then((m) => m.LoginPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', canActivate: [homeRedirectGuard], children: [] },
      {
        path: 'inicio',
        canActivate: [permissionGuard],
        data: { option: 'inicio' },
        title: 'nav.inicio',
        loadComponent: () => import('./features/dashboard/dashboard-page').then((m) => m.DashboardPage),
      },
      {
        path: 'flujos',
        canActivate: [permissionGuard],
        data: { option: 'flujos' },
        children: [
          { path: '', title: 'nav.flujos', loadComponent: () => import('./features/flows/flows-page').then((m) => m.FlowsPage) },
          { path: 'editor', title: 'nav.flujos', loadComponent: () => import('./features/flows/flow-editor-page').then((m) => m.FlowEditorPage) },
          { path: 'revision', title: 'nav.flujos', loadComponent: () => import('./features/flows/flow-review-page').then((m) => m.FlowReviewPage) },
        ],
      },
      {
        path: 'solicitudes',
        canActivate: [permissionGuard],
        data: { option: 'solicitudes' },
        title: 'nav.solicitudes',
        loadComponent: () => import('./features/requests/requests-page').then((m) => m.RequestsPage),
      },
      {
        path: 'maestros',
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'canales' },
          ...(['canales', 'acciones', 'parametros', 'catalogos', 'roles'] as const).map((section) => ({
            path: section,
            canActivate: [permissionGuard],
            data: { option: `m-${section}`, section },
            title: `nav.m-${section}`,
            loadComponent: () => import('./features/masters/masters-page').then((m) => m.MastersPage),
          })),
        ],
      },
      {
        path: 'historial',
        canActivate: [permissionGuard],
        data: { option: 'historial' },
        title: 'nav.historial',
        loadComponent: () => import('./features/history/history-page').then((m) => m.HistoryPage),
      },
      {
        path: 'integridad',
        canActivate: [permissionGuard],
        data: { option: 'integridad' },
        title: 'nav.integridad',
        loadComponent: () => import('./features/integrity/integrity-page').then((m) => m.IntegrityPage),
      },
      {
        path: 'usuarios',
        canActivate: [permissionGuard],
        data: { option: 'usuarios' },
        title: 'nav.usuarios',
        loadComponent: () => import('./features/users/users-page').then((m) => m.UsersPage),
      },
      {
        path: 'perfiles',
        canActivate: [permissionGuard],
        data: { option: 'perfiles' },
        title: 'nav.perfiles',
        loadComponent: () => import('./features/profiles/profiles-page').then((m) => m.ProfilesPage),
      },
      { path: '403', loadComponent: () => import('./features/errors/forbidden-page').then((m) => m.ForbiddenPage) },
      { path: '**', title: 'notfound.title', loadComponent: () => import('./features/errors/not-found-page').then((m) => m.NotFoundPage) },
    ],
  },
];
