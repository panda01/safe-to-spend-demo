import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { sumTransactionAmounts } from '../lib/budgetStatistics.mts';
import { formatCurrency } from '../lib/formatCurrency.mts';
import type { Transaction } from '../types/transaction.mts';

/**
 * Props accepted by the transaction table.
 *
 * @property transactions - The fabricated history to display, in generated order.
 * @property onDelete - Called with the id of the transaction whose delete button was clicked.
 */
interface TransactionTableProps {
  transactions: Transaction[];
  onDelete: (transactionId: number) => void;
}

/**
 * Shows the fabricated transaction history for review, and lets any row be removed so
 * the history can be trimmed by hand before it is used for anything else.
 *
 * @param props - See {@link TransactionTableProps}.
 * @returns The review table, or an empty-state message when nothing has been generated.
 */
export function TransactionTable({ transactions, onDelete }: TransactionTableProps) {
  const thereAreNoTransactionsToShow = transactions.length === 0;

  if (thereAreNoTransactionsToShow) {
    return (
      <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No transactions yet — generate some above.
        </Typography>
      </Paper>
    );
  }

  const totalOfRemainingTransactions = sumTransactionAmounts(transactions);

  return (
    <Paper variant="outlined">
      <TableContainer sx={{ maxHeight: 520 }}>
        <Table stickyHeader size="small" aria-label="Generated transaction history">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 80 }}>ID</TableCell>
              <TableCell>Merchant</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right" sx={{ width: 72 }}>
                Remove
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id} hover>
                <TableCell>{transaction.id}</TableCell>
                <TableCell>{transaction.merchant}</TableCell>
                <TableCell align="right">{formatCurrency(transaction.amount)}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    aria-label={`Delete transaction ${transaction.id}`}
                    onClick={() => onDelete(transaction.id)}
                  >
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {transactions.length} transactions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total {formatCurrency(totalOfRemainingTransactions)}
        </Typography>
      </Box>
    </Paper>
  );
}
