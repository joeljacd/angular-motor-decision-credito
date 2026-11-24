import { Injectable, signal } from '@angular/core';

/** Elemento seleccionado en el árbol de estructura. */
export interface Selection {
  kind: 'cat' | 'pol';
  /** Código de la categoría o política existente. */
  code?: string;
  /** Categoría destino cuando se crea una política nueva. */
  category?: string;
  isNew?: boolean;
}

export type DragKind = 'cat' | 'pol' | 'node';

export interface DragItem {
  kind: DragKind;
  key: string;
  /** Categoría de origen (políticas). */
  category?: string;
}

/** Estado compartido del arrastrar y soltar dentro del editor (un solo arrastre a la vez). */
@Injectable()
export class EditorDnd {
  readonly dragging = signal<DragItem | null>(null);
  /** Identificador visual del destino resaltado: `${kind}${key}`. */
  readonly dropId = signal<string | null>(null);

  start(item: DragItem, event: DragEvent): void {
    this.dragging.set(item);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      try {
        event.dataTransfer.setData('text/plain', item.key);
      } catch {
        /* algunos navegadores no permiten setData */
      }
    }
  }

  over(kind: DragKind, key: string, event: DragEvent): void {
    if (!this.dragging()) return;
    event.preventDefault();
    const id = `${kind}${key}`;
    if (this.dropId() !== id) this.dropId.set(id);
  }

  end(): void {
    this.dragging.set(null);
    this.dropId.set(null);
  }

  /** Cierra el arrastre y devuelve lo que se arrastraba. */
  take(): DragItem | null {
    const item = this.dragging();
    this.end();
    return item;
  }
}

/** Parámetros de un soltar: qué se arrastró y sobre qué se soltó. */
export interface DropEvent {
  from: DragItem;
  kind: DragKind;
  key: string;
  /** Categoría del destino (políticas). */
  category?: string;
}

export const ACTION_COLOR: Record<string, { bg: string; fg: string }> = {
  C: { bg: 'var(--color-act-c)', fg: 'var(--color-act-c-fg)' },
  E: { bg: 'var(--color-act-e)', fg: 'var(--color-act-e-fg)' },
  B: { bg: 'var(--color-act-r)', fg: 'var(--color-act-r-fg)' },
  R: { bg: 'var(--color-act-r)', fg: 'var(--color-act-r-fg)' },
};
