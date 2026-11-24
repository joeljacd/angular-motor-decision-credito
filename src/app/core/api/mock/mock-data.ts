import { Profile, User } from '../../auth/auth.models';
import { ALL_OPTIONS, MASTER_KEYS } from '../../auth/permissions';
import { ChangeRequest } from '../change-requests.api';
import { FlowState } from '../workflow.api';

// Datos de demostración portados del prototipo. Reemplazables por el backend (ver api.providers.ts).

export const MOCK_PROFILES: Profile[] = [
  { id: 1, code: 'PRF-001', name: 'Administrador', description: 'Acceso total, incluida la seguridad del portal.', status: 'active', updatedAt: '03/11/2026', opts: [...ALL_OPTIONS] },
  { id: 2, code: 'PRF-002', name: 'Aprobador', description: 'Aprueba borradores y solicitudes; también solicita y edita.', status: 'active', updatedAt: '14/11/2026',
    opts: ['cap.request', 'cap.approve', 'home', 'flows', 'requests', ...MASTER_KEYS, 'history', 'integrity'] },
  { id: 3, code: 'PRF-003', name: 'Solicitador', description: 'Edita borradores y crea solicitudes de cambio.', status: 'active', updatedAt: '14/11/2026',
    opts: ['cap.request', 'home', 'flows', 'requests', ...MASTER_KEYS, 'history'] },
  { id: 4, code: 'PRF-004', name: 'Solo consulta', description: 'Lectura de inicio, flujos y maestros.', status: 'active', updatedAt: '02/10/2026',
    opts: ['home', 'flows', ...MASTER_KEYS] },
  { id: 5, code: 'PRF-005', name: 'Auditor (heredado)', description: 'Lectura de historial e integridad.', status: 'inactive', updatedAt: '11/05/2026',
    opts: ['history', 'integrity'] },
];

/** Usuarios que se ofrecen en el login y en "Ver el portal como…". */
export const DEMO_USER_IDS = ['mfcevallos', 'lmora', 'aperez', 'cruiz'] as const;

const user = (username: string, name: string, profile: number, status: User['status'], lastAccess: string, jobTitle = ''): User => ({
  id: username,
  username,
  name,
  email: `${username}@bancoamazonas.ec`,
  profile,
  status,
  lastAccess,
  jobTitle,
});

const norm = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const EXTRA_NAMES = [
  'Juan Carlos Pérez', 'Andrea Salazar', 'Luis Miguel Torres', 'Gabriela Mora', 'Diego Andrade', 'Paola Villacís',
  'Fernando Ruiz', 'Daniela Herrera', 'Santiago Ortiz', 'Valeria Paredes', 'Christian Vega', 'Carolina Benítez',
  'Marco Jaramillo', 'Lucía Espinoza', 'Esteban Cárdenas', 'Natalia Guerrero', 'Ricardo Zambrano', 'Karla Montalvo',
];
const EXTRA_PROFILES = [3, 3, 4, 2, 3, 4, 3, 2, 4, 3, 3, 4, 2, 3, 4, 3, 5, 3];
const INACTIVE_IDX = [4, 9, 15];

export const MOCK_USERS: User[] = [
  user('mfcevallos', 'María Fernanda Cevallos', 1, 'active', '22/11/2026 09:14', 'Jefe de Seguridad de la Información'),
  user('lmora', 'Luis Mora', 2, 'active', '22/11/2026 08:51', 'Jefe de Riesgo de Crédito'),
  user('aperez', 'Ana Pérez', 3, 'active', '22/11/2026 10:42', 'Analista de Políticas de Crédito'),
  user('cruiz', 'Carla Ruiz', 4, 'active', '21/11/2026 16:20', 'Analista de Cumplimiento'),
  ...EXTRA_NAMES.map((n, i) => {
    const p = n.split(' ');
    const inactive = INACTIVE_IDX.includes(i);
    const lastAccess = inactive
      ? '—'
      : `${String(21 - (i % 18)).padStart(2, '0')}/11/2026 ${String(8 + (i % 9)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`;
    return user(norm(p[0][0] + p[p.length - 1]), n, EXTRA_PROFILES[i], inactive ? 'inactive' : 'active', lastAccess);
  }),
];

export const MOCK_REQUESTS: ChangeRequest[] = [
  { id: 'SC-0143', type: 'Sellado', element: 'Versión 1 · 2 Agencias / 1 Auto Plan', action: 'Sellar', requester: 'lmora', date: '21/11/2026', expiresAt: '06/12/2026', status: 'pending',
    current: { Sello: 'Sin sellar' }, proposed: { Sello: 'Sellada' }, comment: 'Versión publicada sin sello tras la migración del 18/11.' },
  { id: 'SC-0141', type: 'Parámetro', element: 'DIAS_VENCIMIENTO', action: 'Cambio', requester: 'lmora', date: '21/11/2026', expiresAt: '06/12/2026', status: 'pending',
    current: { Código: 'DIAS_VENCIMIENTO', Ámbito: 'Global', Valor: '15' }, proposed: { Código: 'DIAS_VENCIMIENTO', Ámbito: 'Global', Valor: '20' }, comment: 'Alinear con el calendario del comité de crédito 2027.' },
  { id: 'SC-0140', type: 'Canal', element: '1 Solicitudes Web', action: 'Cambio', requester: 'lmora', date: '12/11/2026', expiresAt: '27/11/2026', status: 'pending',
    current: { Código: '1', Nombre: 'Solicitudes Web', Habilitado: 'Sí' }, proposed: { Código: '1', Nombre: 'Solicitudes Web y App', Habilitado: 'Sí' }, comment: 'Unificar canal web y app móvil.' },
  { id: 'SC-0139', type: 'Acción', element: 'E · ECA', action: 'Cambio', requester: 'lmora', date: '09/11/2026', expiresAt: '24/11/2026', status: 'pending',
    current: { Código: 'E', Nombre: 'ECA', Severidad: '20', Color: 'AMARILLO', Detiene: 'No' }, proposed: { Código: 'E', Nombre: 'EVALUACIÓN COMITÉ', Severidad: '20', Color: 'AMARILLO', Detiene: 'No' }, comment: 'Nombre más claro para el área comercial.' },
  { id: 'SC-0137', type: 'Canal–producto', element: '2 Agencias / 3 Microcrédito', action: 'Habilitar', requester: 'lmora', date: '08/11/2026', expiresAt: '23/11/2026', status: 'pending', stale: true,
    current: { Canal: '2 Agencias', Producto: '3 Microcrédito', Habilitado: 'No' }, proposed: { Canal: '2 Agencias', Producto: '3 Microcrédito', Habilitado: 'Sí' }, comment: 'Piloto de microcrédito en agencias.' },
  { id: 'SC-0136', type: 'Rol', element: 'GG-CRED-CONSULTA', action: 'Alta', requester: 'aperez', date: '16/11/2026', expiresAt: '01/12/2026', status: 'pending',
    current: {}, proposed: { 'Id de rol': 'GG-CRED-CONSULTA', Nombre: 'Consulta de crédito', Solicitar: 'No', Aprobar: 'No', Auditar: 'Sí', Activo: 'Sí' }, comment: 'Acceso de lectura para el área de cumplimiento.' },
  { id: 'SC-0133', type: 'Producto', element: '4 Tarjeta Joven', action: 'Alta', requester: 'aperez', date: '02/11/2026', expiresAt: '17/11/2026', status: 'approved', approver: 'Luis Mora',
    current: {}, proposed: { Código: '4', Nombre: 'Tarjeta Joven', Habilitado: 'Sí' }, comment: '' },
  { id: 'SC-0130', type: 'Catálogo', element: 'CANTONES_ACEPTADOS', action: 'Cambio', requester: 'aperez', date: '28/10/2026', expiresAt: '12/11/2026', status: 'rejected', approver: 'Luis Mora',
    rejectionReason: 'Falta sustento del área comercial para incluir Galápagos.', current: { Fuente: 'Manual' }, proposed: { Fuente: 'Servicio' }, comment: '' },
  { id: 'SC-0128', type: 'Canal', element: '3 Banca Móvil', action: 'Deshabilitar', requester: 'aperez', date: '20/10/2026', expiresAt: '04/11/2026', status: 'cancelled',
    current: { Habilitado: 'Sí' }, proposed: { Habilitado: 'No' }, comment: '' },
  { id: 'SC-0121', type: 'Parámetro', element: 'FORMATO_FECHA', action: 'Cambio', requester: 'aperez', date: '01/10/2026', expiresAt: '16/10/2026', status: 'expired',
    current: { Valor: 'MM/dd/yyyy' }, proposed: { Valor: 'dd/MM/yyyy' }, comment: '' },
];

export const MOCK_FLOW: FlowState = {
  status: 'editing',
  returnComment: 'Revisar el umbral de ingreso de PA-006: el comité aprobó 850.00 solo para dependientes. — María Fernanda Cevallos, 21/11/2026',
  openedBy: 'Ana Pérez',
  openedId: 'aperez',
  openedAt: '20/11/2026',
  editors: ['aperez', 'lmora'],
  editorNames: 'Ana Pérez, Luis Mora',
  last: '22/11/2026 10:42',
  expiresAt: '05/12/2026',
  sentAt: '',
};

export const MOCK_INTEGRITY_ALERTS: string[] = [
  'La versión 3 de Agencias / Consumo tiene firma inválida: el motor no evalúa este canal + producto.',
  'Sello global inválido: el motor no evalúa ningún canal.',
];
