import { Router } from "express";
import {
  getApplications,
  createApplication,
  updateApplicationStatus,
  deleteApplication,
} from "../controllers/applicationController.js";
import {
  createApplicationValidator,
  updateApplicationStatusValidator,
  applicationIdParamValidator,
} from "../validators/applicationValidators.js";
import { validate } from "../middleware/validate.js";
import { protect, authorize } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.get("/", protect, getApplications);

router.post(
  "/",
  protect,
  authorize("freelancer"),
  upload.array("attachments", 5),
  createApplicationValidator,
  validate,
  createApplication
);

router.patch(
  "/:id",
  protect,
  updateApplicationStatusValidator,
  validate,
  updateApplicationStatus
);

router.delete("/:id", protect, applicationIdParamValidator, validate, deleteApplication);

export default router;
