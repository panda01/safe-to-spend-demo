import { useState } from 'react';
import type { FormEvent } from 'react';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

/** Amount the minimum field starts at when the page first loads. */
export const DEFAULT_MINIMUM_AMOUNT_INPUT = '5';

/** Amount the maximum field starts at when the page first loads. */
export const DEFAULT_MAXIMUM_AMOUNT_INPUT = '100';

/** Number of transactions the count field starts at when the page first loads. */
export const DEFAULT_TRANSACTION_COUNT_INPUT = '100';

/**
 * One validation message per setup field. An empty string means the field is valid.
 *
 * @property minimumAmount - Why the minimum amount field is rejected, if it is.
 * @property maximumAmount - Why the maximum amount field is rejected, if it is.
 * @property transactionCount - Why the transaction count field is rejected, if it is.
 */
interface SetupFieldErrors {
  minimumAmount: string;
  maximumAmount: string;
  transactionCount: string;
}

/**
 * Props accepted by the transaction setup form.
 *
 * @property onGenerate - Called with validated values when the user submits the form.
 */
interface TransactionSetupFormProps {
  onGenerate: (
    transactionCount: number,
    minimumAmount: number,
    maximumAmount: number,
  ) => void;
}

/**
 * Checks the numbers parsed out of the setup form and explains anything wrong with them.
 *
 * @param minimumAmount - Parsed minimum dollar amount, or NaN when the field is unparseable.
 * @param maximumAmount - Parsed maximum dollar amount, or NaN when the field is unparseable.
 * @param transactionCount - Parsed transaction count, or NaN when the field is unparseable.
 * @returns A message for each field, empty where that field is acceptable.
 */
function validateSetupFields(
  minimumAmount: number,
  maximumAmount: number,
  transactionCount: number,
): SetupFieldErrors {
  const minimumAmountIsNotANumber = Number.isNaN(minimumAmount);
  const minimumAmountIsZeroOrNegative = !minimumAmountIsNotANumber && minimumAmount <= 0;

  const maximumAmountIsNotANumber = Number.isNaN(maximumAmount);
  const bothAmountsAreNumbers = !minimumAmountIsNotANumber && !maximumAmountIsNotANumber;
  const maximumAmountIsBelowMinimum = bothAmountsAreNumbers && maximumAmount < minimumAmount;

  const transactionCountIsNotANumber = Number.isNaN(transactionCount);
  const transactionCountIsBelowOne = !transactionCountIsNotANumber && transactionCount < 1;

  const fieldErrors: SetupFieldErrors = {
    minimumAmount: '',
    maximumAmount: '',
    transactionCount: '',
  };

  if (minimumAmountIsNotANumber) {
    fieldErrors.minimumAmount = 'Enter a dollar amount.';
  } else if (minimumAmountIsZeroOrNegative) {
    fieldErrors.minimumAmount = 'Must be greater than 0.';
  }

  if (maximumAmountIsNotANumber) {
    fieldErrors.maximumAmount = 'Enter a dollar amount.';
  } else if (maximumAmountIsBelowMinimum) {
    fieldErrors.maximumAmount = 'Must be at least the minimum.';
  }

  if (transactionCountIsNotANumber) {
    fieldErrors.transactionCount = 'Enter how many to make.';
  } else if (transactionCountIsBelowOne) {
    fieldErrors.transactionCount = 'Make at least 1.';
  }

  return fieldErrors;
}

/**
 * Collects the settings used to fabricate a transaction history: the dollar range each
 * random amount is drawn from, and how many transactions to make. Submitting hands the
 * validated numbers to the parent, which owns the generated list.
 *
 * @param props - See {@link TransactionSetupFormProps}.
 * @returns The setup form section of the page.
 */
export function TransactionSetupForm({ onGenerate }: TransactionSetupFormProps) {
  const [minimumAmountInput, setMinimumAmountInput] = useState(DEFAULT_MINIMUM_AMOUNT_INPUT);
  const [maximumAmountInput, setMaximumAmountInput] = useState(DEFAULT_MAXIMUM_AMOUNT_INPUT);
  const [transactionCountInput, setTransactionCountInput] = useState(
    DEFAULT_TRANSACTION_COUNT_INPUT,
  );

  const parsedMinimumAmount = Number.parseFloat(minimumAmountInput);
  const parsedMaximumAmount = Number.parseFloat(maximumAmountInput);
  const parsedTransactionCount = Number.parseInt(transactionCountInput, 10);

  const fieldErrors = validateSetupFields(
    parsedMinimumAmount,
    parsedMaximumAmount,
    parsedTransactionCount,
  );
  const formHasAnyValidationError =
    fieldErrors.minimumAmount !== '' ||
    fieldErrors.maximumAmount !== '' ||
    fieldErrors.transactionCount !== '';

  /**
   * Handles the form submit by passing the validated settings up to the parent.
   *
   * @param submitEvent - The native form submit event, whose page reload is suppressed.
   * @returns Nothing.
   */
  const handleSubmit = (submitEvent: FormEvent<HTMLFormElement>): void => {
    submitEvent.preventDefault();

    if (formHasAnyValidationError) {
      return;
    }

    onGenerate(parsedTransactionCount, parsedMinimumAmount, parsedMaximumAmount);
  };

  return (
    <Paper component="form" onSubmit={handleSubmit} variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Make a transaction history
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Each transaction gets a random merchant and a random amount inside the range below.
        Generating replaces whatever is already in the table.
      </Typography>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: 'flex-start' }}
      >
        <TextField
          id="minimum-amount"
          label="Minimum amount"
          type="number"
          value={minimumAmountInput}
          onChange={(changeEvent) => setMinimumAmountInput(changeEvent.target.value)}
          error={fieldErrors.minimumAmount !== ''}
          helperText={fieldErrors.minimumAmount || ' '}
          slotProps={{ htmlInput: { min: '0', step: '0.01' } }}
          fullWidth
        />
        <TextField
          id="maximum-amount"
          label="Maximum amount"
          type="number"
          value={maximumAmountInput}
          onChange={(changeEvent) => setMaximumAmountInput(changeEvent.target.value)}
          error={fieldErrors.maximumAmount !== ''}
          helperText={fieldErrors.maximumAmount || ' '}
          slotProps={{ htmlInput: { min: '0', step: '0.01' } }}
          fullWidth
        />
        <TextField
          id="transaction-count"
          label="Number of transactions"
          type="number"
          value={transactionCountInput}
          onChange={(changeEvent) => setTransactionCountInput(changeEvent.target.value)}
          error={fieldErrors.transactionCount !== ''}
          helperText={fieldErrors.transactionCount || ' '}
          slotProps={{ htmlInput: { min: '1', step: '1' } }}
          fullWidth
        />
      </Stack>

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={formHasAnyValidationError}
        sx={{ mt: 1 }}
      >
        Generate transactions
      </Button>
    </Paper>
  );
}
