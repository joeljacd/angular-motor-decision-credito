// Modelo del flujo de decisión (borrador/versión). Un flujo = categorías → políticas → lógica (árbol Y/O de condiciones).

export type RuleKind = 'RANGE' | 'CATALOG' | 'FIXED';
export type Operator = '=' | '<>' | '>' | '>=' | '<' | '<=';
export type ActionCode = 'C' | 'E' | 'B' | 'R';

export interface Condition {
  id: string;
  type: 'condition';
  variable: string;
  rule: RuleKind;
  /** FIXED */
  operator?: Operator;
  value?: string;
  /** RANGE (cualquiera de los dos extremos puede ir vacío) */
  from?: string;
  to?: string;
  /** CATALOG */
  catalog?: string;
  mode?: 'belongs' | 'not-belongs';
}

export interface ConditionGroup {
  id: string;
  type: 'group';
  /** AND = todas deben cumplirse; OR = basta con una. */
  op: 'AND' | 'OR';
  children: LogicNode[];
}

export type LogicNode = Condition | ConditionGroup;

/** Resultado de una política en uno de los tres escenarios. */
export interface PolicyOutcome {
  action: ActionCode;
  /** 3 dígitos */
  code: string;
  message: string;
}

export interface Policy {
  /** PA-NNN[A] */
  code: string;
  name: string;
  order: number;
  active: boolean;
  root: ConditionGroup;
  results: { pass: PolicyOutcome; fail: PolicyOutcome; missing: PolicyOutcome };
}

export type StopRule = 'inherit' | 'yes' | 'no';

export interface Category {
  /** 1 a 4 dígitos */
  code: string;
  name: string;
  order: number;
  active: boolean;
  stopRule: StopRule;
  policies: Policy[];
}

/** Contenido editable de un borrador (o de una versión publicada, de solo lectura). */
export interface FlowDocument {
  /** El flujo se detiene al encontrar una acción que detiene. */
  stopOnStop: boolean;
  /** dd/MM/yyyy — informativas */
  from: string;
  to: string;
  categories: Category[];
}

export type VariableType = 'TEXT' | 'NUMBER' | 'MONEY' | 'DATE';

export interface FlowVariable {
  code: string;
  name: string;
  type: VariableType;
  sensitive: boolean;
  origin: 'request' | 'calculated';
  /** origin = request */
  path?: string;
  /** origin = calculated */
  fn?: string;
  field?: string;
}

export interface CatalogItem {
  code: string;
  label: string;
  active: boolean;
}

export interface FlowCatalog {
  code: string;
  name: string;
  items: CatalogItem[];
}

export interface RequestField {
  group: string;
  path: string;
  type: VariableType;
  required: boolean;
  format: string;
  maxLength: number | null;
  catalog: string;
  sensitive: boolean;
  description: string;
  example: string;
}

/** Recursos que viajan con el flujo y se versionan con él. */
export interface FlowResources {
  variables: FlowVariable[];
  catalogs: FlowCatalog[];
  fields: RequestField[];
}

export interface ActionDef {
  code: ActionCode;
  name: string;
  severity: number;
  stops: boolean;
  tone: 'success' | 'warning' | 'error';
}

/** Acciones que puede devolver una política (el maestro de Acciones es la fuente; esto es el mínimo del editor). */
export const FLOW_ACTIONS: Record<ActionCode, ActionDef> = {
  C: { code: 'C', name: 'COBIS', severity: 10, stops: false, tone: 'success' },
  E: { code: 'E', name: 'ECA', severity: 20, stops: false, tone: 'warning' },
  B: { code: 'B', name: 'SOLICITUD BLOQUEADA', severity: 30, stops: true, tone: 'error' },
  R: { code: 'R', name: 'RECHAZO TOTAL', severity: 40, stops: true, tone: 'error' },
};

const OPERATOR_SYMBOL: Record<Operator, string> = { '=': '=', '<>': '<>', '>': '>', '>=': '≥', '<': '<', '<=': '≤' };

/** Frase legible de una condición (se usa en el editor y en la revisión de diferencias). */
export function conditionPhrase(c: Condition): string {
  const v = c.variable || '?';
  if (c.rule === 'RANGE') {
    if (c.from && c.to) return `${v} entre ${c.from} y ${c.to}`;
    if (c.from) return `${v} ≥ ${c.from}`;
    if (c.to) return `${v} ≤ ${c.to}`;
    return `${v} (sin límites)`;
  }
  if (c.rule === 'CATALOG') return `${v} ${c.mode === 'not-belongs' ? 'no pertenece a' : 'pertenece a'} ${c.catalog || '?'}`;
  return `${v} ${OPERATOR_SYMBOL[c.operator ?? '='] ?? c.operator} ${c.value || '?'}`;
}

/** Frase legible de todo un grupo, p. ej. "EDAD entre 21 y 70 Y ( A O B )". */
export function groupPhrase(node: LogicNode, top = true): string {
  if (node.type === 'condition') return conditionPhrase(node);
  if (!node.children.length) return top ? '(grupo raíz vacío)' : '( )';
  const joiner = node.op === 'AND' ? 'Y' : 'O';
  const text = node.children.map((c) => groupPhrase(c, false)).join(` ${joiner} `);
  return top || node.children.length < 2 ? text : `( ${text} )`;
}
