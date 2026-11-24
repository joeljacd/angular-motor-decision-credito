import { Profile, User } from '../../auth/auth.models';
import { ALL_OPTIONS, MASTER_KEYS } from '../../auth/permissions';
import { ChangeRequest } from '../change-requests.api';
import { FlowState } from '../workflow.api';

// Datos de demostración portados del prototipo. Reemplazables por el backend (ver api.providers.ts).

export const MOCK_PROFILES: Profile[] = [
  { id: 1, codigo: 'PRF-001', nombre: 'Administrador', desc: 'Acceso total, incluida la seguridad del portal.', estado: 'Activo', upd: '03/11/2026', opts: [...ALL_OPTIONS] },
  { id: 2, codigo: 'PRF-002', nombre: 'Aprobador', desc: 'Aprueba borradores y solicitudes; también solicita y edita.', estado: 'Activo', upd: '14/11/2026',
    opts: ['cap.solicitar', 'cap.aprobar', 'inicio', 'flujos', 'solicitudes', ...MASTER_KEYS, 'historial', 'integridad'] },
  { id: 3, codigo: 'PRF-003', nombre: 'Solicitador', desc: 'Edita borradores y crea solicitudes de cambio.', estado: 'Activo', upd: '14/11/2026',
    opts: ['cap.solicitar', 'inicio', 'flujos', 'solicitudes', ...MASTER_KEYS, 'historial'] },
  { id: 4, codigo: 'PRF-004', nombre: 'Solo consulta', desc: 'Lectura de inicio, flujos y maestros.', estado: 'Activo', upd: '02/10/2026',
    opts: ['inicio', 'flujos', ...MASTER_KEYS] },
  { id: 5, codigo: 'PRF-005', nombre: 'Auditor (heredado)', desc: 'Lectura de historial e integridad.', estado: 'Inactivo', upd: '11/05/2026',
    opts: ['historial', 'integridad'] },
];

/** Usuarios que se ofrecen en el login y en "Ver el portal como…". */
export const DEMO_USER_IDS = ['mfcevallos', 'lmora', 'aperez', 'cruiz'] as const;

const user = (usuario: string, nombre: string, perfil: number, estado: User['estado'], acceso: string, cargo = ''): User => ({
  id: usuario,
  usuario,
  nombre,
  correo: `${usuario}@bancoamazonas.ec`,
  perfil,
  estado,
  acceso,
  cargo,
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
  user('mfcevallos', 'María Fernanda Cevallos', 1, 'Activo', '22/11/2026 09:14', 'Jefe de Seguridad de la Información'),
  user('lmora', 'Luis Mora', 2, 'Activo', '22/11/2026 08:51', 'Jefe de Riesgo de Crédito'),
  user('aperez', 'Ana Pérez', 3, 'Activo', '22/11/2026 10:42', 'Analista de Políticas de Crédito'),
  user('cruiz', 'Carla Ruiz', 4, 'Activo', '21/11/2026 16:20', 'Analista de Cumplimiento'),
  ...EXTRA_NAMES.map((n, i) => {
    const p = n.split(' ');
    const inactive = INACTIVE_IDX.includes(i);
    const acceso = inactive
      ? '—'
      : `${String(21 - (i % 18)).padStart(2, '0')}/11/2026 ${String(8 + (i % 9)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`;
    return user(norm(p[0][0] + p[p.length - 1]), n, EXTRA_PROFILES[i], inactive ? 'Inactivo' : 'Activo', acceso);
  }),
];

export const MOCK_REQUESTS: ChangeRequest[] = [
  { id: 'SC-0143', tipo: 'Sellado', elemento: 'Versión 1 · 2 Agencias / 1 Auto Plan', accion: 'Sellar', solicitante: 'lmora', fecha: '21/11/2026', vence: '06/12/2026', estado: 'Pendiente',
    actual: { Sello: 'Sin sellar' }, propuesto: { Sello: 'Sellada' }, comentario: 'Versión publicada sin sello tras la migración del 18/11.' },
  { id: 'SC-0141', tipo: 'Parámetro', elemento: 'DIAS_VENCIMIENTO', accion: 'Cambio', solicitante: 'lmora', fecha: '21/11/2026', vence: '06/12/2026', estado: 'Pendiente',
    actual: { Código: 'DIAS_VENCIMIENTO', Ámbito: 'Global', Valor: '15' }, propuesto: { Código: 'DIAS_VENCIMIENTO', Ámbito: 'Global', Valor: '20' }, comentario: 'Alinear con el calendario del comité de crédito 2027.' },
  { id: 'SC-0140', tipo: 'Canal', elemento: '1 Solicitudes Web', accion: 'Cambio', solicitante: 'lmora', fecha: '12/11/2026', vence: '27/11/2026', estado: 'Pendiente',
    actual: { Código: '1', Nombre: 'Solicitudes Web', Habilitado: 'Sí' }, propuesto: { Código: '1', Nombre: 'Solicitudes Web y App', Habilitado: 'Sí' }, comentario: 'Unificar canal web y app móvil.' },
  { id: 'SC-0139', tipo: 'Acción', elemento: 'E · ECA', accion: 'Cambio', solicitante: 'lmora', fecha: '09/11/2026', vence: '24/11/2026', estado: 'Pendiente',
    actual: { Código: 'E', Nombre: 'ECA', Severidad: '20', Color: 'AMARILLO', Detiene: 'No' }, propuesto: { Código: 'E', Nombre: 'EVALUACIÓN COMITÉ', Severidad: '20', Color: 'AMARILLO', Detiene: 'No' }, comentario: 'Nombre más claro para el área comercial.' },
  { id: 'SC-0137', tipo: 'Canal–producto', elemento: '2 Agencias / 3 Microcrédito', accion: 'Habilitar', solicitante: 'lmora', fecha: '08/11/2026', vence: '23/11/2026', estado: 'Pendiente', stale: true,
    actual: { Canal: '2 Agencias', Producto: '3 Microcrédito', Habilitado: 'No' }, propuesto: { Canal: '2 Agencias', Producto: '3 Microcrédito', Habilitado: 'Sí' }, comentario: 'Piloto de microcrédito en agencias.' },
  { id: 'SC-0136', tipo: 'Rol', elemento: 'GG-CRED-CONSULTA', accion: 'Alta', solicitante: 'aperez', fecha: '16/11/2026', vence: '01/12/2026', estado: 'Pendiente',
    actual: {}, propuesto: { 'Id de rol': 'GG-CRED-CONSULTA', Nombre: 'Consulta de crédito', Solicitar: 'No', Aprobar: 'No', Auditar: 'Sí', Activo: 'Sí' }, comentario: 'Acceso de lectura para el área de cumplimiento.' },
  { id: 'SC-0133', tipo: 'Producto', elemento: '4 Tarjeta Joven', accion: 'Alta', solicitante: 'aperez', fecha: '02/11/2026', vence: '17/11/2026', estado: 'Aprobada', aprobador: 'Luis Mora',
    actual: {}, propuesto: { Código: '4', Nombre: 'Tarjeta Joven', Habilitado: 'Sí' }, comentario: '' },
  { id: 'SC-0130', tipo: 'Catálogo', elemento: 'CANTONES_ACEPTADOS', accion: 'Cambio', solicitante: 'aperez', fecha: '28/10/2026', vence: '12/11/2026', estado: 'Rechazada', aprobador: 'Luis Mora',
    rechazo: 'Falta sustento del área comercial para incluir Galápagos.', actual: { Fuente: 'Manual' }, propuesto: { Fuente: 'Servicio' }, comentario: '' },
  { id: 'SC-0128', tipo: 'Canal', elemento: '3 Banca Móvil', accion: 'Deshabilitar', solicitante: 'aperez', fecha: '20/10/2026', vence: '04/11/2026', estado: 'Cancelada',
    actual: { Habilitado: 'Sí' }, propuesto: { Habilitado: 'No' }, comentario: '' },
  { id: 'SC-0121', tipo: 'Parámetro', elemento: 'FORMATO_FECHA', accion: 'Cambio', solicitante: 'aperez', fecha: '01/10/2026', vence: '16/10/2026', estado: 'Vencida',
    actual: { Valor: 'MM/dd/yyyy' }, propuesto: { Valor: 'dd/MM/yyyy' }, comentario: '' },
];

export const MOCK_FLOW: FlowState = {
  status: 'edicion',
  devolucion: 'Revisar el umbral de ingreso de PA-006: el comité aprobó 850.00 solo para dependientes. — María Fernanda Cevallos, 21/11/2026',
  openedBy: 'Ana Pérez',
  openedId: 'aperez',
  openedAt: '20/11/2026',
  editors: ['aperez', 'lmora'],
  editorNames: 'Ana Pérez, Luis Mora',
  last: '22/11/2026 10:42',
  vence: '05/12/2026',
  sentAt: '',
};

export const MOCK_INTEGRITY_ALERTS: string[] = [
  'La versión 3 de Agencias / Consumo tiene firma inválida: el motor no evalúa este canal + producto.',
  'Sello global inválido: el motor no evalúa ningún canal.',
];
