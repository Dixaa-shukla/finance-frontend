import type { RecurringFrequency } from '@/types/recurring';

/**
 * Date maths for Module 9.
 */

interface Parts {
  year: number;
  month: number; // 1-based, like LocalDate
  day: number;
}

function parseISO(iso: string): Parts | null {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return null;
  return { year, month, day };
}

function toISO({ year, month, day }: Parts): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Day 0 of the next month is the last day of this one. */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Shifts by whole days through a local Date, which handles month/year rollover. */
function plusDays({ year, month, day }: Parts, days: number): Parts {
  const shifted = new Date(year, month - 1, day + days);
  return {
    year: shifted.getFullYear(),
    month: shifted.getMonth() + 1,
    day: shifted.getDate(),
  };
}

/**
 * Monthly and yearly dates are clamped like Java's LocalDate.plusMonths/plusYears,
 * so dates such as 31 Jan become 28 Feb instead of rolling into March.
 */
export function advanceISO(iso: string, frequency: RecurringFrequency): string {
  const parts = parseISO(iso);
  if (!parts) return iso;

  switch (frequency) {
    case 'DAILY':
      return toISO(plusDays(parts, 1));
    case 'WEEKLY':
      return toISO(plusDays(parts, 7));
    case 'MONTHLY': {
      const month = parts.month === 12 ? 1 : parts.month + 1;
      const year = parts.month === 12 ? parts.year + 1 : parts.year;
      return toISO({ year, month, day: Math.min(parts.day, daysInMonth(year, month)) });
    }
    case 'YEARLY': {
      const year = parts.year + 1;
      return toISO({
        year,
        month: parts.month,
        day: Math.min(parts.day, daysInMonth(year, parts.month)),
      });
    }
  }
}

/**
 * Returns the whole number of days from today to the given date.
 * Uses UTC dates to avoid DST issues when calculating the day difference.
 */
export function daysUntilISO(iso: string): number {
  const target = parseISO(iso);
  if (!target) return 0;
  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const targetUtc = Date.UTC(target.year, target.month - 1, target.day);
  return Math.round((targetUtc - todayUtc) / 86_400_000);
}

/** Guard against a DAILY rule dated years back spinning thousands of iterations. */
const OCCURRENCE_CAP = 400;

export interface OccurrenceEstimate {
  count: number;
  capped: boolean;
}

export function countOccurrencesThrough(
  fromISO: string,
  throughISO: string,
  frequency: RecurringFrequency,
  endISO: string | null
): OccurrenceEstimate {
  if (!parseISO(fromISO) || !parseISO(throughISO)) return { count: 0, capped: false };

  let cursor = fromISO;
  let active = true;
  let count = 0;

  // Plain string comparison is exact for zero-padded ISO dates.
  while (active && cursor <= throughISO) {
    count += 1;
    if (count >= OCCURRENCE_CAP) return { count, capped: true };

    const next = advanceISO(cursor, frequency);
    if (endISO !== null && next > endISO) active = false;
    cursor = next;
  }

  return { count, capped: false };
}


export const MONTHLY_FACTOR: Record<RecurringFrequency, number> = {
  DAILY: 30,
  WEEKLY: 52 / 12,
  MONTHLY: 1,
  YEARLY: 1 / 12,
};


