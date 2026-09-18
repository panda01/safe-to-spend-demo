/**
 * Pool of recognizable merchant names that generated transactions are drawn from.
 *
 * Kept deliberately short and everyday so that a freshly generated table reads like
 * plausible spend history when it is shown during a live demo, rather than looking
 * like obvious filler text.
 */
export const MERCHANT_NAMES: readonly string[] = Object.freeze([
  'Starbucks',
  'Shell',
  'Kroger',
  'Amazon',
  'Chipotle',
  'Target',
  'Netflix',
  'Uber',
  'CVS Pharmacy',
  'Home Depot',
  'Spotify',
  "Trader Joe's",
]);
