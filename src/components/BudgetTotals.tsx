import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { formatCurrency } from '../lib/formatCurrency.mts';

/** Amounts closer together than half a cent are the same amount as far as the UI cares. */
const LARGEST_DIFFERENCE_TREATED_AS_A_MATCH = 0.005;

/**
 * Props accepted by the budget totals section.
 *
 * @property totalBudgetInput - Raw text currently in the editable total budget field.
 * @property suggestedBudget - The budget the history suggests, i.e. everything spent.
 * @property onTotalBudgetChange - Called with the new raw text when the budget is edited.
 * @property onUseSuggestedBudget - Called to snap the budget back to the suggestion.
 * @property minimumTransactionAmountInput - Raw text currently in the editable M.T.A. field.
 * @property suggestedMinimumTransactionAmount - The M.T.A. the history suggests.
 * @property onMinimumTransactionAmountChange - Called with the new raw text when the
 *                                              M.T.A. is edited.
 * @property onUseSuggestedMinimumTransactionAmount - Called to snap the M.T.A. back to the
 *                                                    suggestion.
 */
interface BudgetTotalsProps {
  totalBudgetInput: string;
  suggestedBudget: number;
  onTotalBudgetChange: (nextTotalBudgetInput: string) => void;
  onUseSuggestedBudget: () => void;
  minimumTransactionAmountInput: string;
  suggestedMinimumTransactionAmount: number;
  onMinimumTransactionAmountChange: (nextMinimumTransactionAmountInput: string) => void;
  onUseSuggestedMinimumTransactionAmount: () => void;
}

/**
 * Props accepted by one editable figure and the suggestion sitting beside it.
 *
 * @property fieldId - DOM id for the editable field, so its label can point at it.
 * @property fieldLabel - What the editable figure is called.
 * @property fieldHelperText - A short note on what the figure is used for.
 * @property inputValue - Raw text currently in the editable field.
 * @property suggestedLabel - What the read-only suggestion is called.
 * @property suggestedAmount - The suggested figure, in dollars.
 * @property suggestedCaption - A short line explaining where the suggestion came from.
 * @property useSuggestedLabel - Accessible name for the reset button.
 * @property onChange - Called with the new raw text when the field is edited.
 * @property onUseSuggested - Called when the user asks to take the suggestion.
 */
interface EditableTotalWithSuggestionProps {
  fieldId: string;
  fieldLabel: string;
  fieldHelperText: string;
  inputValue: string;
  suggestedLabel: string;
  suggestedAmount: number;
  suggestedCaption: string;
  useSuggestedLabel: string;
  onChange: (nextInputValue: string) => void;
  onUseSuggested: () => void;
}

/**
 * Pairs one editable dollar figure with the suggestion it was derived from, so the two can
 * be compared at a glance and the override undone in one click.
 *
 * @param props - See {@link EditableTotalWithSuggestionProps}.
 * @returns One editable figure beside its suggestion.
 */
function EditableTotalWithSuggestion({
  fieldId,
  fieldLabel,
  fieldHelperText,
  inputValue,
  suggestedLabel,
  suggestedAmount,
  suggestedCaption,
  useSuggestedLabel,
  onChange,
  onUseSuggested,
}: EditableTotalWithSuggestionProps) {
  const parsedAmount = Number.parseFloat(inputValue);
  const amountIsNotANumber = Number.isNaN(parsedAmount);
  const amountIsNegative = !amountIsNotANumber && parsedAmount < 0;

  let errorMessage = '';

  if (amountIsNotANumber) {
    errorMessage = 'Enter a dollar amount.';
  } else if (amountIsNegative) {
    errorMessage = 'Cannot be negative.';
  }

  const amountIsValid = errorMessage === '';
  // The field holds the suggestion rounded to cents, while the suggestion itself carries
  // the floating point drift of averaging or summing many amounts, so these two only ever
  // agree to within half a cent.
  const amountMatchesSuggestion =
    amountIsValid &&
    Math.abs(parsedAmount - suggestedAmount) < LARGEST_DIFFERENCE_TREATED_AS_A_MATCH;
  const showUseSuggestedButton = !amountMatchesSuggestion;

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={3}
      sx={{ alignItems: 'flex-start' }}
    >
      <Box sx={{ flex: 1 }}>
        <TextField
          id={fieldId}
          label={fieldLabel}
          type="number"
          value={inputValue}
          onChange={(changeEvent) => onChange(changeEvent.target.value)}
          error={!amountIsValid}
          helperText={errorMessage || fieldHelperText}
          slotProps={{ htmlInput: { min: '0', step: '0.01' } }}
          fullWidth
        />
        {showUseSuggestedButton ? (
          <Button
            size="small"
            onClick={onUseSuggested}
            aria-label={useSuggestedLabel}
            sx={{ mt: 0.5 }}
          >
            Use suggested
          </Button>
        ) : null}
      </Box>

      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {suggestedLabel}
        </Typography>
        <Typography variant="h5" sx={{ lineHeight: 1.6 }}>
          {formatCurrency(suggestedAmount)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {suggestedCaption}
        </Typography>
      </Box>
    </Stack>
  );
}

/**
 * Turns the fabricated transaction history into the budget figures the pacer runs on.
 *
 * Each figure is shown twice: what the history suggests, and what is actually in force.
 * The suggestions are read straight off the history and cannot be edited; the figures
 * beside them start as copies but are the user's to override, because trying different
 * numbers against the same history is the entire point of the pacer below.
 *
 * @param props - See {@link BudgetTotalsProps}.
 * @returns The totals section of the page.
 */
export function BudgetTotals({
  totalBudgetInput,
  suggestedBudget,
  onTotalBudgetChange,
  onUseSuggestedBudget,
  minimumTransactionAmountInput,
  suggestedMinimumTransactionAmount,
  onMinimumTransactionAmountChange,
  onUseSuggestedMinimumTransactionAmount,
}: BudgetTotalsProps) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Totals
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Each figure sits next to the suggestion it came from. The suggestions are read off
        the transaction history above; the figures on the left are yours to change.
      </Typography>

      <Stack spacing={4}>
        <EditableTotalWithSuggestion
          fieldId="total-budget"
          fieldLabel="Total budget"
          fieldHelperText="What the pacer below spends down"
          inputValue={totalBudgetInput}
          suggestedLabel="Total suggested budget"
          suggestedAmount={suggestedBudget}
          suggestedCaption="Sum of all transactions"
          useSuggestedLabel="Use suggested budget"
          onChange={onTotalBudgetChange}
          onUseSuggested={onUseSuggestedBudget}
        />

        <EditableTotalWithSuggestion
          fieldId="minimum-transaction-amount"
          fieldLabel="Actual M.T.A."
          fieldHelperText="What the M.T.A. status below is measured in"
          inputValue={minimumTransactionAmountInput}
          suggestedLabel="Suggested M.T.A."
          suggestedAmount={suggestedMinimumTransactionAmount}
          suggestedCaption="Average of the cheapest 20% of transactions"
          useSuggestedLabel="Use suggested M.T.A."
          onChange={onMinimumTransactionAmountChange}
          onUseSuggested={onUseSuggestedMinimumTransactionAmount}
        />
      </Stack>
    </Paper>
  );
}
