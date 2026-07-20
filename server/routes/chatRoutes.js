import { Router } from "express";
import {
  getConversations,
  startConversation,
  getMessages,
  sendMessage,
  markConversationRead,
} from "../controllers/chatController.js";
import {
  startConversationValidator,
  conversationIdParamValidator,
  sendMessageValidator,
} from "../validators/chatValidators.js";
import { validate } from "../middleware/validate.js";
import { protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.get("/conversations", protect, getConversations);
router.post("/conversations", protect, startConversationValidator, validate, startConversation);

router.get(
  "/conversations/:id/messages",
  protect,
  conversationIdParamValidator,
  validate,
  getMessages
);
router.post(
  "/conversations/:id/messages",
  protect,
  upload.array("attachments", 5),
  sendMessageValidator,
  validate,
  sendMessage
);
router.patch(
  "/conversations/:id/read",
  protect,
  conversationIdParamValidator,
  validate,
  markConversationRead
);

export default router;
