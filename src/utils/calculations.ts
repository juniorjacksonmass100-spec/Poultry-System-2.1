import { BroodingPoultryType, BroodingStatus } from '../types';

/**
 * Standard Incubation Periods:
 * Hen: 21 days
 * Duck: 40 days
 */
export const HEN_INCUBATION_DAYS = 21;
export const DUCK_INCUBATION_DAYS = 40;

/**
 * Calculate expected hatch date based on poultry type
 * Safe date arithmetic avoiding timezone skew
 */
export function calculateExpectedHatchDate(
  startDateStr: string,
  type: BroodingPoultryType
): string {
  if (!startDateStr) return '';
  const daysToAdd = type === 'Hen' ? HEN_INCUBATION_DAYS : DUCK_INCUBATION_DAYS;
  const [year, month, day] = startDateStr.split('-').map(Number);
  if (!year || !month || !day) return '';

  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + daysToAdd);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format currency in Tanzanian Shillings (TZS)
 * Whole numbers, no decimals as specified: "TZS 50,000"
 */
export function formatTZS(amount: number | null | undefined): string {
  const numeric = Number(amount) || 0;
  const rounded = Math.round(numeric);
  return `TZS ${rounded.toLocaleString('en-US')}`;
}

/**
 * Format standard number with commas
 */
export function formatNumber(num: number | null | undefined): string {
  const val = Number(num) || 0;
  return Math.round(val).toLocaleString('en-US');
}

/**
 * Calculate Brooding status and friendly countdown string
 */
export function getBroodingStatusAndCountdown(
  startDateStr: string,
  expectedHatchDateStr: string,
  actualHatchDateStr?: string,
  currentHatchedCount?: number,
  manualStatus?: BroodingStatus
): { status: BroodingStatus; countdownText: string; isOverdue: boolean; daysRemaining: number } {
  if (manualStatus === 'Failed') {
    return { status: 'Failed', countdownText: 'Incubation failed', isOverdue: false, daysRemaining: 0 };
  }

  if (actualHatchDateStr || (currentHatchedCount && currentHatchedCount > 0)) {
    return { status: 'Hatched', countdownText: `Hatched on ${actualHatchDateStr || 'record'}`, isOverdue: false, daysRemaining: 0 };
  }

  if (!expectedHatchDateStr) {
    return { status: 'Not Started', countdownText: 'Pending dates', isOverdue: false, daysRemaining: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [expY, expM, expD] = expectedHatchDateStr.split('-').map(Number);
  const expectedDate = new Date(expY, expM - 1, expD);
  expectedDate.setHours(0, 0, 0, 0);

  const diffTime = expectedDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { status: 'Due Today', countdownText: 'Due today! Monitor nest/incubator', isOverdue: false, daysRemaining: 0 };
  } else if (diffDays === 1) {
    return { status: 'Due Soon', countdownText: 'Due tomorrow (1 day remaining)', isOverdue: false, daysRemaining: 1 };
  } else if (diffDays > 1 && diffDays <= 3) {
    return { status: 'Due Soon', countdownText: `${diffDays} days remaining`, isOverdue: false, daysRemaining: diffDays };
  } else if (diffDays > 3) {
    return { status: 'Active', countdownText: `${diffDays} days remaining`, isOverdue: false, daysRemaining: diffDays };
  } else {
    // diffDays < 0: Overdue
    const overdueDays = Math.abs(diffDays);
    return {
      status: 'Overdue',
      countdownText: `${overdueDays} ${overdueDays === 1 ? 'day' : 'days'} overdue!`,
      isOverdue: true,
      daysRemaining: diffDays,
    };
  }
}

/**
 * Hatch Rate formula: (Eggs Hatched / Eggs Placed) * 100
 */
export function calculateHatchRate(hatched: number, placed: number): number {
  if (!placed || placed <= 0) return 0;
  const rate = (hatched / placed) * 100;
  return Math.min(100, Math.max(0, Math.round(rate * 10) / 10));
}

/**
 * Egg Remaining formula: total - brooding - sold - consumed - damaged
 */
export function calculateEggRemaining(
  total: number,
  brooding: number,
  sold: number,
  consumed: number,
  damaged: number
): number {
  const allocated = (brooding || 0) + (sold || 0) + (consumed || 0) + (damaged || 0);
  return Math.max(0, (total || 0) - allocated);
}

/**
 * Formats ISO date string to readable format: "12 Oct 2024"
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const [y, m, d] = parts.map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
