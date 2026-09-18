# AI Journal

## 2026-09-18 16:06 EDT — Make the M.T.A. adjustable and the M.T.A. multiplier tunable

**Intent.** Two of the three numbers behind the M.T.A. status were hard facts: the M.T.A.
itself was derived from history with no way to override it, and the band multiplier was a
constant in the source. Both are now dials, so different values can be tried against the
same history during a demo without editing code.

### Files changed

**`src/components/BudgetTotals.tsx`** — restructured from three columns into two rows of
paired figures, so each editable value sits beside the suggestion it came from.
- Added `interface EditableTotalWithSuggestionProps` and the
  `EditableTotalWithSuggestion({ fieldId, fieldLabel, fieldHelperText, inputValue,
  suggestedLabel, suggestedAmount, suggestedCaption, useSuggestedLabel, onChange,
  onUseSuggested })` component, which owns one editable field, its validation, its
  suggestion, and its own "Use suggested" button. Used twice.
- Removed `ReadOnlyTotal`, whose job the new component absorbed.
- `BudgetTotalsProps` grew `minimumTransactionAmountInput`,
  `suggestedMinimumTransactionAmount`, `onMinimumTransactionAmountChange`, and
  `onUseSuggestedMinimumTransactionAmount`; lost `minimumTransactionAmount`.
- The two "Use suggested" buttons carry distinct aria-labels ("Use suggested budget",
  "Use suggested M.T.A.") since there are now two of them on screen.
- `LARGEST_DIFFERENCE_TREATED_AS_A_MATCH` now guards both pairs rather than just the budget.

**`src/App.tsx`**
- Added `minimumTransactionAmountInput` state, plus
  `handleMinimumTransactionAmountChange` and `handleUseSuggestedMinimumTransactionAmount`.
- Renamed `formatAmountForBudgetField` to `formatAmountForNumberField` (it now serves two
  fields) and added `readAmountFromNumberField(inputValue)`, which replaces the inline
  parse-and-guard that was previously written out for the budget alone.
- Renamed the derived `minimumTransactionAmount` to `suggestedMinimumTransactionAmount`;
  `minimumTransactionAmount` now means the figure actually in force, read off the field.
- `handleGenerate` now pre-fills both fields from the new history.

**`src/lib/spendStatus.mts`**
- `MULTIPLES_OF_MTA_FOR_THRESHOLD` became the exported `DEFAULT_MTA_MULTIPLIER`, since it
  is now only a starting value.
- `calculateMtaThreshold(minimumTransactionAmount, mtaMultiplier)` takes the multiplier as
  a parameter.
- `describeStatusRule` no longer accepts `null` for `status`; the caller now supplies the
  reason for an absent verdict, because the two columns can fail for different reasons.

**`src/components/SpendStatusCard.tsx`**
- Added `unavailableReason` (what to say when there is no verdict) and optional `children`
  (controls rendered below the rule) to `SpendStatusCardProps`.

**`src/components/SafeToSpendPacer.tsx`**
- Added `mtaMultiplierInput` state with `DEFAULT_MTA_MULTIPLIER_INPUT`, and the derived
  `parsedMtaMultiplier`, `mtaMultiplierIsValid`, `mtaMultiplier`, `mtaThresholdLabel`,
  `mtaUnavailableReason`.
- Replaced the `MTA_THRESHOLD_LABEL` constant with the computed `mtaThresholdLabel`, so the
  rule text tracks the multiplier ("2.5×M.T.A.").
- Added `NO_HISTORY_REASON` and `MTA_MULTIPLIER_IS_INVALID_REASON`.
- The M.T.A. multiplier field renders as a child of the M.T.A. status card, putting it
  directly below that column's calculation. `step="0.1"` and float parsing allow decimals.

### Verification

`npx tsc -b` and `npm run build` pass clean. Driven end to end with Playwright:

- **Both pairs pre-fill on generate.** 100 transactions gave a budget field of `4877.22`
  against a suggested `$4,877.22`, and an M.T.A. field of `11.09` against a suggested
  `$11.09` — the latter matching an independent average of the cheapest 20 rows read from
  the table. Both "Use suggested" buttons were hidden.
- **The pairs are independent.** Editing the M.T.A. to `20` surfaced only the M.T.A.
  button, left the budget's hidden, moved the threshold to `3×M.T.A. ($60.00)` and the
  coverage line to `($20.00)`, and left the suggestion showing `$11.09`. Clicking
  "Use suggested M.T.A." restored `11.09` and hid that button while the budget kept its own.
- **The multiplier accepts decimals and is live.** At Δ-STS −$50.00 with an M.T.A. of $20:
  a multiplier of `2.5` gave a $50.00 threshold and **Off Track** (the boundary is
  inclusive), and `2` gave a $40.00 threshold and **Danger** — while the legacy column held
  at Off Track throughout.
- **An invalid multiplier says so.** Setting it to `0` marked the field invalid
  ("Must be greater than 0.") and the M.T.A. column read "Enter a multiplier above 0"
  rather than wrongly blaming a missing transaction history. The legacy column was
  unaffected and nothing read NaN.
- Zero console errors or warnings across the session.

**Dev server note.** For the second session running, stopping the background `npm run dev`
task left its `vite` child holding port 5173, and the immediate post-stop check reported
the port free before the process reappeared. Cleanup now kills by port and by process
pattern and re-checks after a delay rather than trusting a single immediate check.

### Deferred / future work

Unchanged: transactions carry no dates, so both sliders are set by hand rather than derived
from a real period and real spend.

## 2026-09-18 12:04 EDT — Add the actual-spend slider, Δ-STS, and the two status columns

**Intent.** Give the pacer its missing half. Until now it only showed what had *accrued*;
this adds what has actually been *spent*, subtracts the two to get Δ-STS, and turns that
one number into two independently-calculated verdicts that can disagree with each other.

### Three decisions worth recording

1. **Δ-STS = Safe to Spend − Actual spent**, so positive means headroom left. This is the
   **inverse of the literal phrasing** of the request ("the difference between the actual
   amount spent and the Safe to Spend number"), but it is what the status bands require:
   "Super Safe if the delta is > 2 days worth of accrual" only holds when a large positive
   delta means underspending. Confirmed with the user before building.
2. **The spend slider caps at exactly the budget.** Known consequence: at 100% time
   elapsed, Safe to Spend equals the budget and the largest reachable overspend is $0, so
   **Danger cannot be reached at the far right of the time slider**. Verified as a
   deliberate limitation rather than worked around. Raising the cap above 100% would fix it
   if it ever matters.
3. **Δ-STS was folded into the Safe to Spend headline** rather than given its own block
   below it. The formula's first term *is* the headline figure, so a separate block printed
   the same number twice.

Both sliders are held as **percentages**, not dollars. The time slider is
period-independent by design, and the spend slider is a share of the budget so that editing
the budget above cannot strand it out of range.

### Files added

**`src/types/spendStatus.mts`**
- Added `type SpendStatus` = `'superSafe' | 'onTrack' | 'offTrack' | 'danger'` (a union,
  not an enum — `erasableSyntaxOnly` is on).
- Added `SPEND_STATUS_LABELS` and `SPEND_STATUS_CHIP_COLORS` (mapping each status to a MUI
  palette name so the card can pass it straight to `Chip`).

**`src/lib/spendStatus.mts`**
- Added `DAYS_OF_ACCRUAL_FOR_LEGACY_THRESHOLD` (2) and `MULTIPLES_OF_MTA_FOR_THRESHOLD` (3).
- Added `calculateLegacyTwoDayThreshold(accruedPerDay)` and
  `calculateMtaThreshold(minimumTransactionAmount)`.
- Added `determineSpendStatus(deltaSafeToSpend, thresholdAmount)` — the shared band logic.
  `> threshold` is Super Safe, `0` to `threshold` is On Track, `−threshold` to `0` is Off
  Track, worse is Danger. Exactly zero and exactly the threshold both land On Track.
  Returns **`null` when the threshold is not positive**, because a zero threshold collapses
  the middle bands and any verdict would be misleading.
- Added `describeStatusRule(status, delta, thresholdAmount, thresholdLabel)` and
  `describeStatusLabel(status)`.

**`src/components/SpendStatusCard.tsx`**
- Added `interface SpendStatusCardProps`.
- Added `SpendStatusCard({ title, status, deltaSafeToSpend, thresholdAmount,
  thresholdLabel })` — a coloured `Chip` verdict plus the rule that fired with real numbers
  substituted in. Renders a neutral outlined "—" chip and "Needs transaction history" when
  the status is `null`.

### Files changed

**`src/lib/safeToSpend.mts`**
- Added `calculateActualSpent(totalBudget, percentOfBudgetSpent)`.
- Added `calculateDeltaSafeToSpend(safeToSpend, actualSpent)`, whose JSDoc records the sign
  convention since every status band reads off it.

**`src/lib/formatCurrency.mts`**
- Added `formatSignedCurrency(amount)` — prefixes `+` on positives so Δ-STS cannot be
  mistaken for a plain amount. Negatives keep the sign `formatCurrency` already gives them.

**`src/components/SafeToSpendPacer.tsx`** — substantially reworked.
- Added `percentOfBudgetSpent` state and `DEFAULT_PERCENT_OF_BUDGET_SPENT`.
- Renamed `SLIDER_MARKS` to `TIME_SLIDER_MARKS`; added a computed `spentSliderMarks`
  labelled in dollars.
- Added `LEGACY_THRESHOLD_LABEL` ("2 days") and `MTA_THRESHOLD_LABEL` ("3×M.T.A.").
- Renamed `handleSliderChange` to `handleTimeSliderChange`; added `handleSpentSliderChange`
  and `formatSpentLabel` (renders the spend slider's tooltip as dollars, since the value
  underneath is a percentage).
- Added derived `actualSpent`, `deltaSafeToSpend`, `legacyThreshold`, `mtaThreshold`,
  `legacyStatus`, `mtaStatus`.
- Added a `subtitle2` label above each slider — "Time slider — 50% of the period" and
  "Actual spent slider — $500.00 of $1,000.00" — so the two can no longer be confused.
- Replaced the single centred Safe to Spend figure with the combined formula readout: the
  two named terms side by side with a `−` between them, and `Δ-STS = …` beneath. The minus
  sign carries an empty caption row so centre alignment puts it on the figures' line rather
  than above them.
- Added a `Divider` and a two-column `Stack` of `SpendStatusCard`s below the supporting
  figures.

### Verification

`npx tsc -b` and `npm run build` pass clean. Driven end to end with Playwright against a
$1,000 monthly budget (legacy threshold $66.67) over 100 generated transactions
(M.T.A. $14.02, so 3×M.T.A. = $42.05). With the time slider at 50%:

| Spent | Δ-STS | Legacy 2-Day | M.T.A. Based |
|---|---|---|---|
| $0 | +$500.00 | Super Safe | Super Safe |
| $450 | +$50.00 | **On Track** | **Super Safe** |
| $500 | $0.00 | On Track | On Track |
| $550 | −$50.00 | **Off Track** | **Danger** |
| $1,000 | −$500.00 | Danger | Danger |

The two bolded rows are the columns disagreeing, which is the whole reason for showing
both. Also asserted:

- Both sliders are labelled and the labels track their values as each is dragged.
- The combined headline renders both named terms, and the Safe to Spend figure appears
  **exactly once** in the pacer card — the duplication the fold was meant to remove.
- Editing the budget from $0 to $1,000 moved the spend slider's label to
  "$0.00 of $1,000.00" without leaving it out of range.
- At 100% time and 100% spent, Δ-STS is exactly $0.00 and both columns read On Track —
  confirming Danger is unreachable there, as documented above.
- With no transactions, both columns show the neutral "—" / "Needs transaction history"
  state and nothing reads NaN.
- Zero console errors or warnings across the session.

### Deferred / future work

Unchanged from the last entry: transactions still carry no dates, so both sliders are set
by hand rather than derived from a real period and real spend. Wiring the spend slider to
the actual transaction history — rather than treating it as an independent dial — would be
the natural next step, and would need dated transactions to do properly.

## 2026-09-18 11:42 EDT — Add the Totals section and the Safe to Spend pacer

**Intent.** Turn the fabricated transaction history into budget figures, then build the
pacer that is the point of the whole demo: pick a budget period, drag through it, and
watch what is safe to spend at that moment.

### Two decisions worth recording

1. **Safe to Spend accrues rather than counting down.** The figure is
   `totalBudget × fractionElapsed`: $0 at the top of the period, the full budget by the
   end. A $100 budget reads $50 at the halfway mark and **$25 at the quarter mark** — the
   opposite of a remaining-based pacer, which would read $75 there. This was an explicit
   user choice; the original halfway example was ambiguous between the two readings.
2. **Monthly is a flat 30 days.** There is no calendar in this demo and transactions carry
   no dates, so there is no real month to take the length of. Weekly is 7, biweekly is 14.

A third, smaller one: the per-day / per-hour / per-minute figures are **accrual rates**
(budget ÷ period length), not "rate for the days left". Under the accrual model the rate
is constant across the period, so remaining-based phrasing would have been wrong.

### Files added

**`src/lib/budgetStatistics.mts`**
- Added `BOTTOM_SHARE_USED_FOR_MINIMUM_TRANSACTION_AMOUNT` (`0.2`).
- Added `sumTransactionAmounts(transactions)` — **moved here** from
  `src/components/TransactionTable.tsx`, where it was a private helper. Now one function
  serves both the table footer and the suggested budget.
- Added `calculateMinimumTransactionAmount(transactions)` — sorts a copy of the history
  cheapest first, averages the cheapest `Math.ceil(count × 0.2)`. Returns 0 on an empty
  history; the `ceil` guarantees at least one transaction otherwise.

**`src/types/budgetPeriod.mts`**
- Added `type BudgetPeriod` = `'weekly' | 'biweekly' | 'monthly'` (a union, not an enum —
  `erasableSyntaxOnly` is on).
- Added `PERIOD_LENGTHS_IN_DAYS` — 7 / 14 / 30.
- Added `BUDGET_PERIOD_OPTIONS` — the selector's buttons, in order, with their labels.

**`src/lib/safeToSpend.mts`**
- Added `HOURS_PER_DAY`, `MINUTES_PER_HOUR`.
- Added `interface AccrualRates` — `perDay`, `perHour`, `perMinute`.
- Added `calculateSafeToSpend(totalBudget, percentElapsed)`.
- Added `calculateAccrualRates(totalBudget, periodLengthInDays)` — returns all zeros when
  the period has no length, so nothing divides by zero.
- Added `calculateDaysElapsed(percentElapsed, periodLengthInDays)`.

**`src/components/BudgetTotals.tsx`**
- Added `LARGEST_DIFFERENCE_TREATED_AS_A_MATCH` (`0.005`). The budget field holds the
  suggestion rounded to cents while the suggestion itself carries the floating point drift
  of summing hundreds of amounts, so an exact `===` comparison would have left the
  "Use suggested" button permanently visible.
- Added `interface BudgetTotalsProps` and `interface ReadOnlyTotalProps`.
- Added `ReadOnlyTotal({ label, value, caption })` — one derived figure with its provenance.
- Added `BudgetTotals({ totalBudgetInput, minimumTransactionAmount, suggestedBudget,
  onTotalBudgetChange, onUseSuggestedBudget })` — editable total budget beside read-only
  M.T.A. and suggested budget, plus a "Use suggested" button that appears only when the
  typed budget has drifted from the suggestion.

**`src/components/SafeToSpendPacer.tsx`**
- Added `DEFAULT_PERCENT_ELAPSED` (0), `DEFAULT_BUDGET_PERIOD` (`'monthly'`),
  `SLIDER_MARKS` (0/25/50/75/100).
- Added `interface SafeToSpendPacerProps`.
- Added `formatPercentLabel(percentElapsed)` and `formatPurchaseCount(purchaseCount)`
  (the latter so a count of one reads "1 purchase", not "1 purchases").
- Added `SafeToSpendPacer({ totalBudget, minimumTransactionAmount })` — period toggle,
  percentage slider, headline figure, and four supporting lines. Holds `selectedPeriod`
  and `percentElapsed` locally; neither matters to `App`. Internal handlers:
  `handlePeriodChange`, `handleSliderChange`. The M.T.A. line is hidden entirely when
  M.T.A. is 0 so it cannot divide by zero on an empty history.

### Files changed

**`src/lib/formatCurrency.mts`**
- Added `smallUsdCurrencyFormatter` (4 decimal places) and
  `SMALLEST_AMOUNT_THAT_SURVIVES_ROUNDING_TO_CENTS` (`0.005`).
- Added `formatRate(amount)` — falls back to four decimals for amounts that would round
  away to `$0.00`. A $100 monthly budget accrues $0.0023 per minute, which the existing
  formatter flattened to a useless `$0.00`.
- `formatCurrency` unchanged.

**`src/components/TransactionTable.tsx`**
- Removed the private `sumTransactionAmounts` helper; now imports it from
  `budgetStatistics.mts`. No behaviour change.

**`src/App.tsx`**
- Added `formatAmountForBudgetField(amount)`.
- Added `totalBudgetInput` state (raw text, matching how `TransactionSetupForm` holds its
  fields so the input can be cleared mid-edit) and the derived `suggestedBudget`,
  `minimumTransactionAmount`, `parsedTotalBudget`, `totalBudgetIsUsable`, `totalBudget`.
- Changed `handleGenerate` — also points the budget field at the new history's total,
  since generating discards the history the old budget was typed against.
- Added `handleTotalBudgetChange` and `handleUseSuggestedBudget`. `handleDeleteTransaction`
  deliberately leaves the budget alone; the "Use suggested" button handles resyncing.
- Rendered `<BudgetTotals />` and `<SafeToSpendPacer />` below `<TransactionTable />`.
- Updated the `App` JSDoc, which claimed the pacer was not built yet.

### Verification

`npx tsc -b` and `npm run build` pass clean. Driven end to end with Playwright:

- **Totals track the history.** Generated 100 transactions; the suggested budget
  ($4,875.04) matched both the table footer and an independent sum of the table's own
  cells, the budget field pre-filled to the same figure, and M.T.A. ($13.89) matched an
  independently computed mean of the cheapest 20 rows.
- **M.T.A. recomputes on delete.** Deleted the cheapest row (id 51, $5.52): suggested
  budget fell to $4,869.52 (exactly $5.52 less), M.T.A. rose to $14.81 — again matching an
  independent recomputation — the typed budget stayed at $4,875.04, and "Use suggested"
  appeared. Clicking it resynced to $4,869.52 and the button went away.
- **The accrual ladder is right.** With a $100 monthly budget, the slider at 0 / 25 / 50 /
  100% gave $0.00 / $25.00 / $50.00 / $100.00. The 50% case is the original example; the
  25% case is the one that distinguishes accrual from remaining-based, and it read $25.
- **Tiny per-minute rate survives.** That same budget showed "$3.33 per day · $0.14 per
  hour · $0.0023 per minute" — the last figure being exactly what `formatCurrency` alone
  would have flattened to $0.00.
- **Period switching rescales.** Switching to Weekly at 50% held Safe to Spend at $50.00
  while the rate moved to $14.29 per day and the days line to "3.5 of 7 days".
- **Pluralisation.** At 20% of a $100 weekly budget the M.T.A. line reads "1 purchase";
  at 100% it reads "6 purchases".
- **Empty state is safe.** With no transactions both sections render, the M.T.A. line is
  absent, "Use suggested" is hidden, and nothing shows NaN or Infinity.
- Zero console errors or warnings across the session.

Note on the previous entry: it recorded port 5173 as free after that session, but a Vite
process from it was still holding the port at the start of this one and was cleared here.
Both the leftover process and this session's server have been stopped.

### Deferred / future work

Carried forward from the last entry, minus what is now built. Transactions still have no
dates, so the pacer measures position in an abstract period rather than a real one. If the
demo ever needs to compare **actual** spending against the accrued figure — rather than
just showing what has accrued — `Transaction` will need a date and the generator will need
to distribute dates across the period.

## 2026-09-18 10:59 EDT — Scaffold the demo and build the transaction history generator

**Intent.** Stand up the Safe to Spend single-page demo and build the first part of it:
a tool that fabricates a transaction history on demand so there is something to pace
against later. Scope was deliberately limited to generating, reviewing, and deleting
transactions — the Safe to Spend pacing view itself was not built (see Deferred below).

### Project setup

Scaffolded with `npm create vite@latest --template react-ts` (Vite 8, React 19,
TypeScript 6) and added MUI 9 (`@mui/material`, `@mui/icons-material`, `@emotion/react`,
`@emotion/styled`). No backend, no database, no persistence layer — the generated
transactions live in React state only.

- `package.json` — renamed the package to `safe-to-spend-demo`; added the four MUI and
  Emotion dependencies.
- `tsconfig.app.json` — added `"strict": true`, which the template omitted.
- `index.html` — changed `<title>` to "Safe to Spend".
- `.gitignore` — added `claude_tmp` and `.playwright-mcp` (scratch space used during
  verification).
- `README.md` — replaced the Vite boilerplate with how to run the demo and what is built.
- `CLAUDE.md` — removed the `npm run test:coverage`, `npm run lint`, and `npm run test`
  rules, which referenced scripts this project does not have; the file had been copied in
  from another project. Reworded the `npm run dev` rule to drop its server health-check
  clause (there is no server here) while keeping the homepage sniff test.
- Deleted the template's `src/App.css`, `src/assets/`, and `src/index.css`.

### Files added

**`src/types/transaction.mts`**
- Added `interface Transaction` — `id` (sequential, never renumbered), `merchant`,
  `amount`.

**`src/data/merchants.mts`**
- Added `MERCHANT_NAMES` — a frozen `readonly string[]` of 12 everyday merchant names
  that generated transactions draw from.

**`src/lib/formatCurrency.mts`**
- Added `usdCurrencyFormatter` (module-scoped `Intl.NumberFormat`, built once because the
  table can render hundreds of rows).
- Added `formatCurrency(amount)` — renders a number as a USD string.

**`src/lib/generateTransactions.mts`**
- Added `generateRandomAmount(minimumAmount, maximumAmount)` — uniform random dollar
  amount in the inclusive range, rounded to whole cents.
- Added `pickRandomMerchant()` — random entry from `MERCHANT_NAMES`.
- Added `generateTransactions(transactionCount, minimumAmount, maximumAmount)` — returns
  a `Transaction[]` with ids `1..transactionCount`.

**`src/components/TransactionSetupForm.tsx`**
- Added `DEFAULT_MINIMUM_AMOUNT_INPUT` (`'5'`), `DEFAULT_MAXIMUM_AMOUNT_INPUT` (`'100'`),
  `DEFAULT_TRANSACTION_COUNT_INPUT` (`'100'`).
- Added `interface SetupFieldErrors` and `interface TransactionSetupFormProps`.
- Added `validateSetupFields(minimumAmount, maximumAmount, transactionCount)` — returns
  one message per field: minimum must be greater than 0, maximum must be at least the
  minimum, count must be at least 1.
- Added `TransactionSetupForm({ onGenerate })` — three MUI number `TextField`s plus a
  submit `Button` that is disabled while any field is invalid. Holds the raw text of each
  field in state so the user can clear a field mid-edit; parses on every render.
  Internal handler: `handleSubmit(submitEvent)`.

**`src/components/TransactionTable.tsx`**
- Added `interface TransactionTableProps`.
- Added `sumTransactionAmounts(transactions)` — totals the amounts for the footer.
- Added `TransactionTable({ transactions, onDelete })` — MUI sticky-header table of
  ID / Merchant / Amount / Remove, a per-row delete `IconButton` labelled
  "Delete transaction {id}", a footer showing the remaining count and total, and an
  empty state when nothing has been generated.

### Files changed

**`src/App.tsx`** — replaced the Vite demo component entirely.
- Added default-exported `App()` holding `transactions` state (`Transaction[]`).
- Added `handleGenerate(transactionCount, minimumAmount, maximumAmount)` — replaces the
  whole list with a freshly generated batch.
- Added `handleDeleteTransaction(transactionIdToDelete)` — filters that one id out.
- Removed the template's `count` state, logo imports, and `App.css` import.

**`src/main.tsx`**
- Added a null check on `#root` that throws a readable error instead of relying on `!`.
- Added `<CssBaseline />` inside `<StrictMode>`.
- Removed the `./index.css` import (the file was deleted; the page background now comes
  from a `Box` wrapper in `App.tsx`, since `CssBaseline` overrides a plain `body` rule).

### Verification

`npx tsc -b` and `npm run build` both pass clean. The dev server was started and the page
driven end to end with Playwright:

- Page loads with fields defaulting to 5 / 100 / 100 and the empty-state message showing.
- **Generate transactions** produced 100 rows, ids 1–100 sequential, amounts spanning
  $5.39–$99.98 (inside the requested 5–100 range), all 12 merchants represented, footer
  reading "100 transactions / Total $5,089.81".
- Deleting transaction 50 left 99 rows, removed only id 50, left neighbours as
  47, 48, 49, 51, 52, 53 (ids correctly not renumbered), and dropped the total to
  $5,020.57.
- Setting minimum to 200 against a maximum of 100 marked the maximum field invalid
  ("Must be at least the minimum.", `aria-invalid="true"`) and disabled the submit button.
- Setting the count to 5 and regenerating replaced the table with exactly 5 rows.
- Zero console errors or warnings across the session.

Dev server was stopped afterwards and port 5173 confirmed free.

### Deferred / future work

**The Safe to Spend pacer is not built yet.** It is the point of the project: compare
time elapsed in a period against money spent, and surface what is safe to spend now.
Open design questions, deliberately left unanswered for a later pass:

1. **What defines the period?** Calendar month, a custom start/end date range, or a
   biweekly pay period.
2. **Where does the allocation come from?** A single budget figure typed by the user, or
   something more structured.
3. **Do transactions need dates?** Today they carry only an id, merchant, and amount.
   Pacing against elapsed time requires each transaction to fall somewhere in the period,
   so `Transaction` will likely need a date field and the generator will need to
   distribute dates across the period up to today.
4. **What gets shown?** Candidate figures: spent to date, remaining, expected spend by
   now (`allocation × elapsed ÷ total`), ahead/behind delta, and safe-to-spend-per-day
   across the days remaining.
