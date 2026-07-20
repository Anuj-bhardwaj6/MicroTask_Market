import crypto from "crypto";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  setAuthCookies,
  clearAuthCookies,
  REFRESH_TOKEN_TTL_MS,
} from "../utils/generateToken.js";
import { generateOtp, hashOtp, OTP_TTL_MS, RESET_TOKEN_TTL_MS } from "../utils/otp.js";
import { sendOtpEmail } from "../services/emailService.js";

// Issues a fresh OTP for the given purpose ("verify-email" | "reset-password"),
// stores only its hash, and emails the plaintext code to the user.
async function issueOtp(user, purpose) {
  const otp = generateOtp();
  user.otp = hashOtp(otp);
  user.otpExpires = Date.now() + OTP_TTL_MS;
  user.otpPurpose = purpose;
  await user.save({ validateBeforeSave: false });
  await sendOtpEmail({ to: user.email, otp, purpose });
}

async function issueSession(user, res) {
  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user._id });
  await user.addRefreshToken(hashToken(refreshToken), new Date(Date.now() + REFRESH_TOKEN_TTL_MS));
  setAuthCookies(res, accessToken, refreshToken);
  return accessToken;
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, avatar } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const user = await User.create({ name, email, password, role, avatar });
  await issueOtp(user, "verify-email");
  const accessToken = await issueSession(user, res);

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user: user.toSafeObject(), accessToken },
        "Account created. Check your email for a verification code."
      )
    );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password +refreshTokens");
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const accessToken = await issueSession(user, res);

  res.status(200).json(new ApiResponse(200, { user: user.toSafeObject(), accessToken }, "Logged in"));
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await User.findById(decoded.id).select("+refreshTokens");
      if (user) await user.removeRefreshToken(hashToken(token));
    } catch {
      // Token was already invalid/expired - nothing to revoke.
    }
  }

  clearAuthCookies(res);
  res.status(200).json(new ApiResponse(200, null, "Logged out"));
});

// Silently exchanges a valid refresh token (httpOnly cookie) for a new
// access + refresh token pair. Powers "persistent login" across reloads
// and long sessions without the user having to sign in again.
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    throw ApiError.unauthorized("No refresh token provided", "NO_REFRESH_TOKEN");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    clearAuthCookies(res);
    throw ApiError.unauthorized("Invalid or expired session, please log in again", "INVALID_REFRESH_TOKEN");
  }

  const hash = hashToken(token);
  const user = await User.findOne({ _id: decoded.id, "refreshTokens.hash": hash }).select(
    "+refreshTokens"
  );

  if (!user) {
    clearAuthCookies(res);
    throw ApiError.unauthorized("Session is no longer valid, please log in again", "REFRESH_TOKEN_REUSED");
  }

  // Rotate: invalidate the used refresh token and issue a brand new pair.
  await user.removeRefreshToken(hash);
  const accessToken = await issueSession(user, res);

  res
    .status(200)
    .json(new ApiResponse(200, { user: user.toSafeObject(), accessToken }, "Session refreshed"));
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, { user: req.user.toSafeObject() }, "OK"));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond the same way to avoid leaking which emails are registered
  if (user) {
    await issueOtp(user, "reset-password");
  }

  res
    .status(200)
    .json(new ApiResponse(200, null, "If that account exists, a verification code has been sent"));
});

// Resends an OTP for either the email-verification or reset-password flow.
export const sendOtp = asyncHandler(async (req, res) => {
  const { email, purpose = "verify-email" } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    if (purpose === "verify-email" && user.isVerified) {
      return res.status(200).json(new ApiResponse(200, null, "This account is already verified"));
    }
    await issueOtp(user, purpose);
  }

  res.status(200).json(new ApiResponse(200, null, "If that account exists, a code has been sent"));
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp, purpose = "verify-email" } = req.body;
  const user = await User.findOne({ email }).select("+otp +otpExpires +otpPurpose");

  const isValid =
    user &&
    user.otp === hashOtp(otp) &&
    user.otpPurpose === purpose &&
    user.otpExpires &&
    user.otpExpires.getTime() > Date.now();

  if (!isValid) {
    throw ApiError.badRequest("The code is invalid or has expired");
  }

  user.otp = undefined;
  user.otpExpires = undefined;
  user.otpPurpose = undefined;

  if (purpose === "verify-email") {
    user.isVerified = true;
    await user.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(new ApiResponse(200, { verified: true, user: user.toSafeObject() }, "Email verified"));
  }

  // reset-password: exchange the OTP for a short-lived reset token the
  // client will send back along with the new password.
  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordExpires = Date.now() + RESET_TOKEN_TTL_MS;
  await user.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(200, { resetToken }, "Code verified"));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const hashed = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: Date.now() },
  }).select("+refreshTokens");

  if (!user) {
    throw ApiError.badRequest("Reset link is invalid or has expired");
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  // Resetting the password invalidates every existing session for safety.
  user.refreshTokens = [];
  await user.save();

  clearAuthCookies(res);
  res.status(200).json(new ApiResponse(200, null, "Password has been reset. Please log in."));
});
