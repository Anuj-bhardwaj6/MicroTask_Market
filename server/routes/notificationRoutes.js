import { Router } from "express";
import {
  getNotifications,
  getActivityFeed,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController.js";
import { idParamValidator } from "../validators/taskValidators.js";
import { validate } from "../middleware/validate.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.get("/", protect, getNotifications);
router.get("/activity", protect, getActivityFeed);
router.patch("/read-all", protect, markAllAsRead);
router.patch("/:id/read", protect, idParamValidator, validate, markAsRead);

export default router;
