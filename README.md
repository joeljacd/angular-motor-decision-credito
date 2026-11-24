# Portal Banco Amazonas · Motor de Decisión de Crédito (Angular 22)

Marco de trabajo migrado del prototipo HTML: kit de UI reutilizable, temas configurables, login, shell (menú por permisos) y dashboard **Inicio**. Incluye todas las pantallas del prototipo (Solicitudes, Historial, Integridad, Usuarios, Perfiles, Maestros, Flujos) con router lazy, carga y servicios mock; ver `docs/MIGRATION.md` para decisiones y límites.

## Comandos
```bash
npm install
npm start            # http://localhost:4200  (usa mocks)
npm run build        # producción · npm run build:dev
npm test             # Vitest (jsdom) · npm run test:ci
```
Login demo (mocks): usuarios `mfcevallos`, `lmora`, `aperez`, `cruiz` con cualquier contraseña no vacía. En el header, "Ver el portal como…" cambia de usuario.

## Arquitectura (`src/app`)
| Carpeta | Contenido |
|---|---|
| `core/` | Singletons: `auth` (sesión, permisos, guards), `api` (contratos + mock + http), `state` (stores con signals), `http` (interceptores), `theme`, `i18n`, `config`, `storage`, `util` |
| `shared/ui/` | Kit `ui-*`: button, input, select, textarea, checkbox, radio-group, segmented, form-field, modal (CDK Dialog), toast, tag, avatar, alert, card (+`[uiBlueprint]`), tabs, pagination, popover, skeleton, empty-state, stat-strip, page-header, icon |
| `layout/` | Shell, header, sidebar, navegación (`nav.config.ts`), diálogos de usuario y tema |
| `features/` | Una carpeta por pantalla, cargadas con `loadComponent` |

Convenciones: standalone + signals + OnPush + zoneless; `input()/output()`; aliases `@core @shared @layout @features @env`; código en inglés, textos UI en español vía `i18n`; modelos de dominio con nombres en español (reflejan backend/prototipo).

## Temas
`ThemeService` aplica variables CSS en runtime: **modo** (claro/oscuro/sistema) × **preset** (`core/theme/theme.presets.ts`: `amazonas`, `industry`) × **acento personalizado**. Todo el kit usa tokens `--color-*`. Para un nuevo preset: agregar un objeto en `theme.presets.ts` y registrarlo en `THEME_PRESETS`. Editor visual: botón de paleta en el header.

## Mocks ↔ backend real
Cada API es una clase abstracta (`core/api/*.api.ts`) con implementación mock (`api/mock`, datos en memoria con latencia simulada) y HTTP (`api/http`). `provideApis()` elige según `environment.useMocks`. **Los contratos HTTP son una propuesta**: confirmar rutas/payloads con backend. Para conectar: `useMocks: false` y `apiBaseUrl` en `src/environments/`.

## Seguridad y permisos
Sesión en `sessionStorage`; `/me` entrega capacidades. `authGuard`, `guestGuard`, `permissionGuard` (`data.option`, redirige a `/403`). Interceptores: Bearer, 401 → logout, 403/409/503 con diálogos. Menú y rutas deben mantenerse en sincronía (`nav.config.ts` ↔ `app.routes.ts`). `returnUrl` del login solo acepta rutas internas.

## Agregar una pantalla
Ver `docs/MIGRATION.md`.
