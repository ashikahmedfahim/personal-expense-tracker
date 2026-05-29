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
