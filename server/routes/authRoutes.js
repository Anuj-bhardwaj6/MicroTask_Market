import { Router } from "express";
import {
  register,
  login,
  logout,
  refreshAccessToken,
  getMe,
  forgotPassword,
  resetPassword,
  sendOtp,
  verifyOtp,
} from "../controllers/authController.js";
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  otpValidator,
  sendOtpValidator,
} from "../validators/authValidators.js";
import { validate } from "../middleware/validate.js";
import { protect } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/register", authLimiter, registerValidator, validate, register);
router.post("/login", authLimiter, loginValidator, validate, login);
router.post("/logout", logout);
router.post("/refresh-token", refreshAccessToken);
router.get("/me", protect, getMe);
router.post("/forgot-password", authLimiter, forgotPasswordValidator, validate, forgotPassword);
router.post("/reset-password", authLimiter, resetPasswordValidator, validate, resetPassword);
router.post("/otp/send", authLimiter, sendOtpValidator, validate, sendOtp);
router.post("/otp/verify", authLimiter, otpValidator, validate, verifyOtp);

export default router;
