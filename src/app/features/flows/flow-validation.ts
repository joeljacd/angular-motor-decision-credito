import { Category, Condition, ConditionGroup, FlowDocument, FlowResources, LogicNode, Policy, VariableType } from '@core/api/flow.models';

export interface FlowIssue {
  /** error bloquea el envío a revisión; warning solo avisa. */
  level: 'error' | 'warning';
  where: string;
  message: string;
}

const VALUE_PATTERN: Record<VariableType, RegExp | null> = {
  TEXT: null,
  NUMBER: /^-?\d+(\.\d+)?$/,
  MONEY: /^-?\d+(\.\d{1,2})?$/,
  DATE: /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/,
};
const VALUE_HINT: Record<VariableType, string> = {
  TEXT: '',
  NUMBER: 'número',
  MONEY: 'monto con hasta 2 decimales',
  DATE: 'fecha MM/dd/yyyy',
};

/** Valida un valor según el tipo de la variable; devuelve el mensaje de error o null. */
export function validateValue(value: string | undefined, type: VariableType | undefined): string | null {
  if (!value) return null;
  const pattern = type ? VALUE_PATTERN[type] : null;
  return pattern && !pattern.test(value) ? `Debe ser ${VALUE_HINT[type!]}` : null;
}

/** Valida una condición; devuelve el mensaje de error o null. */
export function validateCondition(c: Condition, resources: FlowResources): string | null {
  const variable = resources.variables.find((v) => v.code === c.variable);
  if (!variable) return 'Elige una variable';
  if (c.rule === 'FIXED') return !c.value ? 'Falta el valor' : validateValue(c.value, variable.type);
  if (c.rule === 'CATALOG') return !c.catalog ? 'Elige un catálogo' : null;
  if (!c.from && !c.to) return 'Indica al menos un extremo';
  return validateValue(c.from, variable.type) ?? validateValue(c.to, variable.type);
}

function conditionsOf(node: LogicNode): Condition[] {
  return node.type === 'condition' ? [node] : node.children.flatMap(conditionsOf);
}

/** Valida el borrador completo; el resultado alimenta el panel de validación y bloquea el envío. */
export function validateFlow(doc: FlowDocument, resources: FlowResources): FlowIssue[] {
  const issues: FlowIssue[] = [];
  const push = (level: FlowIssue['level'], where: string, message: string) => issues.push({ level, where, message });
  const seen = new Set<string>();

  if (!doc.categories.length) push('error', 'Flujo', 'No tiene categorías');
  for (const cat of doc.categories) {
    if (!/^\d{1,4}$/.test(cat.code)) push('error', `Categoría ${cat.code}`, 'El código debe tener de 1 a 4 dígitos');
    if (seen.has(cat.code)) push('error', `Categoría ${cat.code}`, 'Código repetido');
    seen.add(cat.code);
    if (!cat.policies.length) push('warning', `Categoría ${cat.code}`, 'No tiene políticas');
    for (const pol of cat.policies) {
      const where = `${pol.code} · ${cat.code}`;
      if (!/^PA-\d{3}[A-Z]?$/.test(pol.code)) push('error', where, 'El código debe ser PA-NNN o PA-NNNA');
      if (seen.has(pol.code)) push('error', where, 'Código de política repetido');
      seen.add(pol.code);
      if (!pol.root.children.length) push('error', where, 'La lógica está vacía');
      for (const c of conditionsOf(pol.root)) {
        const message = validateCondition(c, resources);
        if (message) push('error', where, `${c.variable || 'Condición'}: ${message}`);
      }
      for (const [scenario, r] of Object.entries(pol.results)) {
        if (!/^\d{3}$/.test(r.code)) push('error', where, `Resultado «${scenario}»: código de 3 dígitos`);
        if (!r.message.trim()) push('error', where, `Resultado «${scenario}»: falta el mensaje`);
      }
    }
  }
  return issues;
}

export function emptyGroup(): ConditionGroup {
  return { id: newId(), type: 'group', op: 'AND', children: [] };
}
export function emptyCondition(variable: string): Condition {
  return { id: newId(), type: 'condition', variable, rule: 'FIXED', operator: '=', value: '' };
}
export function emptyPolicy(code: string, order: number): Policy {
  const outcome = (action: 'C' | 'E' | 'R') => ({ action, code: '', message: '' });
  return { code, name: '', order, active: true, root: emptyGroup(), results: { pass: outcome('C'), fail: outcome('R'), missing: outcome('E') } };
}
export function emptyCategory(code: string, order: number): Category {
  return { code, name: '', order, active: true, stopRule: 'inherit', policies: [] };
}
function newId(): string {
  return `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
