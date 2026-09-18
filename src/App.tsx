import { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { BudgetTotals } from './components/BudgetTotals.tsx';
import { SafeToSpendPacer } from './components/SafeToSpendPacer.tsx';
import { TransactionSetupForm } from './components/TransactionSetupForm.tsx';
import { TransactionTable } from './components/TransactionTable.tsx';
import {
  calculateMinimumTransactionAmount,
  sumTransactionAmounts,
} from './lib/budgetStatistics.mts';
import { generateTransactions } from './lib/generateTransactions.mts';
import type { Transaction } from './types/transaction.mts';

/**
 * Turns a dollar amount into the text that sits in one of the editable totals fields.
 *
 * @param amount - Dollar amount to put in the field.
 * @returns The amount as plain text with two decimal places and no currency symbol,
 *          because the fields are number inputs.
 */
function formatAmountForNumberField(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Reads a dollar figure out of the raw text of an editable totals field.
 *
 * @param inputValue - Whatever the user has typed, which may be mid-edit or nonsense.
 * @returns The parsed amount, or 0 when the text is not a usable non-negative number.
 */
function readAmountFromNumberField(inputValue: string): number {
  const parsedAmount = Number.parseFloat(inputValue);
  const amountIsUsable = !Number.isNaN(parsedAmount) && parsedAmount >= 0;

  return amountIsUsable ? parsedAmount : 0;
}

/**
 * Root of the Safe to Spend demo.
 *
 * Owns the fabricated transaction history and the budget typed against it, and derives
 * everything else from those two things: the setup form replaces the history, the table
 * removes single rows from it, the totals section reads budget figures off it, and the
 * pacer spends that budget down across a period.
 *
 * @returns The whole page.
 */
export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBudgetInput, setTotalBudgetInput] = useState('0.00');
  const [minimumTransactionAmountInput, setMinimumTransactionAmountInput] =
    useState('0.00');

  const suggestedBudget = sumTransactionAmounts(transactions);
  const suggestedMinimumTransactionAmount =
    calculateMinimumTransactionAmount(transactions);

  const totalBudget = readAmountFromNumberField(totalBudgetInput);
  const minimumTransactionAmount = readAmountFromNumberField(
    minimumTransactionAmountInput,
  );

  /**
   * Replaces the current history with a freshly generated batch, and points both the
   * budget and the M.T.A. at what that new history suggests.
   *
   * Generating throws away everything that came before it, so any figures typed against
   * the old history are stale and get replaced along with it.
   *
   * @param transactionCount - How many transactions to create.
   * @param minimumAmount - Smallest dollar amount any generated transaction may have.
   * @param maximumAmount - Largest dollar amount any generated transaction may have.
   * @returns Nothing.
   */
  const handleGenerate = (
    transactionCount: number,
    minimumAmount: number,
    maximumAmount: number,
  ): void => {
    const freshTransactions = generateTransactions(
      transactionCount,
      minimumAmount,
      maximumAmount,
    );

    setTransactions(freshTransactions);
    setTotalBudgetInput(
      formatAmountForNumberField(sumTransactionAmounts(freshTransactions)),
    );
    setMinimumTransactionAmountInput(
      formatAmountForNumberField(calculateMinimumTransactionAmount(freshTransactions)),
    );
  };

  /**
   * Removes one transaction from the history, leaving every other row's id untouched.
   *
   * The budget and M.T.A. are deliberately left alone: a single deletion should not
   * quietly rewrite figures the user typed. The totals section offers to resync them
   * instead.
   *
   * @param transactionIdToDelete - Id of the transaction the user chose to remove.
   * @returns Nothing.
   */
  const handleDeleteTransaction = (transactionIdToDelete: number): void => {
    setTransactions((currentTransactions) =>
      currentTransactions.filter(
        (transaction) => transaction.id !== transactionIdToDelete,
      ),
    );
  };

  /**
   * Records an edit to the total budget field.
   *
   * @param nextTotalBudgetInput - The raw text now in the field.
   * @returns Nothing.
   */
  const handleTotalBudgetChange = (nextTotalBudgetInput: string): void => {
    setTotalBudgetInput(nextTotalBudgetInput);
  };

  /**
   * Snaps the total budget back to whatever the current history suggests.
   *
   * @returns Nothing.
   */
  const handleUseSuggestedBudget = (): void => {
    setTotalBudgetInput(formatAmountForNumberField(suggestedBudget));
  };

  /**
   * Records an edit to the M.T.A. field.
   *
   * @param nextMinimumTransactionAmountInput - The raw text now in the field.
   * @returns Nothing.
   */
  const handleMinimumTransactionAmountChange = (
    nextMinimumTransactionAmountInput: string,
  ): void => {
    setMinimumTransactionAmountInput(nextMinimumTransactionAmountInput);
  };

  /**
   * Snaps the M.T.A. back to whatever the current history suggests.
   *
   * @returns Nothing.
   */
  const handleUseSuggestedMinimumTransactionAmount = (): void => {
    setMinimumTransactionAmountInput(
      formatAmountForNumberField(suggestedMinimumTransactionAmount),
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f7f7f9' }}>
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Stack spacing={4}>
          <Stack spacing={1}>
            <Typography variant="h4" component="h1">
              Safe to Spend
            </Typography>
            <Typography color="text.secondary">
              Start by making up some transaction history to pace against.
            </Typography>
          </Stack>

          <TransactionSetupForm onGenerate={handleGenerate} />
          <TransactionTable transactions={transactions} onDelete={handleDeleteTransaction} />
          <BudgetTotals
            totalBudgetInput={totalBudgetInput}
            suggestedBudget={suggestedBudget}
            onTotalBudgetChange={handleTotalBudgetChange}
            onUseSuggestedBudget={handleUseSuggestedBudget}
            minimumTransactionAmountInput={minimumTransactionAmountInput}
            suggestedMinimumTransactionAmount={suggestedMinimumTransactionAmount}
            onMinimumTransactionAmountChange={handleMinimumTransactionAmountChange}
            onUseSuggestedMinimumTransactionAmount={
              handleUseSuggestedMinimumTransactionAmount
            }
          />
          <SafeToSpendPacer
            totalBudget={totalBudget}
            minimumTransactionAmount={minimumTransactionAmount}
          />
        </Stack>
      </Container>
    </Box>
  );
}
