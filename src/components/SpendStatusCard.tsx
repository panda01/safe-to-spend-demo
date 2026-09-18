import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { describeStatusLabel, describeStatusRule } from '../lib/spendStatus.mts';
import { SPEND_STATUS_CHIP_COLORS } from '../types/spendStatus.mts';
import type { SpendStatus } from '../types/spendStatus.mts';

/**
 * Props accepted by a single status column.
 *
 * @property title - What this way of judging the delta is called.
 * @property status - The verdict, or null when the threshold was unusable.
 * @property deltaSafeToSpend - The Delta-STS figure that was judged.
 * @property thresholdAmount - The band width the delta was judged against.
 * @property thresholdLabel - Short name for where the threshold came from, such as
 *                            "2 days" or "3×M.T.A.".
 * @property unavailableReason - What to say in place of the rule when there is no verdict.
 * @property children - Optional controls shown below the rule, such as the dial that tunes
 *                      this column's threshold.
 */
interface SpendStatusCardProps {
  title: string;
  status: SpendStatus | null;
  deltaSafeToSpend: number;
  thresholdAmount: number;
  thresholdLabel: string;
  unavailableReason: string;
  children?: ReactNode;
}

/**
 * One of the two ways of reading the same Delta-STS figure: the verdict itself, plus the
 * rule that produced it with the real numbers filled in, so a disagreement between the two
 * columns can be traced rather than just noticed.
 *
 * @param props - See {@link SpendStatusCardProps}.
 * @returns A single status column.
 */
export function SpendStatusCard({
  title,
  status,
  deltaSafeToSpend,
  thresholdAmount,
  thresholdLabel,
  unavailableReason,
  children,
}: SpendStatusCardProps) {
  const thereIsNoVerdict = status === null;

  return (
    <Box sx={{ flex: 1, textAlign: 'center' }}>
      <Typography
        variant="caption"
        color="text.secondary"
        gutterBottom
        sx={{ display: 'block' }}
      >
        {title}
      </Typography>
      <Chip
        label={describeStatusLabel(status)}
        color={thereIsNoVerdict ? 'default' : SPEND_STATUS_CHIP_COLORS[status]}
        variant={thereIsNoVerdict ? 'outlined' : 'filled'}
        sx={{ fontWeight: 600, px: 1 }}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {status === null
          ? unavailableReason
          : describeStatusRule(status, deltaSafeToSpend, thresholdAmount, thresholdLabel)}
      </Typography>
      {children}
    </Box>
  );
}
