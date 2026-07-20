import { body, param } from "express-validator";
import { CATEGORIES, PRIORITIES, TASK_STATUSES } from "../utils/constants.js";

export const createTaskValidator = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("category").trim().notEmpty().isIn(CATEGORIES).withMessage("Category is required"),
  body("budget").isFloat({ min: 0 }).withMessage("Budget must be a positive number"),
  body("description").optional().isString(),
  body("deadline").optional({ values: "falsy" }).isISO8601().withMessage("Deadline must be a valid date"),
  body("skills").optional(),
  body("priority").optional().isIn(PRIORITIES),
  body("publish").optional().isBoolean(),
];

export const updateTaskValidator = [
  param("id").isMongoId().withMessage("Invalid task id"),
  body("title").optional().trim().notEmpty(),
  body("category").optional().isIn(CATEGORIES),
  body("budget").optional().isFloat({ min: 0 }),
  body("deadline").optional({ values: "falsy" }).isISO8601(),
  body("priority").optional().isIn(PRIORITIES),
  body("status").optional().isIn(TASK_STATUSES),
  body("progress").optional().isInt({ min: 0, max: 100 }),
];

export const statusValidator = [
  body("status").isIn(TASK_STATUSES).withMessage(`Status must be one of: ${TASK_STATUSES.join(", ")}`),
];

export const idParamValidator = [param("id").isMongoId().withMessage("Invalid id")];

export const attachmentParamValidator = [
  param("id").isMongoId().withMessage("Invalid task id"),
  param("attachmentId").isMongoId().withMessage("Invalid attachment id"),
];
