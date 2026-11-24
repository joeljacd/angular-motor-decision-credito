/** "dd/MM/yyyy" → Date (mediodía local). null si el formato no es válido. */
export function parseDmy(value: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(value);
  return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12) : null;
}

const DAY_MS = 86_400_000;

/** Días enteros desde `today` hasta `dmy` (negativo = ya pasó). */
export function daysUntil(dmy: string, today: Date): number {
  const target = parseDmy(dmy);
  if (!target) return Number.NaN;
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  return Math.round((target.getTime() - base.getTime()) / DAY_MS);
}

const pad = (n: number, len = 2) => String(n).padStart(len, '0');

/** Date → "dd/MM/yyyy". */
export function formatDmy(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** Date → "dd/MM/yyyy HH:mm". */
export function formatDmyHm(date: Date): string {
  return `${formatDmy(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** "dd/MM/yyyy[ …]" → "yyyy-MM-dd" (comparable con <input type="date">). */
export function dmyToIso(value: string): string {
  const [d, m, y] = value.slice(0, 10).split('/');
  return `${y}-${m}-${d}`;
}
