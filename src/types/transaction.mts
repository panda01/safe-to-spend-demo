/**
 * A single fabricated spend transaction used to populate the demo history table.
 *
 * @property id - Sequential number assigned when the batch is generated. Ids are never
 *                reissued or renumbered, so deleting a row leaves a gap in the sequence
 *                and every remaining row keeps the id it was born with.
 * @property merchant - Display name of the place the money was spent.
 * @property amount - Dollar amount of the transaction, rounded to two decimal places.
 */
export interface Transaction {
  id: number;
  merchant: string;
  amount: number;
}
