import { Router } from "express";
import { getUsers, getUserById, updateProfile, uploadProfileAvatar, deleteUser } from "../controllers/userController.js";
import { idParamValidator } from "../validators/taskValidators.js";
import { validate } from "../middleware/validate.js";
import { protect, authorize } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.get("/", protect, authorize("admin"), getUsers);
router.patch("/me", protect, updateProfile);
router.post("/me/avatar", protect, upload.single("avatar"), uploadProfileAvatar);
router.get("/:id", protect, idParamValidator, validate, getUserById);
router.delete("/:id", protect, authorize("admin"), idParamValidator, validate, deleteUser);

export default router;
