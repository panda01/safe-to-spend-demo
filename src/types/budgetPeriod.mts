/**
 * The budget periods the pacer can measure against.
 */
export type BudgetPeriod = 'weekly' | 'biweekly' | 'monthly';

/**
 * How long each period runs, in days.
 *
 * Monthly is a flat 30 days on purpose: this demo has no calendar and its transactions
 * carry no dates, so there is no real month to be the length of.
 */
export const PERIOD_LENGTHS_IN_DAYS: Record<BudgetPeriod, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

/**
 * The periods in the order they are offered in the selector, with the labels shown on
 * their buttons.
 */
export const BUDGET_PERIOD_OPTIONS: readonly { value: BudgetPeriod; label: string }[] =
  Object.freeze([
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Biweekly' },
    { value: 'monthly', label: 'Monthly' },
  ]);
