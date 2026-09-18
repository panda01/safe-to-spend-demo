/**
 * How a spender is doing against their pace, judged from Delta-STS.
 *
 * The four values run from most to least comfortable; both status columns in the pacer
 * pick from this same set so their verdicts can be compared directly.
 */
export type SpendStatus = 'superSafe' | 'onTrack' | 'offTrack' | 'danger';

/** What each status is called on screen. */
export const SPEND_STATUS_LABELS: Record<SpendStatus, string> = {
  superSafe: 'Super Safe',
  onTrack: 'On Track',
  offTrack: 'Off Track',
  danger: 'Danger',
};

/**
 * The MUI palette colour each status is shown in, named so it can be handed straight to a
 * Chip's `color` prop rather than hand-rolling hex values.
 */
export const SPEND_STATUS_CHIP_COLORS: Record<
  SpendStatus,
  'success' | 'info' | 'warning' | 'error'
> = {
  superSafe: 'success',
  onTrack: 'info',
  offTrack: 'warning',
  danger: 'error',
};
