import { Observable } from 'rxjs';

/** Canal o producto (misma forma). */
export interface CodedEntity {
  /** 1 a 4 dígitos */
  code: string;
  name: string;
  enabled: boolean;
  /** Versiones de flujo asociadas: si > 0 no se puede eliminar, solo deshabilitar. */
  versions: number;
}

export type ActionColor = 'green' | 'yellow' | 'red' | 'gray';

export interface ActionMaster {
  /** Una letra mayúscula */
  code: string;
  name: string;
  /** Única entre acciones; mayor severidad prevalece. */
  severity: number;
  color: ActionColor;
  stops: boolean;
  active: boolean;
}

export type CatalogSource = 'manual' | 'file' | 'service';

export interface CatalogHeader {
  code: string;
  name: string;
  source: CatalogSource;
  /** Elementos en la versión vigente. */
  items: number;
}

export interface RoleMapping {
  /** Id del grupo en el proveedor de identidad: GG-… */
  code: string;
  name: string;
  canRequest: boolean;
  canApprove: boolean;
  canAudit: boolean;
  active: boolean;
}

export interface Parameter {
  code: string;
  value: string;
  description: string;
}

export interface ChannelProductCombo {
  /** "canal-producto", p. ej. "1-2" */
  key: string;
  label: string;
}

export interface ParameterSet {
  globals: Parameter[];
  /** Sobrescrituras por combinación: { "1-1": { TIMEOUT_EVALUACION_MS: "1200" } } */
  overrides: Record<string, Record<string, string>>;
  combos: ChannelProductCombo[];
}

/** Estado vigente de todos los maestros. Los cambios se piden con una solicitud (ChangeRequestsApi). */
export interface MastersSnapshot {
  channels: CodedEntity[];
  products: CodedEntity[];
  /** Combinaciones canal–producto habilitadas ("1-1"…). */
  matrix: string[];
  actions: ActionMaster[];
  catalogs: CatalogHeader[];
  roles: RoleMapping[];
  parameters: ParameterSet;
  /** Dónde se usa cada acción en las políticas: { E: ["PA-002 (No cumple) · …"] } */
  actionUsage: Record<string, string[]>;
}

export abstract class MastersApi {
  /** GET /masters */
  abstract snapshot(): Observable<MastersSnapshot>;
}
