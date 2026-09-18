const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;

/**
 * The rate a budget accrues at, expressed over three timescales.
 *
 * @property perDay - Dollars accrued per day of the period.
 * @property perHour - Dollars accrued per hour.
 * @property perMinute - Dollars accrued per minute.
 */
export interface AccrualRates {
  perDay: number;
  perHour: number;
  perMinute: number;
}

/**
 * Calculates the Safe to Spend figure for a position within a budget period.
 *
 * The budget accrues as the period elapses rather than counting down from the full
 * amount: at the top of the period nothing has accrued, halfway through half the budget
 * is available, and by the end the whole budget is. So a $100 budget read at the halfway
 * point is $50, and at a quarter of the way through it is $25.
 *
 * @param totalBudget - The whole budget allocated to the period, in dollars.
 * @param percentElapsed - How far through the period the pacer is, from 0 to 100.
 * @returns The dollar amount that is safe to spend at that point in the period.
 */
export function calculateSafeToSpend(totalBudget: number, percentElapsed: number): number {
  return (totalBudget * percentElapsed) / 100;
}

/**
 * Breaks a budget down into the rate it accrues at across a period.
 *
 * The rate is a property of the budget and the period length alone, so it holds steady
 * as the pacer slider moves.
 *
 * @param totalBudget - The whole budget allocated to the period, in dollars.
 * @param periodLengthInDays - How many days the period runs for.
 * @returns The accrual rate per day, per hour, and per minute; all zero when the period
 *          has no length, so nothing divides by zero.
 */
export function calculateAccrualRates(
  totalBudget: number,
  periodLengthInDays: number,
): AccrualRates {
  const periodHasNoLength = periodLengthInDays <= 0;

  if (periodHasNoLength) {
    return { perDay: 0, perHour: 0, perMinute: 0 };
  }

  const accruedPerDay = totalBudget / periodLengthInDays;
  const accruedPerHour = accruedPerDay / HOURS_PER_DAY;
  const accruedPerMinute = accruedPerHour / MINUTES_PER_HOUR;

  return { perDay: accruedPerDay, perHour: accruedPerHour, perMinute: accruedPerMinute };
}

/**
 * Works out how far into a period a percentage sits, in days.
 *
 * @param percentElapsed - How far through the period the pacer is, from 0 to 100.
 * @param periodLengthInDays - How many days the period runs for.
 * @returns The number of days elapsed, which is usually fractional.
 */
export function calculateDaysElapsed(
  percentElapsed: number,
  periodLengthInDays: number,
): number {
  return (periodLengthInDays * percentElapsed) / 100;
}

/**
 * Works out how much has actually been spent, from the share of the budget the spend
 * slider sits at.
 *
 * The slider holds a percentage rather than a dollar figure so that it cannot fall out of
 * range when the budget is edited above it.
 *
 * @param totalBudget - The whole budget allocated to the period, in dollars.
 * @param percentOfBudgetSpent - How much of the budget has been spent, from 0 to 100.
 * @returns The dollar amount spent.
 */
export function calculateActualSpent(
  totalBudget: number,
  percentOfBudgetSpent: number,
): number {
  return (totalBudget * percentOfBudgetSpent) / 100;
}

/**
 * Calculates Delta-STS: how much headroom is left against the accrued budget.
 *
 * The sign convention matters and is deliberate. Safe to Spend comes first, so a positive
 * result means money is still available and a negative one means the spending has run
 * ahead of what has accrued. Every status band reads off this direction.
 *
 * @param safeToSpend - What has accrued at this point in the period, in dollars.
 * @param actualSpent - What has actually been spent, in dollars.
 * @returns The difference, positive when there is headroom left.
 */
export function calculateDeltaSafeToSpend(
  safeToSpend: number,
  actualSpent: number,
): number {
  return safeToSpend - actualSpent;
}
