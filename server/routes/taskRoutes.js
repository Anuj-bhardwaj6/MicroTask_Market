import { Router } from "express";
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  publishTask,
  archiveTask,
  updateTaskStatus,
  uploadAttachments,
  deleteAttachment,
  getDashboardStats,
  getDashboardInsights,
  getRecentTasks,
  toggleBookmark,
} from "../controllers/taskController.js";
import {
  createTaskValidator,
  updateTaskValidator,
  statusValidator,
  idParamValidator,
  attachmentParamValidator,
} from "../validators/taskValidators.js";
import { validate } from "../middleware/validate.js";
import { protect, authorize, attachUserIfPresent } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

// Dashboard routes must come before "/:id" so they aren't swallowed by it.
router.get("/dashboard/stats", protect, getDashboardStats);
router.get("/dashboard/insights", protect, getDashboardInsights);
router.get("/dashboard/recent", protect, getRecentTasks);

router.get("/", attachUserIfPresent, getTasks);
router.get("/:id", idParamValidator, validate, attachUserIfPresent, getTaskById);

router.post("/", protect, authorize("client", "admin"), createTaskValidator, validate, createTask);
router.patch("/:id", protect, updateTaskValidator, validate, updateTask);
router.patch("/:id/publish", protect, idParamValidator, validate, publishTask);
router.patch("/:id/archive", protect, idParamValidator, validate, archiveTask);
router.patch("/:id/status", protect, idParamValidator, statusValidator, validate, updateTaskStatus);
router.patch(
  "/:id/bookmark",
  protect,
  authorize("freelancer"),
  idParamValidator,
  validate,
  toggleBookmark
);

router.post(
  "/:id/attachments",
  protect,
  idParamValidator,
  validate,
  upload.array("files", 5),
  uploadAttachments
);
router.delete(
  "/:id/attachments/:attachmentId",
  protect,
  attachmentParamValidator,
  validate,
  deleteAttachment
);

router.delete("/:id", protect, authorize("client", "admin"), idParamValidator, validate, deleteTask);

export default router;


