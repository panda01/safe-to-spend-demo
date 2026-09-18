/**
 * Shared formatter for every dollar amount shown in the UI. Built once at module load
 * because constructing an Intl formatter per render is needlessly expensive when the
 * table can hold hundreds of rows.
 */
const usdCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

/**
 * Formatter for amounts too small to survive rounding to cents, such as the rate a modest
 * budget accrues at per minute.
 */
const smallUsdCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 4,
});

/** Anything below half a cent rounds away to $0.00 under the standard formatter. */
const SMALLEST_AMOUNT_THAT_SURVIVES_ROUNDING_TO_CENTS = 0.005;

/**
 * Formats a dollar amount for display.
 *
 * @param amount - Dollar amount to format, for example 42.07.
 * @returns The amount rendered as a US dollar string, for example "$42.07".
 */
export function formatCurrency(amount: number): string {
  return usdCurrencyFormatter.format(amount);
}

/**
 * Formats a rate, keeping enough decimal places that a very small one is still readable.
 *
 * A $100 monthly budget accrues about $0.0023 per minute, which the standard formatter
 * would flatten to a useless "$0.00". Amounts that small are shown to four decimal places
 * instead; everything else is formatted normally.
 *
 * @param amount - Dollar amount per unit of time.
 * @returns The rate as a US dollar string, for example "$3.33" or "$0.0023".
 */
export function formatRate(amount: number): string {
  const amountWouldRoundAwayToZero =
    amount !== 0 && Math.abs(amount) < SMALLEST_AMOUNT_THAT_SURVIVES_ROUNDING_TO_CENTS;

  if (amountWouldRoundAwayToZero) {
    return smallUsdCurrencyFormatter.format(amount);
  }

  return formatCurrency(amount);
}

/**
 * Formats a difference, making the direction explicit.
 *
 * Delta-STS is meaningless without its sign, and a bare "$473.90" does not say whether
 * that is headroom or overspend. Positive amounts therefore carry an explicit "+";
 * negatives already carry their own sign, and zero stays plain.
 *
 * @param amount - The difference to format.
 * @returns The amount as a signed US dollar string, for example "+$473.90" or "-$50.00".
 */
export function formatSignedCurrency(amount: number): string {
  const amountIsPositive = amount > 0;

  if (amountIsPositive) {
    return `+${formatCurrency(amount)}`;
  }

  return formatCurrency(amount);
}
