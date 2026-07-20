// Sends transactional email via SMTP (nodemailer) when SMTP_* env vars are
// configured. Falls back to logging the message to the console so the auth
// flows (email verification, password reset) remain fully usable in local
// development without any mail provider set up.
import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter;

function getTransporter() {
  if (transporter !== undefined) return transporter;

  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) {
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });

  return transporter;
}

export async function sendEmail({ to, subject, text, html }) {
  const t = getTransporter();

  if (!t) {
    console.log(`[email:stub] to=${to} subject="${subject}"`);
    console.log(text || html);
    return { delivered: false, stub: true };
  }

  try {
    await t.sendMail({ from: env.smtp.from, to, subject, text, html });
    return { delivered: true };
  } catch (err) {
    console.error("[email] failed to send, falling back to console log:", err.message);
    console.log(`[email:fallback] to=${to} subject="${subject}"`);
    console.log(text || html);
    return { delivered: false, error: err.message };
  }
}

export async function sendOtpEmail({ to, otp, purpose }) {
  const isVerification = purpose === "verify-email";
  const subject = isVerification ? "Verify your email address" : "Your password reset code";
  const intro = isVerification
    ? "Use this code to verify your email address and activate your account."
    : "Use this code to reset your MicroTask Market password.";

  const text = `${intro}\n\nYour verification code: ${otp}\n\nThis code expires in 10 minutes. If you did not request this, you can safely ignore this email.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <p>${intro}</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${otp}</p>
      <p style="color: #666; font-size: 13px;">This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
}

export default { sendEmail, sendOtpEmail };
