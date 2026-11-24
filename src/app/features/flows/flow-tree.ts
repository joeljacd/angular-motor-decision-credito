import { Category, Condition, ConditionGroup, FlowDocument, LogicNode, Policy } from '@core/api/flow.models';

/** Resultado de buscar un nodo dentro del árbol lógico. */
export interface NodeHit {
  node: LogicNode;
  parent: ConditionGroup | null;
  index: number;
}

/** Busca un nodo por id dentro de un árbol (grupo raíz incluido). */
export function findNode(root: LogicNode, id: string, parent: ConditionGroup | null = null, index = 0): NodeHit | null {
  if (root.id === id) return { node: root, parent, index };
  if (root.type === 'group') {
    for (let i = 0; i < root.children.length; i++) {
      const hit = findNode(root.children[i], id, root, i);
      if (hit) return hit;
    }
  }
  return null;
}

/** Cuenta condiciones y subgrupos por debajo de un grupo. */
export function countNodes(group: ConditionGroup): { conditions: number; groups: number } {
  let conditions = 0;
  let groups = 0;
  for (const child of group.children) {
    if (child.type === 'condition') conditions++;
    else {
      groups++;
      const inner = countNodes(child);
      conditions += inner.conditions;
      groups += inner.groups;
    }
  }
  return { conditions, groups };
}

/** true si `id` es el propio nodo o uno de sus descendientes (evita mover un grupo dentro de sí mismo). */
export function isDescendant(node: LogicNode, id: string): boolean {
  return node.id === id || (node.type === 'group' && node.children.some((c) => isDescendant(c, id)));
}

/** "2 condiciones y 1 subgrupo" */
export function describeCount(conditions: number, groups: number): string {
  return (
    [conditions ? `${conditions} ${conditions === 1 ? 'condición' : 'condiciones'}` : '', groups ? `${groups} ${groups === 1 ? 'subgrupo' : 'subgrupos'}` : '']
      .filter(Boolean)
      .join(' y ') || 'nada'
  );
}

/** Localiza una política y su categoría. */
export function findPolicy(doc: FlowDocument, code: string): { category: Category; policy: Policy } | null {
  for (const category of doc.categories) {
    const policy = category.policies.find((p) => p.code === code);
    if (policy) return { category, policy };
  }
  return null;
}

let counter = 0;
/** Identificador único para nodos nuevos del árbol. */
export function newNodeId(): string {
  return `e${Date.now().toString(36)}${++counter}`;
}

export function newCondition(): Condition {
  return { id: newNodeId(), type: 'condition', variable: '', rule: 'FIXED', operator: '=', value: '' };
}

export function newGroup(op: 'AND' | 'OR'): ConditionGroup {
  return { id: newNodeId(), type: 'group', op, children: [] };
}

/** Devuelve la lista con el orden normalizado a 1..n según la posición actual. */
export function renumber<T extends { order: number }>(list: T[]): T[] {
  return list.map((item, i) => ({ ...item, order: i + 1 }));
}
