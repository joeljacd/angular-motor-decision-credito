import { ValidationErrors } from '@angular/forms';
import { I18nService } from '@core/i18n';

const ORDER = ['required', 'email', 'minlength', 'maxlength', 'min', 'max', 'pattern'] as const;

/**
 * Mensaje del primer error de un control. Un validador propio puede devolver `{ miError: { message: '…' } }`
 * para mostrar su texto, o `{ message: '…' }` directamente.
 */
export function validationMessage(errors: ValidationErrors | null, i18n: I18nService): string {
  if (!errors) return '';
  for (const key of ORDER) {
    if (key in errors) return i18n.t(`validation.${key}`, flatten(errors[key]));
  }
  for (const value of Object.values(errors)) {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && typeof (value as { message?: unknown }).message === 'string') {
      return (value as { message: string }).message;
    }
  }
  return i18n.t('validation.invalid');
}

function flatten(value: unknown): Record<string, string | number> {
  return value && typeof value === 'object' ? (value as Record<string, string | number>) : {};
}
