import { Transaction } from "../models/Transaction.js";
import { Wallet } from "../models/Wallet.js";
import { Task } from "../models/Task.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { withTransaction } from "../utils/withTransaction.js";
import { notifyUser } from "../utils/notify.js";
import { logActivity } from "../utils/activityLog.js";
import { stripe, isStripeConfigured, isStripeWebhookConfigured } from "../config/stripe.js";
import { env } from "../config/env.js";
import { WITHDRAWAL_METHODS } from "../utils/constants.js";

// Pushes a lightweight "something about your wallet changed" event so every
// connected client refetches balance/transactions/task state without a
// manual refresh - the dashboard-updates-automatically requirement.
function emitWalletUpdate(io, userId, payload = {}) {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit("wallet:updated", payload);
}

function money(amount) {
  return `$${Number(amount).toLocaleString()}`;
}

// ---------------------------------------------------------------------------
// Wallet + transaction history
// ---------------------------------------------------------------------------

// GET /api/wallet/me
export const getWallet = asyncHandler(async (req, res) => {
  const wallet = await Wallet.getOrCreate(req.user._id);
  res.status(200).json(new ApiResponse(200, { wallet }, "OK"));
});

// GET /api/wallet/transactions?type=&status=&task=&page=&limit=
export const getTransactions = asyncHandler(async (req, res) => {
  const { type, status, task, page = 1, limit = 50 } = req.query;
  const filter = req.user ? { user: req.user._id } : {};
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (task) filter.task = task;

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 50));
  const skip = (pageNum - 1) * limitNum;

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate("task", "title taskId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Transaction.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        transactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.max(1, Math.ceil(total / limitNum)),
        },
      },
      "OK"
    )
  );
});

// POST /api/wallet/transactions - admin-only manual ledger adjustment
export const createTransaction = asyncHandler(async (req, res) => {
  const { user, label, amount, type = "adjustment", direction = "credit", status = "Completed", notes } = req.body;
  const targetUser = user || req.user?._id;

  const transaction = await withTransaction(async (session) => {
    const [created] = await Transaction.create(
      [{ user: targetUser, label, amount: Math.abs(Number(amount)), type, direction, status, notes }],
      { session }
    );

    if (status === "Completed") {
      const inc = direction === "debit" ? -Math.abs(Number(amount)) : Math.abs(Number(amount));
      await Wallet.findOneAndUpdate(
        { user: targetUser },
        { $inc: { balance: inc } },
        { upsert: true, new: true, session }
      );
    }

    return created;
  });

  const io = req.app.get("io");
  emitWalletUpdate(io, targetUser);

  res.status(201).json(new ApiResponse(201, { transaction }, "Transaction recorded"));
});

// ---------------------------------------------------------------------------
// Escrow: client funds a task (Stripe Checkout, or a dev-simulated instant
// success when no Stripe keys are configured so the flow stays testable).
// ---------------------------------------------------------------------------

// POST /api/wallet/tasks/:taskId/pay
export const payForTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) throw ApiError.notFound("Task not found");

  const isOwner = task.client && task.client.toString() === req.user._id.toString();
  if (!isOwner) throw ApiError.forbidden("Only the client who posted this task can fund it");

  if (!task.assignedTo) {
    throw ApiError.badRequest("Hire a freelancer before funding escrow for this task");
  }
  if (["held", "released"].includes(task.escrow?.status)) {
    throw ApiError.conflict("This task's escrow has already been funded");
  }

  const amount = Number(task.budget);
  if (!amount || amount <= 0) throw ApiError.badRequest("This task has no valid budget to pay");

  const io = req.app.get("io");

  // --- Dev-simulated path: no Stripe keys configured. Skip the redirect
  // entirely and mark escrow held immediately, as if payment succeeded. ---
  if (!isStripeConfigured) {
    const today = new Date();
    const result = await withTransaction(async (session) => {
      const [transaction] = await Transaction.create(
        [
          {
            user: req.user._id,
            task: task._id,
            type: "payment",
            direction: "debit",
            label: `Escrow funded - ${task.title}`,
            amount,
            status: "Completed",
            method: "dev-simulated",
          },
        ],
        { session }
      );

      task.escrow = {
        status: "held",
        amount,
        currency: "usd",
        heldAt: today,
        stripeCheckoutSessionId: "",
        stripePaymentIntentId: "",
      };
      await task.save({ session });

      await notifyUser(
        io,
        task.assignedTo,
        { title: "Escrow funded", body: `${money(amount)} for "${task.title}" is now held in escrow.` },
        { session }
      );
      await logActivity(req.user._id, "Escrow funded", `You funded escrow of ${money(amount)} for "${task.title}".`, {
        session,
      });

      return { task, transaction };
    });

    emitWalletUpdate(io, task.client, { taskId: task._id.toString() });
    emitWalletUpdate(io, task.assignedTo, { taskId: task._id.toString() });

    return res
      .status(200)
      .json(new ApiResponse(200, { task: result.task, simulated: true }, "Escrow funded (simulated payment)"));
  }

  // --- Real Stripe Checkout path ---
  task.escrow = task.escrow || {};
  task.escrow.status = "pending";
  await task.save();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: req.user.email,
    line_items: [
      {
        price_data: {
          currency: env.stripe.currency,
          unit_amount: Math.round(amount * 100),
          product_data: {
            name: `Escrow - ${task.title}`,
            description: `MicroTask escrow funding for task ${task.taskId || task._id}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: { taskId: task._id.toString(), userId: req.user._id.toString() },
    success_url: `${env.clientUrl}/client/wallet?payment=success&task=${task._id}`,
    cancel_url: `${env.clientUrl}/client/wallet?payment=cancelled&task=${task._id}`,
  });

  await Transaction.create({
    user: req.user._id,
    task: task._id,
    type: "payment",
    direction: "debit",
    label: `Escrow funded - ${task.title}`,
    amount,
    status: "Pending",
    method: "card",
    stripeCheckoutSessionId: session.id,
  });

  res.status(200).json(new ApiResponse(200, { checkoutUrl: session.url }, "Checkout session created"));
});

// GET /api/wallet/tasks/:taskId/payment-status - lets the client page poll
// right after returning from Stripe (webhook delivery can lag a redirect).
export const getPaymentStatus = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId).select("escrow client assignedTo title budget");
  if (!task) throw ApiError.notFound("Task not found");
  res.status(200).json(new ApiResponse(200, { escrow: task.escrow }, "OK"));
});

// POST /api/wallet/webhook - Stripe webhook (mounted with express.raw body)
export const stripeWebhook = asyncHandler(async (req, res) => {
  if (!isStripeConfigured) {
    return res.status(400).json({ received: false, error: "Stripe is not configured on this server" });
  }

  let event;
  try {
    event = isStripeWebhookConfigured
      ? stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], env.stripe.webhookSecret)
      : JSON.parse(req.body.toString());
  } catch (err) {
    console.error("[stripe webhook] signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const io = req.app.get("io");

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const taskId = session.metadata?.taskId;
    const transaction = await Transaction.findOne({ stripeCheckoutSessionId: session.id });
    const task = taskId ? await Task.findById(taskId) : null;

    if (task && transaction && transaction.status !== "Completed") {
      const today = new Date();
      await withTransaction(async (dbSession) => {
        transaction.status = "Completed";
        transaction.stripePaymentIntentId = session.payment_intent || "";
        await transaction.save({ session: dbSession });

        task.escrow.status = "held";
        task.escrow.amount = transaction.amount;
        task.escrow.heldAt = today;
        task.escrow.stripeCheckoutSessionId = session.id;
        task.escrow.stripePaymentIntentId = session.payment_intent || "";
        await task.save({ session: dbSession });

        await notifyUser(
          io,
          task.assignedTo,
          { title: "Escrow funded", body: `${money(transaction.amount)} for "${task.title}" is now held in escrow.` },
          { session: dbSession }
        );
        await logActivity(task.client, "Escrow funded", `Your payment for "${task.title}" was confirmed.`, {
          session: dbSession,
        });
      });

      emitWalletUpdate(io, task.client, { taskId: task._id.toString() });
      emitWalletUpdate(io, task.assignedTo, { taskId: task._id.toString() });
    }
  }

  if (event.type === "checkout.session.expired" || event.type === "payment_intent.payment_failed") {
    const session = event.data.object;
    const sessionId = session.id || session.metadata?.checkoutSessionId;
    const transaction = await Transaction.findOne({ stripeCheckoutSessionId: sessionId });
    if (transaction && transaction.status === "Pending") {
      transaction.status = "Failed";
      await transaction.save();

      if (transaction.task) {
        await Task.findByIdAndUpdate(transaction.task, { $set: { "escrow.status": "none" } });
      }
      emitWalletUpdate(io, transaction.user);
      await notifyUser(io, transaction.user, {
        title: "Payment failed",
        body: `Your payment of ${money(transaction.amount)} could not be completed. You can try again from the task page.`,
      });
    }
  }

  res.status(200).json({ received: true });
});

// ---------------------------------------------------------------------------
// Release: escrow -> freelancer wallet
// ---------------------------------------------------------------------------

// POST /api/wallet/tasks/:taskId/release-payment
// Final step of the hiring flow: once a task is Completed and escrow is
// held, its client releases the escrowed budget to the freelancer. Credits
// the freelancer's wallet balance atomically and marks the task paid.
export const releasePayment = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) throw ApiError.notFound("Task not found");

  const isOwner = req.user.role === "admin" || (task.client && task.client.toString() === req.user._id.toString());
  if (!isOwner) throw ApiError.forbidden("You do not have permission to release payment for this task");

  if (task.status !== "Completed") {
    throw ApiError.badRequest("Payment can only be released once the task is marked Completed");
  }
  if (!task.assignedTo) {
    throw ApiError.badRequest("This task has no assigned freelancer to pay");
  }
  if (task.escrow?.status !== "held") {
    throw ApiError.badRequest(
      task.escrow?.status === "released"
        ? "Payment has already been released for this task"
        : "This task's escrow hasn't been funded yet - the client needs to pay first"
    );
  }

  const io = req.app.get("io");
  const amount = task.escrow.amount || Number(task.budget);
  const amountLabel = money(amount);
  const today = new Date();

  await withTransaction(async (session) => {
    await Transaction.create(
      [
        {
          user: task.client,
          task: task._id,
          type: "escrow_release",
          direction: "debit",
          label: `Escrow released - ${task.title}`,
          amount,
          status: "Completed",
          method: "escrow",
        },
      ],
      { session }
    );
    await Transaction.create(
      [
        {
          user: task.assignedTo,
          task: task._id,
          type: "escrow_release",
          direction: "credit",
          label: `Task payout - ${task.title}`,
          amount,
          status: "Completed",
          method: "escrow",
        },
      ],
      { session }
    );

    await Wallet.findOneAndUpdate(
      { user: task.assignedTo },
      { $inc: { balance: amount, totalEarned: amount } },
      { upsert: true, new: true, session }
    );
    await Wallet.findOneAndUpdate(
      { user: task.client },
      { $inc: { totalSpent: amount } },
      { upsert: true, new: true, session }
    );

    task.paymentReleased = true;
    task.escrow.status = "released";
    task.escrow.releasedAt = today;
    await task.save({ session });

    await notifyUser(
      io,
      task.assignedTo,
      { title: "Payment released", body: `${amountLabel} was released for "${task.title}". It's in your wallet now.` },
      { session }
    );
    await logActivity(task.client, "Payment released", `You released ${amountLabel} for "${task.title}".`, { session });
    await logActivity(task.assignedTo, "Payment received", `You were paid ${amountLabel} for "${task.title}".`, {
      session,
    });
  });

  emitWalletUpdate(io, task.client, { taskId: task._id.toString() });
  emitWalletUpdate(io, task.assignedTo, { taskId: task._id.toString() });

  res.status(200).json(new ApiResponse(200, { task }, "Payment released"));
});

// POST /api/wallet/tasks/:taskId/refund
// Returns held escrow back to the client - used when a task is cancelled
// or disputed before completion. Issues a real Stripe refund when the
// original payment went through Stripe; otherwise just reverses the ledger
// entry (dev-simulated payments never actually charged a card).
export const refundEscrow = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) throw ApiError.notFound("Task not found");

  const isOwner = req.user.role === "admin" || (task.client && task.client.toString() === req.user._id.toString());
  if (!isOwner) throw ApiError.forbidden("You do not have permission to refund this task");

  if (task.escrow?.status !== "held") {
    throw ApiError.badRequest("There is no held escrow to refund for this task");
  }

  const amount = task.escrow.amount || Number(task.budget);
  const amountLabel = money(amount);
  const io = req.app.get("io");

  if (isStripeConfigured && task.escrow.stripePaymentIntentId) {
    try {
      const refund = await stripe.refunds.create({ payment_intent: task.escrow.stripePaymentIntentId });
      task.escrow.stripeRefundId = refund.id;
    } catch (err) {
      throw ApiError.badRequest(`Stripe refund failed: ${err.message}`);
    }
  }

  await withTransaction(async (session) => {
    await Transaction.create(
      [
        {
          user: task.client,
          task: task._id,
          type: "refund",
          direction: "credit",
          label: `Escrow refunded - ${task.title}`,
          amount,
          status: "Completed",
          method: isStripeConfigured ? "card" : "dev-simulated",
        },
      ],
      { session }
    );

    task.escrow.status = "refunded";
    task.escrow.refundedAt = new Date();
    await task.save({ session });

    await notifyUser(
      io,
      task.client,
      { title: "Escrow refunded", body: `${amountLabel} for "${task.title}" has been refunded to you.` },
      { session }
    );
    if (task.assignedTo) {
      await notifyUser(
        io,
        task.assignedTo,
        { title: "Escrow refunded", body: `The escrow for "${task.title}" was refunded to the client.` },
        { session }
      );
    }
    await logActivity(task.client, "Escrow refunded", `${amountLabel} for "${task.title}" was refunded.`, { session });
  });

  emitWalletUpdate(io, task.client, { taskId: task._id.toString() });
  if (task.assignedTo) emitWalletUpdate(io, task.assignedTo, { taskId: task._id.toString() });

  res.status(200).json(new ApiResponse(200, { task }, "Escrow refunded"));
});

// ---------------------------------------------------------------------------
// Withdrawals: cash out available wallet balance
// ---------------------------------------------------------------------------

// POST /api/wallet/withdraw
// Earmarks the requested amount immediately (so it can't be double-spent or
// withdrawn twice) and files a Processing withdrawal for an admin to settle.
// There's no live payout rail (Stripe Connect, bank transfer, etc.) wired
// up, so completion is a manual/admin step - see updateWithdrawalStatus.
export const requestWithdrawal = asyncHandler(async (req, res) => {
  const { amount, method = "bank_transfer", notes = "" } = req.body;
  const numericAmount = Number(amount);

  if (!numericAmount || numericAmount <= 0) {
    throw ApiError.badRequest("Enter a withdrawal amount greater than 0");
  }
  if (!WITHDRAWAL_METHODS.includes(method)) {
    throw ApiError.badRequest(`Method must be one of: ${WITHDRAWAL_METHODS.join(", ")}`);
  }

  const io = req.app.get("io");

  const transaction = await withTransaction(async (session) => {
    const wallet = await Wallet.findOne({ user: req.user._id }).session(session);
    if (!wallet || wallet.balance < numericAmount) {
      throw ApiError.badRequest("Withdrawal amount exceeds your available balance");
    }

    wallet.balance -= numericAmount;
    await wallet.save({ session });

    const [created] = await Transaction.create(
      [
        {
          user: req.user._id,
          type: "withdrawal",
          direction: "debit",
          label: `Withdrawal request (${method.replace("_", " ")})`,
          amount: numericAmount,
          status: "Processing",
          method,
          notes,
        },
      ],
      { session }
    );

    await logActivity(
      req.user._id,
      "Withdrawal requested",
      `You requested a withdrawal of ${money(numericAmount)}.`,
      { session }
    );

    return created;
  });

  emitWalletUpdate(io, req.user._id);

  res.status(201).json(new ApiResponse(201, { transaction }, "Withdrawal requested"));
});

// GET /api/wallet/withdrawals - own withdrawals, or every pending one for admins (?all=true)
export const getWithdrawals = asyncHandler(async (req, res) => {
  const { all } = req.query;
  const filter = { type: "withdrawal" };
  if (!(req.user.role === "admin" && (all === "true" || all === true))) {
    filter.user = req.user._id;
  }

  const withdrawals = await Transaction.find(filter).populate("user", "name email").sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, { withdrawals }, "OK"));
});

// PATCH /api/wallet/withdrawals/:id/status - admin settles a withdrawal.
// Completed = payout sent externally, nothing further happens to the
// wallet. Failed = money is returned to the user's available balance.
export const updateWithdrawalStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["Completed", "Failed"].includes(status)) {
    throw ApiError.badRequest("Status must be Completed or Failed");
  }

  const io = req.app.get("io");

  const transaction = await withTransaction(async (session) => {
    const txn = await Transaction.findById(req.params.id).session(session);
    if (!txn || txn.type !== "withdrawal") throw ApiError.notFound("Withdrawal not found");
    if (txn.status !== "Processing") throw ApiError.conflict("This withdrawal has already been settled");

    txn.status = status;
    await txn.save({ session });

    if (status === "Completed") {
      await Wallet.findOneAndUpdate(
        { user: txn.user },
        { $inc: { totalWithdrawn: txn.amount } },
        { upsert: true, session }
      );
      await notifyUser(
        io,
        txn.user,
        { title: "Withdrawal completed", body: `Your withdrawal of ${money(txn.amount)} has been sent.` },
        { session }
      );
    } else {
      await Wallet.findOneAndUpdate({ user: txn.user }, { $inc: { balance: txn.amount } }, { upsert: true, session });
      await notifyUser(
        io,
        txn.user,
        { title: "Withdrawal failed", body: `Your withdrawal of ${money(txn.amount)} failed and was returned to your wallet.` },
        { session }
      );
    }

    return txn;
  });

  emitWalletUpdate(io, transaction.user);

  res.status(200).json(new ApiResponse(200, { transaction }, "Withdrawal updated"));
});
