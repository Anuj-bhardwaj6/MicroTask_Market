import Stripe from "stripe";
import { env } from "./env.js";

// Only instantiate a real Stripe client when a secret key is present. Every
// caller must check `isStripeConfigured` first and fall back to the
// dev-simulated payment path documented in walletController.js when it's
// false, so the payment system is fully testable without live Stripe keys.
export const stripe = env.stripe.secretKey ? new Stripe(env.stripe.secretKey) : null;

export const isStripeConfigured = Boolean(env.stripe.secretKey);
export const isStripeWebhookConfigured = Boolean(env.stripe.webhookSecret);

export default stripe;
