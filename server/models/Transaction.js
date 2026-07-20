import mongoose from "mongoose";
import { TRANSACTION_TYPES, TRANSACTION_DIRECTIONS, TRANSACTION_STATUSES } from "../utils/constants.js";

// A single ledger entry. Money movement is always modelled from the
// perspective of `user`: a "debit" leaves their wallet/pocket, a "credit"
// lands in it. Escrow held against a task is tracked on Task.escrow, not
// here - the payment/escrow_hold entry is just the audit trail for it.
const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", default: null },

    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    direction: { type: String, enum: TRANSACTION_DIRECTIONS, required: true },

    label: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 }, // always a positive magnitude; `direction` gives the sign
    currency: { type: String, default: "usd" },

    status: { type: String, enum: TRANSACTION_STATUSES, default: "Processing" },

    // Stripe correlation ids, kept optional/blank for non-Stripe entries
    // (escrow releases, withdrawals, refunds recorded without a live
    // gateway call in dev-simulated mode).
    stripeCheckoutSessionId: { type: String, default: "" },
    stripePaymentIntentId: { type: String, default: "" },
    stripeRefundId: { type: String, default: "" },

    method: { type: String, default: "" }, // e.g. "card", "bank_transfer", "paypal", "dev-simulated"
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ task: 1 });
transactionSchema.index({ stripeCheckoutSessionId: 1 });
transactionSchema.index({ stripePaymentIntentId: 1 });

// Signed amount, e.g. -760 for a debit of 760. Convenient for the frontend
// so it doesn't have to know the direction/amount pairing rules.
transactionSchema.virtual("signedAmount").get(function signedAmount() {
  return this.direction === "debit" ? -Math.abs(this.amount) : Math.abs(this.amount);
});

transactionSchema.set("toJSON", { virtuals: true });
transactionSchema.set("toObject", { virtuals: true });

export const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
