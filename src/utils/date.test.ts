import { describe, expect, it } from 'vitest';
import { getCurrentMonthUtcRange, getMonthUtcRange, normalizeToMonthStartUtc } from './date.js';

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
