import { Category, FlowDocument, groupPhrase, Policy, PolicyOutcome } from '@core/api/flow.models';

export type DiffKind = 'add' | 'del' | 'chg';

export interface DiffEntry {
  kind: DiffKind;
  where: string;
  /** Qué cambió, en frases cortas. */
  lines: string[];
}

const outcomeText = (o: PolicyOutcome) => `${o.action} ${o.code} «${o.message}»`;

function policyChanges(a: Policy, b: Policy): string[] {
  const lines: string[] = [];
  if (a.name !== b.name) lines.push(`Nombre: «${a.name}» → «${b.name}»`);
  if (a.active !== b.active) lines.push(`Activa: ${a.active ? 'Sí' : 'No'} → ${b.active ? 'Sí' : 'No'}`);
  if (a.order !== b.order) lines.push(`Orden: ${a.order} → ${b.order}`);
  const before = groupPhrase(a.root);
  const after = groupPhrase(b.root);
  if (before !== after) lines.push(`Lógica: ${before} → ${after}`);
  for (const [key, label] of [['pass', 'Cumple'], ['fail', 'No cumple'], ['missing', 'Datos faltantes']] as const) {
    if (outcomeText(a.results[key]) !== outcomeText(b.results[key])) lines.push(`${label}: ${outcomeText(a.results[key])} → ${outcomeText(b.results[key])}`);
  }
  return lines;
}

function categoryChanges(a: Category, b: Category): string[] {
  const lines: string[] = [];
  if (a.name !== b.name) lines.push(`Nombre: «${a.name}» → «${b.name}»`);
  if (a.active !== b.active) lines.push(`Activa: ${a.active ? 'Sí' : 'No'} → ${b.active ? 'Sí' : 'No'}`);
  if (a.stopRule !== b.stopRule) lines.push(`Regla de detención: ${a.stopRule} → ${b.stopRule}`);
  if (a.order !== b.order) lines.push(`Orden: ${a.order} → ${b.order}`);
  return lines;
}

/** Diferencias entre la versión vigente (base) y el borrador, a nivel de flujo, categoría y política. */
export function diffFlows(base: FlowDocument, draft: FlowDocument): DiffEntry[] {
  const out: DiffEntry[] = [];
  if (base.stopOnStop !== draft.stopOnStop) out.push({ kind: 'chg', where: 'Flujo', lines: [`Detener al encontrar acción que detiene: ${base.stopOnStop ? 'Sí' : 'No'} → ${draft.stopOnStop ? 'Sí' : 'No'}`] });
  if (base.from !== draft.from || base.to !== draft.to) out.push({ kind: 'chg', where: 'Flujo', lines: [`Vigencia: ${base.from}–${base.to} → ${draft.from}–${draft.to}`] });

  const baseCats = new Map(base.categories.map((c) => [c.code, c]));
  const draftCats = new Map(draft.categories.map((c) => [c.code, c]));

  for (const [code, cat] of draftCats) {
    const old = baseCats.get(code);
    if (!old) {
      out.push({ kind: 'add', where: `Categoría ${code} ${cat.name}`, lines: [`${cat.policies.length} políticas`] });
      cat.policies.forEach((p) => out.push({ kind: 'add', where: `${p.code} · ${code}`, lines: [p.name, groupPhrase(p.root)] }));
      continue;
    }
    const catLines = categoryChanges(old, cat);
    if (catLines.length) out.push({ kind: 'chg', where: `Categoría ${code} ${cat.name}`, lines: catLines });
    const oldPols = new Map(old.policies.map((p) => [p.code, p]));
    for (const p of cat.policies) {
      const before = oldPols.get(p.code);
      if (!before) out.push({ kind: 'add', where: `${p.code} · ${code}`, lines: [p.name, groupPhrase(p.root)] });
      else {
        const lines = policyChanges(before, p);
        if (lines.length) out.push({ kind: 'chg', where: `${p.code} · ${code}`, lines });
      }
    }
    for (const p of old.policies) {
      if (!cat.policies.some((x) => x.code === p.code)) out.push({ kind: 'del', where: `${p.code} · ${code}`, lines: [p.name] });
    }
  }
  for (const [code, cat] of baseCats) {
    if (!draftCats.has(code)) out.push({ kind: 'del', where: `Categoría ${code} ${cat.name}`, lines: [`${cat.policies.length} políticas`] });
  }
  return out;
}
