import { Router } from "express";
import { body } from "express-validator";
import {
  getWallet,
  getTransactions,
  createTransaction,
  payForTask,
  getPaymentStatus,
  releasePayment,
  refundEscrow,
  requestWithdrawal,
  getWithdrawals,
  updateWithdrawalStatus,
} from "../controllers/walletController.js";
import { validate } from "../middleware/validate.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/me", protect, getWallet);

router.get("/transactions", protect, getTransactions);
router.post(
  "/transactions",
  protect,
  authorize("admin"),
  [body("label").trim().notEmpty(), body("amount").isFloat({ gt: 0 })],
  validate,
  createTransaction
);

router.get("/withdrawals", protect, getWithdrawals);
router.post(
  "/withdraw",
  protect,
  [body("amount").isFloat({ gt: 0 }).withMessage("Amount must be greater than 0")],
  validate,
  requestWithdrawal
);
router.patch(
  "/withdrawals/:id/status",
  protect,
  authorize("admin"),
  [body("status").isIn(["Completed", "Failed"])],
  validate,
  updateWithdrawalStatus
);

router.post("/tasks/:taskId/pay", protect, payForTask);
router.get("/tasks/:taskId/payment-status", protect, getPaymentStatus);
router.post("/tasks/:taskId/release-payment", protect, releasePayment);
router.post("/tasks/:taskId/refund", protect, refundEscrow);

export default router;
