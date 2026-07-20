import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env.js";

// --- Access token (short-lived, proves identity for API calls) ---
export function generateAccessToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

// --- Refresh token (long-lived, only ever sent to /api/auth/*) ---
export function generateRefreshToken(payload) {
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpiresIn });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

// Refresh tokens are only ever stored/compared as a SHA-256 hash so a
// leaked database never yields a usable token.
export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? "none" : "lax",
  };
}

export function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie("accessToken", accessToken, {
    ...baseCookieOptions(),
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    path: "/",
  });
  res.cookie("refreshToken", refreshToken, {
    ...baseCookieOptions(),
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    // Scoped to the auth routes only, so the long-lived token is never
    // sent along with ordinary API requests.
    path: "/api/auth",
  });
}

export function clearAuthCookies(res) {
  res.clearCookie("accessToken", { ...baseCookieOptions(), path: "/" });
  res.clearCookie("refreshToken", { ...baseCookieOptions(), path: "/api/auth" });
}

export const REFRESH_TOKEN_TTL_MS = REFRESH_TOKEN_MAX_AGE_MS;
