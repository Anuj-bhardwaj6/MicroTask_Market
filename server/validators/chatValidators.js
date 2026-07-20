import { body, param } from "express-validator";

export const startConversationValidator = [
  body("userId").isMongoId().withMessage("A valid userId is required"),
  body("taskId").optional({ values: "falsy" }).isMongoId().withMessage("Invalid taskId"),
];

export const conversationIdParamValidator = [param("id").isMongoId().withMessage("Invalid conversation id")];

export const sendMessageValidator = [
  param("id").isMongoId().withMessage("Invalid conversation id"),
  body("text").optional({ values: "falsy" }).isString().isLength({ max: 4000 }),
];
