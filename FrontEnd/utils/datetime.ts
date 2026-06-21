// Small date/time formatting helpers shared by the search screen and its date picker.

/** "lun, 9 jun" — short weekday + day + month in es-CR. */
export function dateLabel(date: Date): string {
  return date.toLocaleDateString('es-CR', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** "7:05 AM" — 12-hour clock with AM/PM. */
export function timeLabel(hour: number, minute: number): string {
  const period = hour < 12 ? 'AM' : 'PM';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${String(minute).padStart(2, '0')} ${period}`;
}
