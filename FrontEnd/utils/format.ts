// Shared formatting helpers used across screens.

/** Short human date, e.g. "5 jun 2026" (Costa Rica locale). */
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' });
}
