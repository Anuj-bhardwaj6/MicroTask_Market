import mongoose from "mongoose";

// One wallet per user. `balance` is the spendable/withdrawable amount that
// has actually landed in the user's account (e.g. escrow released to a
// freelancer). Money sitting in a task's escrow is NOT part of anyone's
// wallet balance - it lives on Task.escrow until it's released or refunded.
const walletSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "usd" },

    // Lifetime counters, purely informational (surfaced in the wallet UI).
    totalEarned: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },

    stripeCustomerId: { type: String, default: "" },
  },
  { timestamps: true }
);

// Fetches a user's wallet, creating an empty one on first use so every
// other query can assume `Wallet.findOne({ user })` will succeed.
walletSchema.statics.getOrCreate = async function getOrCreate(userId, session) {
  let wallet = await this.findOne({ user: userId }).session(session || null);
  if (!wallet) {
    const created = await this.create([{ user: userId }], { session });
    wallet = Array.isArray(created) ? created[0] : created;
  }
  return wallet;
};

export const Wallet = mongoose.model("Wallet", walletSchema);
export default Wallet;
