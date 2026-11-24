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
        path: 'home',
        canActivate: [permissionGuard],
        data: { option: 'home' },
        title: 'nav.home',
        loadComponent: () => import('./features/dashboard/dashboard-page').then((m) => m.DashboardPage),
      },
      {
        path: 'flows',
        canActivate: [permissionGuard],
        data: { option: 'flows' },
        children: [
          { path: '', title: 'nav.flows', loadComponent: () => import('./features/flows/flows-page').then((m) => m.FlowsPage) },
          { path: 'editor', title: 'nav.flows', loadComponent: () => import('./features/flows/flow-editor-page').then((m) => m.FlowEditorPage) },
          { path: 'review', title: 'nav.flows', loadComponent: () => import('./features/flows/flow-review-page').then((m) => m.FlowReviewPage) },
        ],
      },
      {
        path: 'requests',
        canActivate: [permissionGuard],
        data: { option: 'requests' },
        title: 'nav.requests',
        loadComponent: () => import('./features/requests/requests-page').then((m) => m.RequestsPage),
      },
      {
        path: 'masters',
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'channels' },
          ...(['channels', 'actions', 'parameters', 'catalogs', 'roles'] as const).map((section) => ({
            path: section,
            canActivate: [permissionGuard],
            data: { option: `m-${section}`, section },
            title: `nav.m-${section}`,
            loadComponent: () => import('./features/masters/masters-page').then((m) => m.MastersPage),
          })),
        ],
      },
      {
        path: 'history',
        canActivate: [permissionGuard],
        data: { option: 'history' },
        title: 'nav.history',
        loadComponent: () => import('./features/history/history-page').then((m) => m.HistoryPage),
      },
      {
        path: 'integrity',
        canActivate: [permissionGuard],
        data: { option: 'integrity' },
        title: 'nav.integrity',
        loadComponent: () => import('./features/integrity/integrity-page').then((m) => m.IntegrityPage),
      },
      {
        path: 'users',
        canActivate: [permissionGuard],
        data: { option: 'users' },
        title: 'nav.users',
        loadComponent: () => import('./features/users/users-page').then((m) => m.UsersPage),
      },
      {
        path: 'profiles',
        canActivate: [permissionGuard],
        data: { option: 'profiles' },
        title: 'nav.profiles',
        loadComponent: () => import('./features/profiles/profiles-page').then((m) => m.ProfilesPage),
      },
      { path: '403', loadComponent: () => import('./features/errors/forbidden-page').then((m) => m.ForbiddenPage) },
      { path: '**', title: 'notfound.title', loadComponent: () => import('./features/errors/not-found-page').then((m) => m.NotFoundPage) },
    ],
  },
];
