# Safe to Spend — demo

A single-page sandbox for trying out **Safe to Spend**: a budget pacer that compares the
time left in a period against the money still allocated for that period.

Everything runs in the browser. No backend, no database, no deployment — generated data
lives in React state and disappears on refresh.

## Running it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (http://localhost:5173 by default).

## What's built so far

**Part 1 — fabricated transaction history.** Set a minimum amount, a maximum amount, and
how many transactions to make (defaults: `5`, `100`, `100`), then hit **Generate
transactions**. Each one gets a sequential id, a random merchant, and a random amount
inside the range. The table below is there to review the result, and any row can be
deleted with the trash button.

Ids are handed out once at generation and never renumbered, so deleting a row leaves a
gap in the sequence rather than reshuffling everything under it.

**Part 2 — totals and the pacer.** The **Totals** section reads budget figures off that
history and shows each one beside the suggestion it came from:

| In force (editable) | Suggested (read-only) |
|---|---|
| Total budget | Sum of every transaction |
| Actual M.T.A. | Average of the cheapest 20% of transactions |

Each editable figure starts as a copy of its suggestion but is yours to change, and its own
**Use suggested** button appears whenever the two drift apart. The two pairs are
independent — overriding the M.T.A. leaves the budget alone.

The **Safe to Spend** section below picks up that budget. Choose weekly, biweekly, or
monthly, then drag the **time slider** through the period. The budget *accrues* as the
period elapses: $0 at the start, half the budget at the halfway point, the whole thing by
the end. Underneath sit the accrual rate broken down per day, per hour, and per minute, how
many M.T.A.-sized purchases the current figure covers, and how much is still to accrue.

Monthly is a flat 30 days — there is no calendar here, and transactions carry no dates.

**Part 3 — actual spend and status.** A second **actual spent slider** says how much has
been spent, from nothing up to the whole budget. The headline is the subtraction:

```
Δ-STS = Safe to Spend − Actual spent
```

Positive means headroom left, negative means the spending has run ahead of what has
accrued. Two columns below read that one number against different band widths, which is why
they can disagree:

| Δ-STS | Status |
|---|---|
| more than the threshold | Super Safe |
| between $0 and the threshold | On Track |
| between minus the threshold and $0 | Off Track |
| worse than minus the threshold | Danger |

**Legacy 2-Day Status** uses two days of accrual as its threshold. **M.T.A. Based Status**
uses a multiple of the M.T.A., set by the **M.T.A. multiplier** field directly below that
column — it defaults to 3 and accepts decimals, so the band width can be tuned live. Each
column states the rule that fired with the real numbers in it.

Because the spend slider stops at the budget, Danger is unreachable at 100% on the time
slider — at that point Safe to Spend equals the budget, so the largest possible overspend
is $0. It is reachable anywhere earlier.

## What's next

See `AI_JOURNAL.md` for what is deferred.

## Stack

Vite + React + TypeScript + MUI.
