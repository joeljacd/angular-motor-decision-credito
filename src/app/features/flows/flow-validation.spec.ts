import { FlowDocument, FlowResources } from '@core/api/flow.models';
import { diffFlows } from './flow-diff';
import { emptyCategory, emptyPolicy, validateCondition, validateFlow, validateValue } from './flow-validation';

const resources: FlowResources = {
  variables: [
    { code: 'MONTO', name: 'Monto', type: 'MONEY', sensitive: false, origin: 'request', path: 'a.b' },
    { code: 'EDAD', name: 'Edad', type: 'NUMBER', sensitive: false, origin: 'request', path: 'a.c' },
    { code: 'FECHA', name: 'Fecha', type: 'DATE', sensitive: false, origin: 'request', path: 'a.d' },
  ],
  catalogs: [],
  fields: [],
};

function validDoc(): FlowDocument {
  const policy = emptyPolicy('PA-001', 1);
  policy.name = 'Edad mínima';
  policy.root.children.push({ id: 'c1', type: 'condition', variable: 'EDAD', rule: 'RANGE', from: '18', to: '70' });
  for (const r of Object.values(policy.results)) { r.code = '100'; r.message = 'ok'; }
  const cat = emptyCategory('1', 1);
  cat.name = 'Cliente';
  cat.policies.push(policy);
  return { stopOnStop: true, from: '', to: '', categories: [cat] };
}

describe('validateValue', () => {
  it('valida formatos por tipo de variable', () => {
    expect(validateValue('10.50', 'MONEY')).toBeNull();
    expect(validateValue('10.555', 'MONEY')).not.toBeNull();
    expect(validateValue('12/31/2026', 'DATE')).toBeNull();
    expect(validateValue('31/12/2026', 'DATE')).not.toBeNull();
    expect(validateValue('abc', 'NUMBER')).not.toBeNull();
    expect(validateValue('lo que sea', 'TEXT')).toBeNull();
  });
});

describe('validateCondition', () => {
  it('exige variable, valor y al menos un extremo de rango', () => {
    expect(validateCondition({ id: '1', type: 'condition', variable: '', rule: 'FIXED' }, resources)).toBe('Elige una variable');
    expect(validateCondition({ id: '1', type: 'condition', variable: 'EDAD', rule: 'FIXED', value: '' }, resources)).toBe('Falta el valor');
    expect(validateCondition({ id: '1', type: 'condition', variable: 'EDAD', rule: 'RANGE' }, resources)).toBe('Indica al menos un extremo');
    expect(validateCondition({ id: '1', type: 'condition', variable: 'MONTO', rule: 'RANGE', from: '1', to: '2.5' }, resources)).toBeNull();
  });
});

describe('validateFlow', () => {
  it('acepta un flujo correcto', () => {
    expect(validateFlow(validDoc(), resources).filter((i) => i.level === 'error')).toEqual([]);
  });

  it('reporta código de política inválido, lógica vacía y resultado incompleto', () => {
    const doc = validDoc();
    const pol = doc.categories[0].policies[0];
    pol.code = 'XX-1';
    pol.root.children = [];
    pol.results.pass.message = '';
    const messages = validateFlow(doc, resources).map((i) => i.message);
    expect(messages).toContain('El código debe ser PA-NNN o PA-NNNA');
    expect(messages).toContain('La lógica está vacía');
    expect(messages.some((m) => m.includes('falta el mensaje'))).toBe(true);
  });
});

describe('diffFlows', () => {
  it('detecta políticas agregadas, eliminadas y modificadas', () => {
    const base = validDoc();
    const draft = structuredClone(base);
    draft.categories[0].policies[0].name = 'Otro nombre';
    draft.categories[0].policies.push({ ...emptyPolicy('PA-002', 2), name: 'Nueva' });
    const entries = diffFlows(base, draft);
    expect(entries.map((e) => e.kind).sort()).toEqual(['add', 'chg']);

    const removed = diffFlows(draft, base);
    expect(removed.some((e) => e.kind === 'del' && e.where.startsWith('PA-002'))).toBe(true);
  });

  it('sin cambios no devuelve diferencias', () => {
    expect(diffFlows(validDoc(), validDoc())).toEqual([]);
  });
});
