import crypto from "crypto";

export function generateOtp() {
  return String(crypto.randomInt(100000, 1000000)); // 6 digits
}

export function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
