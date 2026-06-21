export function getMonthUtcRange(referenceDate: Date): { start: Date; end: Date } {
  const year: number = referenceDate.getUTCFullYear();
  const month: number = referenceDate.getUTCMonth();
  const start: Date = new Date(Date.UTC(year, month, 1));
  const end: Date = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
  return { start, end };
}

export function getCurrentMonthUtcRange(referenceDate: Date = new Date()): { start: Date; end: Date } {
  return getMonthUtcRange(referenceDate);
}

export function normalizeToMonthStartUtc(referenceDate: Date = new Date()): Date {
  const { start }: { start: Date } = getMonthUtcRange(referenceDate);
  return start;
}

export function formatUtcDateKey(date: Date): string {
  const year: number = date.getUTCFullYear();
  const month: string = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day: string = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatUtcMonthKey(date: Date): string {
  const year: number = date.getUTCFullYear();
  const month: string = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getUtcDateKeysForMonth(referenceDate: Date): string[] {
  const year: number = referenceDate.getUTCFullYear();
  const month: number = referenceDate.getUTCMonth();
  const daysInMonth: number = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const monthKey: string = String(month + 1).padStart(2, '0');

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day: string = String(index + 1).padStart(2, '0');
    return `${year}-${monthKey}-${day}`;
  });
}
