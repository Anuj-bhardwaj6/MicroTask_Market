import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiArrowDownCircle, FiDownload, FiX } from "react-icons/fi";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { SectionHeader } from "../../components/ui/SectionHeader.jsx";
import { SkeletonLoader } from "../../components/ui/Skeleton.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { WithdrawModal } from "../../components/common/WithdrawModal.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  useWalletQuery,
  useTransactionsQuery,
  useWithdrawalsQuery,
  useUpdateWithdrawalStatusMutation,
} from "../../hooks/api/useWallet.js";
import { formatSignedAmount, formatRelativeTime, transactionStatusTone } from "../../utils/format.js";

function MiniChart({ label, values }) {
  return (
    <Card>
      <h3 className="font-semibold">{label}</h3>
      <div className="mt-5 flex h-36 items-end gap-2">
        {values.length === 0 ? (
          <p className="w-full self-center text-center text-sm text-ink-500">Not enough history yet.</p>
        ) : (
          values.map((value, index) => (
            <div key={index} className="flex-1 rounded-t bg-brand-500/80" style={{ height: `${Math.max(4, value)}%` }} />
          ))
        )}
      </div>
    </Card>
  );
}

// Normalizes recent transaction amounts (most recent last) into 0-100 bar
// heights so the chart reflects real transaction history instead of static
// placeholder numbers.
function chartValues(transactions, direction) {
  const filtered = transactions.filter((t) => t.direction === direction && t.status === "Completed").slice(0, 7).reverse();
  if (filtered.length === 0) return [];
  const max = Math.max(...filtered.map((t) => t.amount), 1);
  return filtered.map((t) => Math.round((t.amount / max) * 100));
}

export function WalletPage() {
  usePageTitle("Wallet");
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [searchParams, setSearchParams] = useSearchParams();
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const walletQuery = useWalletQuery();
  const transactionsQuery = useTransactionsQuery({ limit: 50 });
  const withdrawalsQuery = useWithdrawalsQuery();
  const allWithdrawalsQuery = useWithdrawalsQuery({ all: true }, { enabled: isAdmin });
  const settleWithdrawalMutation = useUpdateWithdrawalStatusMutation();

  const wallet = walletQuery.data?.data?.wallet;
  const transactions = transactionsQuery.data?.data?.transactions || [];
  const withdrawals = withdrawalsQuery.data?.data?.withdrawals || [];
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "Processing");
  const allPendingWithdrawals = isAdmin
    ? (allWithdrawalsQuery.data?.data?.withdrawals || []).filter((w) => w.status === "Processing")
    : [];

  const settleWithdrawal = (id, status) => {
    if (window.confirm(`Mark this withdrawal as ${status}?`)) {
      settleWithdrawalMutation.mutate({ id, status });
    }
  };

  const paymentBanner = searchParams.get("payment");

  const incomeValues = useMemo(() => chartValues(transactions, "credit"), [transactions]);
  const expenseValues = useMemo(() => chartValues(transactions, "debit"), [transactions]);

  const handleExport = () => {
    const header = "Transaction,Date,Status,Type,Amount\n";
    const rows = transactions
      .map((t) => `"${t.label}",${new Date(t.createdAt).toLocaleDateString()},${t.status},${t.type},${formatSignedAmount(t)}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wallet-transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const dismissBanner = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("payment");
    next.delete("task");
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="space-y-6">
      {paymentBanner ? (
        <Card
          className={
            paymentBanner === "success"
              ? "border-brand-200 bg-brand-50 dark:border-brand-900 dark:bg-brand-900/30"
              : "border-coral-200 bg-coral-50 dark:border-coral-900 dark:bg-coral-900/20"
          }
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">
              {paymentBanner === "success"
                ? "Payment confirmed - escrow for that task is now held and ready to release on completion."
                : "Payment was cancelled. No funds were charged - you can try again from the task page anytime."}
            </p>
            <Button variant="ghost" className="h-8 w-8 px-0" onClick={dismissBanner} aria-label="Dismiss">
              <FiX className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="bg-ink-950 text-white dark:bg-white dark:text-ink-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-ink-300 dark:text-ink-600">Available balance</p>
            <p className="mt-2 text-4xl font-semibold tracking-normal">
              {walletQuery.isLoading ? "..." : `$${(wallet?.balance || 0).toLocaleString()}`}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink-300 dark:text-ink-600">
              <span>Total earned: ${(wallet?.totalEarned || 0).toLocaleString()}</span>
              <span>Total spent: ${(wallet?.totalSpent || 0).toLocaleString()}</span>
              <span>Total withdrawn: ${(wallet?.totalWithdrawn || 0).toLocaleString()}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="accent" icon={FiArrowDownCircle} onClick={() => setWithdrawOpen(true)}>
              Withdraw
            </Button>
            <Button variant="secondary" icon={FiDownload} onClick={handleExport} disabled={transactions.length === 0}>
              Export
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <MiniChart label="Income chart" values={incomeValues} />
        <MiniChart label="Expense chart" values={expenseValues} />
      </div>

      {pendingWithdrawals.length > 0 ? (
        <Card>
          <SectionHeader title="Pending withdrawal requests" />
          <div className="space-y-2">
            {pendingWithdrawals.map((w) => (
              <div key={w._id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <div>
                  <p className="font-medium">{w.label}</p>
                  <p className="text-ink-500">{formatRelativeTime(w.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">${w.amount.toLocaleString()}</span>
                  <Badge tone="amber">Processing</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {isAdmin && allPendingWithdrawals.length > 0 ? (
        <Card>
          <SectionHeader title="Withdrawal requests to settle" />
          <div className="space-y-2">
            {allPendingWithdrawals.map((w) => (
              <div key={w._id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm">
                <div>
                  <p className="font-medium">
                    {w.user?.name || "User"} - {w.label}
                  </p>
                  <p className="text-ink-500">
                    {w.user?.email} - {formatRelativeTime(w.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">${w.amount.toLocaleString()}</span>
                  <Button
                    variant="accent"
                    disabled={settleWithdrawalMutation.isPending}
                    onClick={() => settleWithdrawal(w._id, "Completed")}
                  >
                    Mark paid
                  </Button>
                  <Button
                    variant="danger"
                    disabled={settleWithdrawalMutation.isPending}
                    onClick={() => settleWithdrawal(w._id, "Failed")}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Card>
        <SectionHeader title="Payment history" />
        {transactionsQuery.isLoading ? (
          <SkeletonLoader />
        ) : transactions.length === 0 ? (
          <EmptyState title="No transactions yet" message="Escrow payments, releases, and withdrawals will show up here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-ink-500">
                <tr>
                  <th className="py-3">Transaction</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map((item) => (
                  <tr key={item._id}>
                    <td className="py-3 font-medium">{item.label}</td>
                    <td>{new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</td>
                    <td>
                      <Badge tone={transactionStatusTone(item.status)}>{item.status}</Badge>
                    </td>
                    <td className={`text-right font-semibold ${item.direction === "debit" ? "text-coral-600 dark:text-coral-300" : "text-brand-700 dark:text-brand-300"}`}>
                      {formatSignedAmount(item)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} availableBalance={wallet?.balance || 0} />
    </div>
  );
}
