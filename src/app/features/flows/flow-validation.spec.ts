import { FlowDocument, FlowResources } from '@core/api/flow.models';
import { diffFlows } from './flow-diff';
import { collectIssues, emptyCategory, emptyPolicy, validateCondition } from './flow-validation';

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

describe('validateCondition', () => {
  const base = { id: '1', type: 'condition' as const };
  it('exige variable existente, valor y al menos un extremo de rango', () => {
    expect(validateCondition({ ...base, variable: '', rule: 'FIXED' }, resources.variables).variable).toBeTruthy();
    expect(validateCondition({ ...base, variable: 'NOPE', rule: 'FIXED', value: '1' }, resources.variables).variable).toBeTruthy();
    expect(validateCondition({ ...base, variable: 'EDAD', rule: 'FIXED', value: '' }, resources.variables).value).toBeTruthy();
    expect(validateCondition({ ...base, variable: 'EDAD', rule: 'RANGE' }, resources.variables).from).toBeTruthy();
    expect(validateCondition({ ...base, variable: 'MONTO', rule: 'RANGE', from: '1', to: '2.5' }, resources.variables)).toEqual({});
  });

  it('valida formatos por tipo y orden del rango', () => {
    expect(validateCondition({ ...base, variable: 'MONTO', rule: 'FIXED', value: '10.555' }, resources.variables).value).toBeTruthy();
    expect(validateCondition({ ...base, variable: 'FECHA', rule: 'FIXED', value: '31/12/2026' }, resources.variables).value).toBeTruthy();
    expect(validateCondition({ ...base, variable: 'FECHA', rule: 'FIXED', value: '12/31/2026' }, resources.variables)).toEqual({});
    expect(validateCondition({ ...base, variable: 'EDAD', rule: 'RANGE', from: '70', to: '18' }, resources.variables).to).toBeTruthy();
  });
});

describe('collectIssues', () => {
  const withField = { ...resources, fields: [{ group: 'A', path: 'a.c', type: 'NUMBER', required: true, sensitive: false, description: '', example: '' }] as FlowResources['fields'] };

  it('acepta un flujo correcto', () => {
    expect(collectIssues(validDoc(), withField).filter((i) => i.level === 'error')).toEqual([]);
  });

  it('reporta lógica vacía, subgrupo vacío y variable sin campo declarado', () => {
    const empty = validDoc();
    empty.categories[0].policies[0].root.children = [];
    expect(collectIssues(empty, withField).some((i) => i.level === 'error' && i.target.policy === 'PA-001')).toBe(true);

    const noField = collectIssues(validDoc(), resources);
    expect(noField.some((i) => i.target.tab === 'vars')).toBe(true);
  });

  it('ordena los errores antes que los avisos', () => {
    const doc = validDoc();
    doc.categories[0].active = false;
    doc.categories[0].policies[0].root.children.push({ id: 'g', type: 'group', op: 'OR', children: [] });
    const levels = collectIssues(doc, resources).map((i) => i.level);
    expect(levels.indexOf('warning')).toBeGreaterThan(levels.lastIndexOf('error'));
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
