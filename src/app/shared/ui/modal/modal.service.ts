import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentType } from '@angular/cdk/portal';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog, ConfirmOptions } from './confirm-dialog';

export interface ModalConfig<D = unknown> {
  /** Se recibe en el diálogo con `inject(DIALOG_DATA)`. */
  data?: D;
  /** Ancho CSS. Por defecto min(460px, 100%). */
  width?: string;
  /** Bloquea cierre con Esc / clic fuera (p. ej. operaciones en curso). */
  disableClose?: boolean;
  /** Distancia desde arriba. Por defecto min(12vh, 100px). */
  top?: string;
}

/**
 * Apertura de modales (CDK Dialog: foco atrapado, Esc, restauración de foco, scroll bloqueado).
 *
 *   // 1) Confirmación
 *   if (await this.modal.confirm({ title: '¿Cancelar?', message: '…', tone: 'danger' })) { … }
 *
 *   // 2) Componente propio (usar <ui-modal-frame> como contenedor visual)
 *   const ref = this.modal.open<MiDialog, Resultado, Datos>(MiDialog, { data });
 *   const result = await firstValueFrom(ref.closed);
 *   // dentro de MiDialog:  inject(DialogRef).close(valor)  ·  inject(DIALOG_DATA)
 */
@Injectable({ providedIn: 'root' })
export class ModalService {
  private readonly dialog = inject(Dialog);
  private readonly overlay = inject(Overlay);

  open<C, R = unknown, D = unknown>(component: ComponentType<C>, config: ModalConfig<D> = {}): DialogRef<R, C> {
    return this.dialog.open<R, D, C>(component, {
      data: config.data,
      width: config.width ?? 'min(460px, 100%)',
      maxWidth: '100%',
      hasBackdrop: true,
      disableClose: config.disableClose ?? false,
      panelClass: 'ui-modal-panel',
      backdropClass: 'ui-modal-backdrop',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      positionStrategy: this.overlay.position().global().centerHorizontally().top(config.top ?? 'min(12vh, 100px)'),
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });
  }

  /** Resuelve true solo si el usuario confirma. */
  async confirm(options: ConfirmOptions): Promise<boolean> {
    const ref = this.open<ConfirmDialog, boolean, ConfirmOptions>(ConfirmDialog, { data: options });
    return (await firstValueFrom(ref.closed, { defaultValue: false })) === true;
  }

  closeAll(): void {
    this.dialog.closeAll();
  }
}
