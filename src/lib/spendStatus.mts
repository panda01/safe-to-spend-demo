import { formatCurrency, formatSignedCurrency } from './formatCurrency.mts';
import { SPEND_STATUS_LABELS } from '../types/spendStatus.mts';
import type { SpendStatus } from '../types/spendStatus.mts';

/** How many days of accrual the legacy status allows either side of being exactly on pace. */
const DAYS_OF_ACCRUAL_FOR_LEGACY_THRESHOLD = 2;

/**
 * How many M.T.A.-sized purchases the M.T.A. status allows either side of being on pace
 * before the user adjusts it. The multiplier is a dial rather than a constant, because
 * finding the right value for it is part of what this demo is for.
 */
export const DEFAULT_MTA_MULTIPLIER = 3;

/**
 * The band width for the legacy status: two days of budget accrual.
 *
 * @param accruedPerDay - How much budget accrues in a day of the selected period.
 * @returns The dollar amount that separates Super Safe from On Track, and Off Track from
 *          Danger.
 */
export function calculateLegacyTwoDayThreshold(accruedPerDay: number): number {
  return accruedPerDay * DAYS_OF_ACCRUAL_FOR_LEGACY_THRESHOLD;
}

/**
 * The band width for the M.T.A. status: some number of everyday purchases.
 *
 * @param minimumTransactionAmount - The M.T.A. currently in force.
 * @param mtaMultiplier - How many M.T.A.-sized purchases wide each band should be.
 * @returns The dollar amount that separates Super Safe from On Track, and Off Track from
 *          Danger.
 */
export function calculateMtaThreshold(
  minimumTransactionAmount: number,
  mtaMultiplier: number,
): number {
  return minimumTransactionAmount * mtaMultiplier;
}

/**
 * Sorts a Delta-STS figure into one of the four statuses.
 *
 * Both status columns share this logic and differ only in the threshold they pass in,
 * which is the whole reason the two can disagree about the same delta.
 *
 * Being exactly on pace (a delta of zero) counts as On Track, and a delta sitting exactly
 * on the threshold stays On Track too: Super Safe has to clear it outright.
 *
 * @param deltaSafeToSpend - Safe to Spend minus what has actually been spent. Positive
 *                           means there is headroom left.
 * @param thresholdAmount - How far either side of zero the middle two bands reach.
 * @returns The matching status, or null when the threshold is not positive, which
 *          collapses the middle bands and would make any verdict misleading.
 */
export function determineSpendStatus(
  deltaSafeToSpend: number,
  thresholdAmount: number,
): SpendStatus | null {
  const thresholdIsUnusable = thresholdAmount <= 0;

  if (thresholdIsUnusable) {
    return null;
  }

  const thereIsMoreHeadroomThanTheThreshold = deltaSafeToSpend > thresholdAmount;
  const thereIsSomeHeadroomLeft = deltaSafeToSpend >= 0;
  const theOverspendIsWithinTheThreshold = deltaSafeToSpend >= -thresholdAmount;

  if (thereIsMoreHeadroomThanTheThreshold) {
    return 'superSafe';
  }

  if (thereIsSomeHeadroomLeft) {
    return 'onTrack';
  }

  if (theOverspendIsWithinTheThreshold) {
    return 'offTrack';
  }

  return 'danger';
}

/**
 * Spells out why a status was reached, with the real numbers substituted in, so the rule
 * that fired is legible without having to explain it aloud.
 *
 * @param status - The status that was determined.
 * @param deltaSafeToSpend - The Delta-STS figure that was judged.
 * @param thresholdAmount - The band width the delta was judged against.
 * @param thresholdLabel - Short name for where the threshold came from, such as "2 days".
 * @returns A sentence describing the comparison.
 */
export function describeStatusRule(
  status: SpendStatus,
  deltaSafeToSpend: number,
  thresholdAmount: number,
  thresholdLabel: string,
): string {
  const delta = formatSignedCurrency(deltaSafeToSpend);
  const threshold = `${thresholdLabel} (${formatCurrency(thresholdAmount)})`;

  switch (status) {
    case 'superSafe':
      return `Δ ${delta} is more than ${threshold}`;
    case 'onTrack':
      return `Δ ${delta} is between $0 and ${threshold}`;
    case 'offTrack':
      return `Δ ${delta} is between −${threshold} and $0`;
    case 'danger':
      return `Δ ${delta} is worse than −${threshold}`;
  }
}

/**
 * The display name for a status, or a dash when there is nothing to report.
 *
 * @param status - The status to name, or null when no threshold was usable.
 * @returns The label to show on the status chip.
 */
export function describeStatusLabel(status: SpendStatus | null): string {
  return status === null ? '—' : SPEND_STATUS_LABELS[status];
}
