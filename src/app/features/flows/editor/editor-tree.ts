import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Category, FlowDocument } from '@core/api/flow.models';
import { UiButton } from '@shared/ui';
import { ACTION_COLOR, DropEvent, EditorDnd, Selection } from './editor.models';

const STOP_LABEL: Record<Category['stopRule'], string> = { inherit: 'Det. heredada', yes: 'Det. propia: sí', no: 'Det. propia: no' };

/** Árbol "Estructura": categorías y políticas, con arrastrar y soltar para reordenar o mover. */
@Component({
  selector: 'app-editor-tree',
  imports: [UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './editor-tree.scss',
  template: `
    <aside class="tree">
      <div class="head">
        <span class="title">Estructura</span>
        @if (editable()) {
          <div class="head-actions">
            <button ui-button size="sm" variant="ghost" (click)="newCategory.emit()">+ Categoría</button>
            <button ui-button size="sm" variant="ghost" (click)="newPolicy.emit()">+ Política</button>
          </div>
        }
      </div>
      <div class="rows" role="tree">
        @for (cat of categories(); track cat.code) {
          <div
            class="row cat"
            role="treeitem"
            [class.selected]="isSelected('cat', cat.code)"
            [class.off]="!cat.active"
            [class.drop]="dnd.dropId() === 'cat' + cat.code"
            [attr.draggable]="editable()"
            (dragstart)="editable() && dnd.start({ kind: 'cat', key: cat.code }, $event)"
            (dragover)="editable() && dnd.over('cat', cat.code, $event)"
            (drop)="onDrop($event, 'cat', cat.code)"
            (dragend)="dnd.end()"
            (click)="picked.emit({ kind: 'cat', code: cat.code })"
          >
            @if (editable()) { <span class="grip" aria-hidden="true">⋮⋮</span> }
            <span class="ord">{{ cat.order }}</span>
            <span class="label">{{ cat.code }} · {{ cat.name }}</span>
            @if (!cat.active) { <span class="badge">Inactiva</span> }
            <span class="badge" [class.own]="cat.stopRule !== 'inherit'" title="Regla de detención">{{ stopLabel(cat) }}</span>
          </div>
          @for (pol of sortedPolicies(cat); track pol.code) {
            <div
              class="row pol"
              role="treeitem"
              [class.selected]="isSelected('pol', pol.code)"
              [class.off]="!pol.active || !cat.active"
              [class.drop]="dnd.dropId() === 'pol' + pol.code"
              [attr.draggable]="editable()"
              (dragstart)="editable() && dnd.start({ kind: 'pol', key: pol.code, category: cat.code }, $event)"
              (dragover)="editable() && dnd.over('pol', pol.code, $event)"
              (drop)="onDrop($event, 'pol', pol.code, cat.code)"
              (dragend)="dnd.end()"
              (click)="picked.emit({ kind: 'pol', code: pol.code })"
            >
              @if (editable()) { <span class="grip" aria-hidden="true">⋮⋮</span> }
              <span class="code">{{ pol.code }}</span>
              <span class="label">{{ pol.name }}</span>
              @if (!pol.active) { <span class="badge">Inactiva</span> }
              <span class="chips">
                @for (key of resultKeys; track key) {
                  <span class="chip" [style.background]="color(pol.results[key].action).bg" [style.color]="color(pol.results[key].action).fg">{{ pol.results[key].action }}</span>
                }
              </span>
            </div>
          }
          @if (editable()) {
            <div class="row add" (click)="picked.emit({ kind: 'pol', category: cat.code, isNew: true })">+ Política en {{ cat.code }}</div>
          }
        }
      </div>
      @if (editable()) { <div class="hint">Arrastra para reordenar. Soltar una política en otra categoría equivale a «Mover».</div> }
    </aside>
  `,
})
export class EditorTree {
  protected readonly dnd = inject(EditorDnd);

  readonly doc = input.required<FlowDocument>();
  readonly selection = input.required<Selection>();
  readonly editable = input(false);
  readonly picked = output<Selection>();
  readonly newCategory = output<void>();
  readonly newPolicy = output<void>();
  readonly dropped = output<DropEvent>();

  protected readonly resultKeys = ['pass', 'fail', 'missing'] as const;
  protected readonly categories = computed(() => [...this.doc().categories].sort((a, b) => a.order - b.order));

  protected sortedPolicies(cat: Category) {
    return [...cat.policies].sort((a, b) => a.order - b.order);
  }
  protected isSelected(kind: 'cat' | 'pol', code: string): boolean {
    const s = this.selection();
    return s.kind === kind && s.code === code && !s.isNew;
  }
  protected stopLabel(cat: Category): string {
    return STOP_LABEL[cat.stopRule];
  }
  protected color(action: string) {
    return ACTION_COLOR[action] ?? ACTION_COLOR['E'];
  }

  protected onDrop(event: DragEvent, kind: 'cat' | 'pol', key: string, category?: string): void {
    event.preventDefault();
    const from = this.dnd.take();
    if (from && !(from.kind === kind && from.key === key)) this.dropped.emit({ from, kind, key, category });
  }
}
