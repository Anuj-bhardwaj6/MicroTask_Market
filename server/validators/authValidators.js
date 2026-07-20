import { body } from "express-validator";

export const registerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("role")
    .optional()
    .isIn(["client", "freelancer", "admin"])
    .withMessage("Role must be client, freelancer or admin"),
];

export const loginValidator = [
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

export const forgotPasswordValidator = [
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
];

export const resetPasswordValidator = [
  body("token").notEmpty().withMessage("Reset token is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
];

export const otpValidator = [
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("otp").isLength({ min: 6, max: 6 }).withMessage("Enter the 6-digit code"),
  body("purpose")
    .optional()
    .isIn(["verify-email", "reset-password"])
    .withMessage("Invalid purpose"),
];

export const sendOtpValidator = [
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("purpose")
    .optional()
    .isIn(["verify-email", "reset-password"])
    .withMessage("Invalid purpose"),
];
