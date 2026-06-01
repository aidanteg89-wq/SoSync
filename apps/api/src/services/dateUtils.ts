const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Returns the YYYY-MM-DD string for the next occurrence of the given day of
 * the week. If today is that day, it returns next week's date (always at
 * least 1 day in the future).
 */
export function nextDateForDay(dayOfWeek: string): string {
  const targetIdx = DAYS.indexOf(dayOfWeek.toLowerCase());
  if (targetIdx === -1) throw new Error(`Invalid dayOfWeek: ${dayOfWeek}`);

  const now = new Date();
  const currentIdx = now.getDay();
  const daysAhead = (targetIdx - currentIdx + 7) % 7 || 7;
  const target = new Date(now);
  target.setDate(now.getDate() + daysAhead);
  return target.toISOString().split('T')[0]!;
}
