import { Category, Condition, FlowDocument, FlowResources, FlowVariable, Policy, VariableType } from '@core/api/flow.models';
import { newGroup, newNodeId } from './flow-tree';

/* ───────────── Condiciones ───────────── */

const PATTERN: Partial<Record<VariableType, RegExp>> = {
  MONEY: /^-?\d+(\.\d{1,2})?$/,
  NUMBER: /^-?\d+(\.\d+)?$/,
  DATE: /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/,
};
const FORMAT_MESSAGE: Partial<Record<VariableType, string>> = {
  MONEY: 'MONEY usa punto decimal y hasta 2 decimales (ej. 800.00)',
  NUMBER: 'Debe ser un número',
  DATE: 'Usa el formato configurado MM/dd/yyyy',
};
export const PLACEHOLDER: Record<VariableType, string> = { MONEY: '0.00', NUMBER: '0', DATE: 'MM/dd/yyyy', TEXT: 'Texto' };

export interface ConditionErrors {
  variable?: string;
  from?: string;
  to?: string;
  catalog?: string;
  value?: string;
}

function toNumber(value: string, type: VariableType): number {
  if (type !== 'DATE') return parseFloat(value);
  const [m, d, y] = value.split('/');
  return +new Date(+y, +m - 1, +d);
}

/** Valida una condición según el tipo de su variable. Devuelve un mensaje por campo inválido. */
export function validateCondition(c: Condition, variables: FlowVariable[]): ConditionErrors {
  const e: ConditionErrors = {};
  const variable = variables.find((v) => v.code === c.variable);
  const type: VariableType = variable?.type ?? 'TEXT';
  if (!c.variable) e.variable = 'Selecciona una variable';
  else if (!variable) e.variable = `La variable ${c.variable} no existe en este borrador`;

  const check = (key: 'from' | 'to' | 'value', value?: string) => {
    if (value && PATTERN[type] && !PATTERN[type]!.test(value)) e[key] = FORMAT_MESSAGE[type];
  };
  if (c.rule === 'RANGE') {
    if (!c.from && !c.to) e.from = 'Ingresa al menos «desde» o «hasta»';
    check('from', c.from);
    check('to', c.to);
    if (!e.from && !e.to && c.from && c.to && type !== 'TEXT' && toNumber(c.from, type) > toNumber(c.to, type)) e.to = '«Desde» no puede ser mayor que «Hasta»';
  }
  if (c.rule === 'CATALOG' && !c.catalog) e.catalog = 'Selecciona un catálogo';
  if (c.rule === 'FIXED') {
    if (!c.value) e.value = 'Ingresa un valor';
    else check('value', c.value);
  }
  return e;
}

/* ───────────── Validación del borrador completo ───────────── */

export type ResourceTab = 'vars' | 'fields' | 'cats';

export interface ValidationItem {
  level: 'error' | 'warning';
  message: string;
  /** Ruta legible: "Categoría 1 › PA-001A › Grupo Y › Condición 2" */
  location: string;
  /** A dónde lleva el clic: una política (y nodo) o una pestaña de recursos. */
  target: { policy?: string; node?: string; tab?: ResourceTab; catalog?: string };
}

export const RESULT_KEYS = ['pass', 'fail', 'missing'] as const;
export const RESULT_LABEL: Record<(typeof RESULT_KEYS)[number], string> = { pass: 'Cumple', fail: 'No cumple', missing: 'Falta dato' };

/** Recorre el borrador y lista errores (bloquean el envío) y advertencias. */
export function collectIssues(doc: FlowDocument, res: FlowResources): ValidationItem[] {
  const items: ValidationItem[] = [];
  const known = new Set(res.variables.map((v) => v.code));
  const used = new Set<string>();

  for (const cat of doc.categories) {
    for (const pol of cat.policies) {
      const base = `Categoría ${cat.code} › ${pol.code}`;
      if (!pol.root.children.length) items.push({ level: 'error', message: 'Política con grupo raíz vacío', location: `${base} › Grupo raíz`, target: { policy: pol.code, node: pol.root.id } });

      const walk = (group: Policy['root'], path: string) =>
        group.children.forEach((child, i) => {
          if (child.type === 'group') {
            const inner = `${path} › Grupo ${child.op === 'AND' ? 'Y' : 'O'}`;
            if (!child.children.length) items.push({ level: 'warning', message: 'Subgrupo vacío', location: base + inner, target: { policy: pol.code, node: child.id } });
            walk(child, inner);
            return;
          }
          used.add(child.variable);
          const location = `${base}${path} › Condición ${i + 1}`;
          if (!known.has(child.variable)) {
            items.push({ level: 'error', message: `Condición sobre variable inexistente (${child.variable})`, location, target: { policy: pol.code, node: child.id } });
            return;
          }
          const first = Object.values(validateCondition(child, res.variables))[0];
          if (first) items.push({ level: 'error', message: first, location, target: { policy: pol.code, node: child.id } });
        });
      walk(pol.root, ` › Grupo ${pol.root.op === 'AND' ? 'Y' : 'O'}`);

      for (const key of RESULT_KEYS) {
        if (!pol.results[key].action) items.push({ level: 'error', message: `Resultado «${RESULT_LABEL[key]}» sin acción`, location: base, target: { policy: pol.code } });
      }
      if (pol.active && !cat.active) items.push({ level: 'warning', message: 'Política en categoría inactiva', location: base, target: { policy: pol.code } });
    }
  }

  for (const v of res.variables.filter((x) => used.has(x.code))) {
    const path = v.origin === 'request' ? v.path : v.field;
    if (!res.fields.some((f) => f.path === path)) items.push({ level: 'error', message: `Variable ${v.code} sin campo del request declarado (${path})`, location: `Variables › ${v.code}`, target: { tab: 'vars' } });
  }
  for (const c of res.catalogs.filter((x) => !x.items.length)) {
    items.push({ level: 'warning', message: `Catálogo ${c.code} sin elementos`, location: `Catálogos › ${c.code}`, target: { tab: 'cats', catalog: c.code } });
  }
  return items.sort((a, b) => (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1));
}

/* ───────────── Constructores ───────────── */

export function emptyPolicy(code: string, order: number): Policy {
  return {
    code,
    name: '',
    order,
    active: true,
    root: newGroup('AND'),
    results: { pass: { action: 'C', code: '000', message: '' }, fail: { action: 'E', code: '', message: '' }, missing: { action: 'E', code: '', message: '' } },
  };
}
export function emptyCategory(code: string, order: number): Category {
  return { code, name: '', order, active: true, stopRule: 'inherit', policies: [] };
}
export { newNodeId };
