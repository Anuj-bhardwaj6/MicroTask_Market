import { body, param } from "express-validator";

export const createApplicationValidator = [
  body("task").isMongoId().withMessage("A valid task id is required"),
  body("proposal").trim().notEmpty().withMessage("Proposal is required"),
  body("bidAmount").isFloat({ min: 1 }).withMessage("Bid amount must be a positive number"),
  body("estimatedTime").trim().notEmpty().withMessage("Estimated time is required"),
];

export const updateApplicationStatusValidator = [
  param("id").isMongoId().withMessage("Invalid application id"),
  body("status").isIn(["Pending", "Accepted", "Rejected"]).withMessage("Invalid status"),
];

export const applicationIdParamValidator = [param("id").isMongoId().withMessage("Invalid application id")];
