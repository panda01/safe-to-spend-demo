import { MERCHANT_NAMES } from '../data/merchants.mts';
import type { Transaction } from '../types/transaction.mts';

/**
 * Produces a random dollar amount inside an inclusive range, rounded to whole cents.
 *
 * @param minimumAmount - Smallest dollar amount that may be returned.
 * @param maximumAmount - Largest dollar amount that may be returned.
 * @returns A dollar amount between the two bounds, rounded to two decimal places.
 */
export function generateRandomAmount(minimumAmount: number, maximumAmount: number): number {
  const sizeOfRequestedRange = maximumAmount - minimumAmount;
  const randomAmountWithinRange = minimumAmount + Math.random() * sizeOfRequestedRange;
  const amountRoundedToWholeCents = Math.round(randomAmountWithinRange * 100) / 100;

  return amountRoundedToWholeCents;
}

/**
 * Picks one merchant name at random from the merchant pool.
 *
 * @returns A merchant display name, for example "Kroger".
 */
export function pickRandomMerchant(): string {
  const randomMerchantIndex = Math.floor(Math.random() * MERCHANT_NAMES.length);

  return MERCHANT_NAMES[randomMerchantIndex];
}

/**
 * Builds a fresh batch of fabricated transactions for the demo history table.
 *
 * Ids start at 1 and increase by one per transaction. They are handed out here and
 * never recalculated afterwards, so a later deletion leaves a visible gap rather than
 * shuffling the numbering of the surviving rows.
 *
 * @param transactionCount - How many transactions to create.
 * @param minimumAmount - Smallest dollar amount any generated transaction may have.
 * @param maximumAmount - Largest dollar amount any generated transaction may have.
 * @returns A new array of transactions with sequential ids starting at 1.
 */
export function generateTransactions(
  transactionCount: number,
  minimumAmount: number,
  maximumAmount: number,
): Transaction[] {
  const generatedTransactions: Transaction[] = [];

  for (
    let nextTransactionId = 1;
    nextTransactionId <= transactionCount;
    nextTransactionId += 1
  ) {
    generatedTransactions.push({
      id: nextTransactionId,
      merchant: pickRandomMerchant(),
      amount: generateRandomAmount(minimumAmount, maximumAmount),
    });
  }

  return generatedTransactions;
}
