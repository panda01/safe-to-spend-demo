import type { Transaction } from '../types/transaction.mts';

/**
 * Share of the transaction history, cheapest first, that the minimum transaction amount
 * is averaged over. Expressed as a fraction rather than a percentage so it can be
 * multiplied straight into a count.
 */
const BOTTOM_SHARE_USED_FOR_MINIMUM_TRANSACTION_AMOUNT = 0.2;

/**
 * Adds up every amount in a list of transactions.
 *
 * Doubles as the suggested budget: the budget this history implies is simply everything
 * that was spent across it.
 *
 * @param transactions - Transactions to total.
 * @returns The summed dollar amount, or 0 when the list is empty.
 */
export function sumTransactionAmounts(transactions: Transaction[]): number {
  return transactions.reduce(
    (runningTotal, transaction) => runningTotal + transaction.amount,
    0,
  );
}

/**
 * Calculates the minimum transaction amount (M.T.A.): the average of the cheapest 20% of
 * the transaction history.
 *
 * This stands in for an everyday, low-end purchase — what spending looks like when it is
 * not being splashed out — which makes it a useful yardstick for how far a Safe to Spend
 * figure actually stretches.
 *
 * The 20% is rounded up, so any non-empty history contributes at least one transaction.
 *
 * @param transactions - The transaction history to inspect. Not modified.
 * @returns The mean amount of the cheapest fifth of the history, or 0 when it is empty.
 */
export function calculateMinimumTransactionAmount(transactions: Transaction[]): number {
  const thereIsNoHistoryToAverage = transactions.length === 0;

  if (thereIsNoHistoryToAverage) {
    return 0;
  }

  const transactionsFromCheapestToPriciest = [...transactions].sort(
    (firstTransaction, secondTransaction) =>
      firstTransaction.amount - secondTransaction.amount,
  );
  const howManyTransactionsToAverage = Math.ceil(
    transactions.length * BOTTOM_SHARE_USED_FOR_MINIMUM_TRANSACTION_AMOUNT,
  );
  const cheapestTransactions = transactionsFromCheapestToPriciest.slice(
    0,
    howManyTransactionsToAverage,
  );

  return sumTransactionAmounts(cheapestTransactions) / cheapestTransactions.length;
}
