import { useState } from 'react';
import type { MouseEvent } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { SpendStatusCard } from './SpendStatusCard.tsx';
import {
  formatCurrency,
  formatRate,
  formatSignedCurrency,
} from '../lib/formatCurrency.mts';
import {
  calculateAccrualRates,
  calculateActualSpent,
  calculateDaysElapsed,
  calculateDeltaSafeToSpend,
  calculateSafeToSpend,
} from '../lib/safeToSpend.mts';
import {
  DEFAULT_MTA_MULTIPLIER,
  calculateLegacyTwoDayThreshold,
  calculateMtaThreshold,
  determineSpendStatus,
} from '../lib/spendStatus.mts';
import type { BudgetPeriod } from '../types/budgetPeriod.mts';
import {
  BUDGET_PERIOD_OPTIONS,
  PERIOD_LENGTHS_IN_DAYS,
} from '../types/budgetPeriod.mts';

/** Where the time slider sits before the user touches it: the very start of the period. */
const DEFAULT_PERCENT_ELAPSED = 0;

/** Where the spend slider sits before the user touches it: nothing spent yet. */
const DEFAULT_PERCENT_OF_BUDGET_SPENT = 0;

/** The period the pacer opens on. */
const DEFAULT_BUDGET_PERIOD: BudgetPeriod = 'monthly';

/** Labelled stops drawn under the time slider track. */
const TIME_SLIDER_MARKS = [
  { value: 0, label: '0%' },
  { value: 25, label: '25%' },
  { value: 50, label: '50%' },
  { value: 75, label: '75%' },
  { value: 100, label: '100%' },
];

/** Short name for the legacy threshold, shown in the status column's explanation. */
const LEGACY_THRESHOLD_LABEL = '2 days';

/** What the M.T.A. multiplier field starts at. */
const DEFAULT_MTA_MULTIPLIER_INPUT = String(DEFAULT_MTA_MULTIPLIER);

/** Told to the user when the M.T.A. column cannot reach a verdict. */
const MTA_MULTIPLIER_IS_INVALID_REASON = 'Enter a multiplier above 0';

/** Told to the user when a column has no history behind it. */
const NO_HISTORY_REASON = 'Needs transaction history';

/**
 * Props accepted by the Safe to Spend pacer.
 *
 * @property totalBudget - The budget allocated to the period, in dollars.
 * @property minimumTransactionAmount - The M.T.A., used both to express Safe to Spend as a
 *                                      number of everyday purchases and as the band width
 *                                      for the M.T.A. status. Zero when there is no
 *                                      transaction history.
 */
interface SafeToSpendPacerProps {
  totalBudget: number;
  minimumTransactionAmount: number;
}

/**
 * Renders the percentage the time slider is at as a label, for example "27%".
 *
 * @param percentElapsed - How far through the period the slider sits, from 0 to 100.
 * @returns The percentage as a display string.
 */
function formatPercentLabel(percentElapsed: number): string {
  return `${percentElapsed}%`;
}

/**
 * Describes how many M.T.A.-sized purchases a figure stretches to, in a sentence that
 * reads correctly when the answer happens to be exactly one.
 *
 * @param purchaseCount - How many purchases are covered.
 * @returns A phrase such as "1 purchase" or "6 purchases".
 */
function formatPurchaseCount(purchaseCount: number): string {
  const thereIsExactlyOnePurchase = purchaseCount === 1;

  return thereIsExactlyOnePurchase ? '1 purchase' : `${purchaseCount} purchases`;
}

/**
 * The heart of the demo: pick a budget period, say how far through it you are and how much
 * you have spent, and see whether the spending is keeping pace with what has accrued.
 *
 * The budget accrues as the period elapses, so Safe to Spend starts at zero and climbs to
 * the full budget by the end. Delta-STS is that figure minus what has actually been spent,
 * and the two status columns below read that one number against different band widths —
 * which is why they can disagree.
 *
 * Both sliders are held as percentages. The time slider is period-independent by design,
 * and the spend slider is a share of the budget so that editing the budget above cannot
 * strand it out of range.
 *
 * @param props - See {@link SafeToSpendPacerProps}.
 * @returns The pacer section of the page.
 */
export function SafeToSpendPacer({
  totalBudget,
  minimumTransactionAmount,
}: SafeToSpendPacerProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<BudgetPeriod>(DEFAULT_BUDGET_PERIOD);
  const [percentElapsed, setPercentElapsed] = useState(DEFAULT_PERCENT_ELAPSED);
  const [percentOfBudgetSpent, setPercentOfBudgetSpent] = useState(
    DEFAULT_PERCENT_OF_BUDGET_SPENT,
  );
  const [mtaMultiplierInput, setMtaMultiplierInput] = useState(
    DEFAULT_MTA_MULTIPLIER_INPUT,
  );

  const periodLengthInDays = PERIOD_LENGTHS_IN_DAYS[selectedPeriod];
  const safeToSpend = calculateSafeToSpend(totalBudget, percentElapsed);
  const actualSpent = calculateActualSpent(totalBudget, percentOfBudgetSpent);
  const deltaSafeToSpend = calculateDeltaSafeToSpend(safeToSpend, actualSpent);
  const accrualRates = calculateAccrualRates(totalBudget, periodLengthInDays);
  const daysElapsed = calculateDaysElapsed(percentElapsed, periodLengthInDays);
  const stillToAccrue = totalBudget - safeToSpend;

  const spentSliderMarks = [
    { value: 0, label: formatCurrency(0) },
    { value: 50, label: formatCurrency(calculateActualSpent(totalBudget, 50)) },
    { value: 100, label: formatCurrency(totalBudget) },
  ];

  const parsedMtaMultiplier = Number.parseFloat(mtaMultiplierInput);
  const mtaMultiplierIsValid =
    !Number.isNaN(parsedMtaMultiplier) && parsedMtaMultiplier > 0;
  const mtaMultiplier = mtaMultiplierIsValid ? parsedMtaMultiplier : 0;

  const legacyThreshold = calculateLegacyTwoDayThreshold(accrualRates.perDay);
  const mtaThreshold = calculateMtaThreshold(minimumTransactionAmount, mtaMultiplier);
  const legacyStatus = determineSpendStatus(deltaSafeToSpend, legacyThreshold);
  const mtaStatus = determineSpendStatus(deltaSafeToSpend, mtaThreshold);

  // The two columns fail for different reasons, so they say different things rather than
  // both blaming a missing transaction history.
  const mtaUnavailableReason = mtaMultiplierIsValid
    ? NO_HISTORY_REASON
    : MTA_MULTIPLIER_IS_INVALID_REASON;
  const mtaThresholdLabel = `${mtaMultiplierInput || '0'}×M.T.A.`;

  const thereIsNoMinimumTransactionAmount = minimumTransactionAmount <= 0;
  const purchasesCoveredAtMinimumTransactionAmount = thereIsNoMinimumTransactionAmount
    ? 0
    : Math.floor(safeToSpend / minimumTransactionAmount);

  /**
   * Switches the budget period, ignoring the deselect click that MUI reports as null when
   * the already-selected button is pressed again.
   *
   * @param _changeEvent - The originating mouse event, which is not needed.
   * @param nextPeriod - The newly selected period, or null when the user clicked the
   *                     button that was already active.
   * @returns Nothing.
   */
  const handlePeriodChange = (
    _changeEvent: MouseEvent<HTMLElement>,
    nextPeriod: BudgetPeriod | null,
  ): void => {
    if (nextPeriod === null) {
      return;
    }

    setSelectedPeriod(nextPeriod);
  };

  /**
   * Moves the pacer to a new position in the period.
   *
   * @param _changeEvent - The originating event, which is not needed.
   * @param nextPercentElapsed - The slider's new value, from 0 to 100.
   * @returns Nothing.
   */
  const handleTimeSliderChange = (
    _changeEvent: Event,
    nextPercentElapsed: number | number[],
  ): void => {
    const sliderReportedARange = Array.isArray(nextPercentElapsed);

    if (sliderReportedARange) {
      return;
    }

    setPercentElapsed(nextPercentElapsed);
  };

  /**
   * Changes how much of the budget has been spent.
   *
   * @param _changeEvent - The originating event, which is not needed.
   * @param nextPercentSpent - The slider's new value, from 0 to 100.
   * @returns Nothing.
   */
  const handleSpentSliderChange = (
    _changeEvent: Event,
    nextPercentSpent: number | number[],
  ): void => {
    const sliderReportedARange = Array.isArray(nextPercentSpent);

    if (sliderReportedARange) {
      return;
    }

    setPercentOfBudgetSpent(nextPercentSpent);
  };

  /**
   * Renders the spend slider's tooltip as the dollar amount it stands for, since the
   * underlying value is a percentage of the budget.
   *
   * @param percentSpent - The slider's value, from 0 to 100.
   * @returns The matching dollar amount as a display string.
   */
  const formatSpentLabel = (percentSpent: number): string =>
    formatCurrency(calculateActualSpent(totalBudget, percentSpent));

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Safe to Spend
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Your budget accrues as the period goes by. Move through the period with the first
        slider, say how much has been spent with the second, and Δ-STS is the gap between
        the two.
      </Typography>

      <Stack spacing={3}>
        <ToggleButtonGroup
          value={selectedPeriod}
          exclusive
          onChange={handlePeriodChange}
          aria-label="Budget period"
          size="small"
        >
          {BUDGET_PERIOD_OPTIONS.map((periodOption) => (
            <ToggleButton key={periodOption.value} value={periodOption.value}>
              {periodOption.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Time slider — {percentElapsed}% of the period
          </Typography>
          <Box sx={{ px: 1 }}>
            <Slider
              value={percentElapsed}
              onChange={handleTimeSliderChange}
              min={0}
              max={100}
              step={1}
              marks={TIME_SLIDER_MARKS}
              valueLabelDisplay="auto"
              valueLabelFormat={formatPercentLabel}
              aria-label="Percent through the budget period"
            />
          </Box>
        </Box>

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Actual spent slider — {formatCurrency(actualSpent)} of{' '}
            {formatCurrency(totalBudget)}
          </Typography>
          <Box sx={{ px: 1 }}>
            <Slider
              value={percentOfBudgetSpent}
              onChange={handleSpentSliderChange}
              min={0}
              max={100}
              step={1}
              marks={spentSliderMarks}
              valueLabelDisplay="auto"
              valueLabelFormat={formatSpentLabel}
              aria-label="Actual amount spent, as a share of the budget"
              color="secondary"
            />
          </Box>
        </Box>

        <Box sx={{ pt: 1 }}>
          <Stack
            direction="row"
            spacing={2}
            sx={{ justifyContent: 'center', alignItems: 'center' }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Safe to spend
              </Typography>
              <Typography variant="h4" component="p">
                {formatCurrency(safeToSpend)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              {/* An empty caption row mirrors the labelled terms either side, so centre
                  alignment puts the minus sign on the figures' line rather than above it. */}
              <Typography variant="overline" color="text.secondary">
                &nbsp;
              </Typography>
              <Typography variant="h4" component="p" color="text.secondary">
                −
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Actual spent
              </Typography>
              <Typography variant="h4" component="p">
                {formatCurrency(actualSpent)}
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="h3" component="p">
              Δ-STS = {formatSignedCurrency(deltaSafeToSpend)}
            </Typography>
          </Box>
        </Box>

        <Stack spacing={0.5} sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {percentElapsed}% of the period elapsed · {daysElapsed.toFixed(1)} of{' '}
            {periodLengthInDays} days
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Accrues at {formatRate(accrualRates.perDay)} per day ·{' '}
            {formatRate(accrualRates.perHour)} per hour ·{' '}
            {formatRate(accrualRates.perMinute)} per minute
          </Typography>
          {thereIsNoMinimumTransactionAmount ? null : (
            <Typography variant="body2" color="text.secondary">
              Covers ~{formatPurchaseCount(purchasesCoveredAtMinimumTransactionAmount)}{' '}
              at M.T.A. ({formatCurrency(minimumTransactionAmount)})
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            Still to accrue: {formatCurrency(stillToAccrue)}
          </Typography>
        </Stack>

        <Divider />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
          <SpendStatusCard
            title="Legacy 2-Day Status"
            status={legacyStatus}
            deltaSafeToSpend={deltaSafeToSpend}
            thresholdAmount={legacyThreshold}
            thresholdLabel={LEGACY_THRESHOLD_LABEL}
            unavailableReason={NO_HISTORY_REASON}
          />
          <SpendStatusCard
            title="M.T.A. Based Status"
            status={mtaStatus}
            deltaSafeToSpend={deltaSafeToSpend}
            thresholdAmount={mtaThreshold}
            thresholdLabel={mtaThresholdLabel}
            unavailableReason={mtaUnavailableReason}
          >
            <TextField
              id="mta-multiplier"
              label="M.T.A. multiplier"
              type="number"
              value={mtaMultiplierInput}
              onChange={(changeEvent) => setMtaMultiplierInput(changeEvent.target.value)}
              error={!mtaMultiplierIsValid}
              helperText={
                mtaMultiplierIsValid
                  ? 'How many M.T.A. wide each band is'
                  : 'Must be greater than 0.'
              }
              slotProps={{ htmlInput: { min: '0', step: '0.1' } }}
              size="small"
              sx={{ mt: 2, maxWidth: 220 }}
            />
          </SpendStatusCard>
        </Stack>
      </Stack>
    </Paper>
  );
}
