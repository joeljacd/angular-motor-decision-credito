import { Directive, inject, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MastersStore } from '@core/state/masters.store';
import { ModalService } from '@shared/ui';
import { FormFieldDef, FormValues, MasterFormDialog } from './master-form-dialog';
import { MasterRequests } from './master-requests.service';
import { RequestConfirmData, RequestConfirmDialog } from './request-confirm-dialog';

export interface ChangeFormOptions {
  kicker: string;
  title: string;
  fields: FormFieldDef[];
  /** Valores iniciales (campos vacíos en altas). */
  initial: FormValues;
  /** Tipo de elemento de la solicitud: Canal, Acción… */
  type: string;
  /** null en altas. */
  existingElement: string | null;
  /** Texto del elemento a partir de los valores (se usa en altas). */
  elementOf: (values: FormValues) => string;
  validate: (values: FormValues) => Record<string, string>;
  /** Valores "actuales" mostrados en la solicitud; por defecto, los iniciales. */
  currentOverride?: Record<string, string>;
  action?: string;
}

const display = (value: string | boolean | undefined): string => (typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value ?? ''));

/** Base común de las secciones de Maestros: carga de datos, formularios y confirmaciones que terminan en una solicitud. */
@Directive()
export abstract class MasterSection implements OnInit {
  protected readonly masters = inject(MastersStore);
  protected readonly requests = inject(MasterRequests);
  protected readonly modal = inject(ModalService);

  ngOnInit(): void {
    this.masters.load();
    this.requests.load();
  }

  /** Abre el formulario de alta/edición; al enviar crea la solicitud. */
  protected openForm(o: ChangeFormOptions): void {
    const isNew = o.existingElement === null;
    this.modal.open<MasterFormDialog, boolean, unknown>(MasterFormDialog, {
      width: 'min(520px, 100%)',
      data: {
        kicker: o.kicker,
        title: o.title,
        fields: o.fields,
        values: o.initial,
        element: o.existingElement,
        validate: o.validate,
        build: (values: FormValues, comment: string) => ({
          type: o.type,
          action: o.action ?? (isNew ? 'Alta' : 'Cambio'),
          element: isNew ? o.elementOf(values) : o.existingElement!,
          current: isNew ? {} : (o.currentOverride ?? Object.fromEntries(o.fields.map((f) => [f.label, display(o.initial[f.key])]))),
          proposed: Object.fromEntries(o.fields.map((f) => [f.label, display(values[f.key])])),
          comment,
        }),
      },
    });
  }

  /** Confirma y crea una solicitud ya armada (deshabilitar, eliminar, quitar sobrescritura…). */
  protected async requestWithConfirm(
    dialog: Omit<RequestConfirmData, 'duplicateId'> & { element: string },
    change: Parameters<MasterRequests['create']>[0],
  ): Promise<void> {
    const ref = this.modal.open<RequestConfirmDialog, boolean, RequestConfirmData>(RequestConfirmDialog, {
      data: { ...dialog, duplicateId: this.requests.pendingFor(dialog.element)?.id },
    });
    if (await firstValueFrom(ref.closed, { defaultValue: false })) this.requests.create(change).subscribe();
  }

  /** Diálogo informativo: explica por qué no se puede pedir el cambio. */
  protected block(title: string, body: string, list?: string[]): void {
    this.modal.open(RequestConfirmDialog, { data: { title, body, list, blocked: true } satisfies RequestConfirmData });
  }
}
