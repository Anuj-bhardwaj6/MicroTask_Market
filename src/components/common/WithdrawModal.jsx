import { useState } from "react";
import { Modal } from "./Modal.jsx";
import { Button } from "../ui/Button.jsx";
import { Input, Select } from "../ui/Input.jsx";
import { useRequestWithdrawalMutation } from "../../hooks/api/useWallet.js";

const METHODS = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "paypal", label: "PayPal" },
  { value: "upi", label: "UPI" },
];

export function WithdrawModal({ open, onClose, availableBalance = 0 }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank_transfer");
  const [error, setError] = useState("");

  const withdrawMutation = useRequestWithdrawalMutation();

  const resetAndClose = () => {
    setAmount("");
    setMethod("bank_transfer");
    setError("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Enter an amount greater than 0.");
      return;
    }
    if (numericAmount > availableBalance) {
      setError("You can't withdraw more than your available balance.");
      return;
    }

    try {
      await withdrawMutation.mutateAsync({ amount: numericAmount, method });
      resetAndClose();
    } catch (err) {
      setError(err?.message || "Couldn't submit your withdrawal request. Try again.");
    }
  };

  return (
    <Modal open={open} onClose={resetAndClose} title="Withdraw funds">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <p className="text-sm text-ink-500 dark:text-ink-400">
          Available balance: <span className="font-semibold text-ink-900 dark:text-white">${availableBalance.toLocaleString()}</span>
        </p>
        <Input
          label="Amount"
          type="number"
          min="1"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Select label="Payout method" value={method} onChange={(e) => setMethod(e.target.value)}>
          {METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
        {error ? <p className="text-sm text-coral-600 dark:text-coral-300">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button type="submit" variant="accent" disabled={withdrawMutation.isPending}>
            {withdrawMutation.isPending ? "Requesting..." : "Request withdrawal"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
