import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CodedEntity, ActionMaster, CatalogHeader, MastersApi, MastersSnapshot, ParameterSet, RoleMapping } from '../masters.api';
import { MockBase } from './mock-apis';

const entity = (code: string, name: string, enabled: boolean, versions: number): CodedEntity => ({ code, name, enabled, versions });

const CHANNELS = [
  entity('1', 'Solicitudes Web', true, 2), entity('2', 'Agencias', true, 3), entity('3', 'Banca Móvil', true, 0),
  entity('4', 'Call Center', false, 0), entity('5', 'Corresponsales', false, 0), entity('6', 'Fuerza de ventas', true, 1),
];
const PRODUCTS = [
  entity('1', 'Auto Plan', true, 2), entity('2', 'Consumo', true, 5), entity('3', 'Microcrédito', true, 0),
  entity('4', 'Tarjeta Joven', true, 0), entity('5', 'Hipotecario', false, 0),
];
const ACTIONS: ActionMaster[] = [
  { code: 'C', name: 'COBIS', severity: 10, color: 'VERDE', stops: false, active: true },
  { code: 'E', name: 'ECA', severity: 20, color: 'AMARILLO', stops: false, active: true },
  { code: 'B', name: 'SOLICITUD BLOQUEADA', severity: 30, color: 'ROJO', stops: true, active: true },
  { code: 'R', name: 'RECHAZO TOTAL', severity: 40, color: 'ROJO', stops: true, active: true },
  { code: 'M', name: 'REVISIÓN MANUAL', severity: 50, color: 'GRIS', stops: false, active: false },
];
const CATALOGS: CatalogHeader[] = [
  { code: 'NIVELES_ESTUDIO_ACEPTADOS', name: 'Niveles de estudio aceptados', source: 'Manual', items: 5 },
  { code: 'CANTONES_ACEPTADOS', name: 'Cantones aceptados', source: 'Archivo', items: 8 },
  { code: 'ACTIVIDADES_ECONOMICAS', name: 'Actividades económicas financiables', source: 'Servicio', items: 4 },
  { code: 'PROVINCIAS_RIESGO', name: 'Provincias con riesgo elevado', source: 'Manual', items: 0 },
];
const ROLES: RoleMapping[] = [
  { code: 'GG-CRED-SOLICITANTES', name: 'Solicitantes de crédito', canRequest: true, canApprove: false, canAudit: false, active: true },
  { code: 'GG-CRED-APROBADORES', name: 'Aprobadores de configuración', canRequest: true, canApprove: true, canAudit: false, active: true },
  { code: 'GG-AUDITORIA-INTERNA', name: 'Auditoría interna', canRequest: false, canApprove: false, canAudit: true, active: true },
  { code: 'GG-CRED-ADMIN-LEGACY', name: 'Administradores (heredado)', canRequest: true, canApprove: true, canAudit: false, active: false },
];
const PARAMETERS: ParameterSet = {
  globals: [
    { code: 'FORMATO_FECHA', value: 'MM/dd/yyyy', description: 'Formato de fechas del request' },
    { code: 'DIAS_VENCIMIENTO', value: '15', description: 'Días sin actividad para vencer solicitudes y borradores' },
    { code: 'TAMANO_MAX_CONFIG', value: '1 MB', description: 'Tamaño máximo de la configuración compilada' },
    { code: 'TIMEOUT_EVALUACION_MS', value: '800', description: 'Tiempo máximo de evaluación por solicitud' },
  ],
  overrides: { '1-1': { TIMEOUT_EVALUACION_MS: '1200' }, '2-2': { FORMATO_FECHA: 'dd/MM/yyyy' } },
  combos: [
    { key: '1-1', label: '1 Solicitudes Web / 1 Auto Plan' },
    { key: '1-2', label: '1 Solicitudes Web / 2 Consumo' },
    { key: '2-1', label: '2 Agencias / 1 Auto Plan' },
    { key: '2-2', label: '2 Agencias / 2 Consumo' },
    { key: '3-2', label: '3 Banca Móvil / 2 Consumo' },
  ],
};
const MATRIX = ['1-1', '1-2', '2-1', '2-2', '3-2', '6-2'];

@Injectable()
export class MockMastersApi extends MockBase implements MastersApi {
  snapshot(): Observable<MastersSnapshot> {
    return this.respond(() => ({
      channels: CHANNELS, products: PRODUCTS, matrix: MATRIX, actions: ACTIONS, catalogs: CATALOGS, roles: ROLES, parameters: PARAMETERS,
      actionUsage: this.actionUsage(),
    }));
  }

  /** Dónde se usa cada acción en el borrador vigente (bloquea desactivar acciones en uso). */
  private actionUsage(): Record<string, string[]> {
    const usage: Record<string, string[]> = {};
    const labels = { pass: 'Cumple', fail: 'No cumple', missing: 'Falta dato' } as const;
    for (const category of this.db.flowDraft.categories) {
      for (const policy of category.policies) {
        for (const key of ['pass', 'fail', 'missing'] as const) {
          (usage[policy.results[key].action] ??= []).push(`${policy.code} (${labels[key]}) · 1 Solicitudes Web / 1 Auto Plan`);
        }
      }
    }
    return usage;
  }
}
