import { describe, expect, it } from 'vitest';
import { getCurrentMonthUtcRange, getMonthUtcRange, getUtcDateKeysForMonth, normalizeToMonthStartUtc, formatUtcDateKey } from './date.js';

describe('getMonthUtcRange', () => {
  it('returns the UTC start and end of the reference month', () => {
    const { start, end } = getMonthUtcRange(new Date('2024-06-15T12:00:00.000Z'));

    expect(start).toEqual(new Date('2024-06-01T00:00:00.000Z'));
    expect(end).toEqual(new Date('2024-06-30T23:59:59.999Z'));
  });
});

describe('getCurrentMonthUtcRange', () => {
  it('returns the UTC start and end of the reference month', () => {
    const { start, end } = getCurrentMonthUtcRange(new Date('2024-06-15T12:00:00.000Z'));

    expect(start).toEqual(new Date('2024-06-01T00:00:00.000Z'));
    expect(end).toEqual(new Date('2024-06-30T23:59:59.999Z'));
  });
});

describe('normalizeToMonthStartUtc', () => {
  it('returns the first day of the reference month in UTC', () => {
    const monthStart: Date = normalizeToMonthStartUtc(new Date('2024-06-15T12:00:00.000Z'));

    expect(monthStart).toEqual(new Date('2024-06-01T00:00:00.000Z'));
  });
});

describe('formatUtcDateKey', () => {
  it('formats a UTC date as YYYY-MM-DD', () => {
    expect(formatUtcDateKey(new Date('2024-06-01T10:00:00.000Z'))).toBe('2024-06-01');
    expect(formatUtcDateKey(new Date('2024-06-15T23:59:59.999Z'))).toBe('2024-06-15');
  });
});

describe('getUtcDateKeysForMonth', () => {
  it('returns every day in the reference UTC month', () => {
    const dateKeys: string[] = getUtcDateKeysForMonth(new Date('2024-06-15T12:00:00.000Z'));

    expect(dateKeys).toHaveLength(30);
    expect(dateKeys[0]).toBe('2024-06-01');
    expect(dateKeys[29]).toBe('2024-06-30');
  });
});
