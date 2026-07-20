import { Router } from "express";
import authRoutes from "./authRoutes.js";
import taskRoutes from "./taskRoutes.js";
import applicationRoutes from "./applicationRoutes.js";
import chatRoutes from "./chatRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import walletRoutes from "./walletRoutes.js";
import userRoutes from "./userRoutes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "API is healthy", timestamp: Date.now() });
});

router.use("/auth", authRoutes);
router.use("/tasks", taskRoutes);
router.use("/applications", applicationRoutes);
router.use("/chat", chatRoutes);
router.use("/notifications", notificationRoutes);
router.use("/wallet", walletRoutes);
router.use("/users", userRoutes);

export default router;
