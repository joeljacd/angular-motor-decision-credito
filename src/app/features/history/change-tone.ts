import { ChangeType } from '@core/api/history.api';
import { Tone } from '@core/util/tone';

/** Tono de la etiqueta según el tipo de cambio. */
export const CHANGE_TONE: Record<ChangeType, Tone> = {
  Alta: 'success', Cambio: 'warning', Baja: 'error', Apertura: 'info', Envío: 'info',
  Devolución: 'warning', Aprobación: 'success', Publicación: 'success', Descarte: 'error', Vencimiento: 'neutral',
};
