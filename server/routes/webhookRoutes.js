import { Router } from "express";
import express from "express";
import { stripeWebhook } from "../controllers/walletController.js";

const router = Router();

// `express.raw` here (rather than the app-wide express.json()) is what
// lets stripe.webhooks.constructEvent verify the signature against the
// exact bytes Stripe sent.
router.post("/", express.raw({ type: "application/json" }), stripeWebhook);

export default router;
