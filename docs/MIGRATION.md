# Migración pantalla por pantalla

Referencias del prototipo en `docs/prototype/` (marcado Angular-like con sintaxis propia: `{{ }}`, `x-if`, etc.).
`app-script.js` contiene la lógica/datos del prototipo; `screens/*.html` el markup de cada pantalla.

| Ruta | Permiso (`data.option`) | Componente actual | Referencia |
|---|---|---|---|
| `/inicio` | `inicio` | **hecho** `features/dashboard` | `inicio.html` |
| `/flows` | `flujos` | hecho | `flujos.html` |
| `/flows/editor` | `flujos` | hecho | `editor-borrador.html` |
| `/flows/review` | `flujos` | hecho | `revision.html` |
| `/requests` | `solicitudes` | hecho | `solicitudes.html` |
| `/masters/*` (5) | `m-canales`, `m-acciones`, `m-parametros`, `m-catalogos`, `m-roles` | hecho (un componente, `data.section`) | `maestros.html` (+ `maestros-sin-identificar.html`: confirmar a qué sección pertenece) |
| `/history` | `historial` | hecho | `historial.html` |
| `/integrity` | `integridad` | hecho | `integridad.html` |
| `/users` | `usuarios` | hecho | `usuarios.html` |
| `/profiles` | `perfiles` | hecho | `perfiles.html` |

## Receta para portar una pantalla
1. Crear `core/api/<x>.api.ts` (clase abstracta = token DI) + `mock/` + `http/` y registrarla en `api.providers.ts`.
2. Store con signals en `core/state/` (si el estado se comparte entre pantallas).
3. Reemplazar el placeholder en `features/<x>/` y reutilizar `shared/ui` (tablas: clases `.ui-table`; formularios: `ui-form-field` + `ui-input/select/...`; confirmaciones: `ModalService.confirm`).
4. Textos en `core/i18n/es.ts` (y `en.ts` si aplica). Nada de strings sueltos en plantillas.
5. Spec mínimo del store/servicio y del componente.


## Estado de las pantallas y decisiones

Todas las pantallas del prototipo están construidas con router (lazy), estados de carga/error y servicios mock (`environment.useMocks`, activo por defecto).

- **Contratos HTTP** (`core/api/http/*`): son una propuesta; confirmar rutas y payloads con backend antes de apagar los mocks.
- **Textos**: el código está en inglés y los textos de UI en español dentro de las plantillas (no pasan por i18n todavía).
- **Maestros**: nada se edita directo; cada cambio crea una solicitud (`MasterRequests`). Reglas: acción en uso no se desactiva, el último rol aprobador no se desactiva, parámetros con validación por código.
- **Editor de flujos**: el orden se cambia con flechas (no hay arrastrar y soltar); variables, catálogos y campos se muestran en solo lectura (el prototipo los edita solo en la combinación 1-1). La validación (`flow-validation.ts`) bloquea el envío a revisión.
- **Revisión**: control de cuatro ojos (quien editó no aprueba). Con mocks, el diálogo de aprobación permite simular conflicto (409) y error del motor.
- Matriz canal–producto y `GRIS` de acciones usan los tokens de tema existentes.
- `maestros-sin-identificar.html` del prototipo se tomó como recursos del editor; confirmar.

## Convención de idioma

Rutas, claves de permiso (`flows`, `cap.request`, `m-channels`…), estados (`editing`, `review`, `published`) e identificadores van en inglés; los comentarios, en español. Los textos visibles de la UI siguen en español (i18n `es`/`en` para el marco; las pantallas nuevas tienen el texto en la plantilla). Pendiente de confirmar: los campos de los modelos heredados del prototipo (`tipo`, `estado`, `nombre`, `perfil`…) siguen en español porque son el contrato con el backend.
