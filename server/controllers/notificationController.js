import { Notification } from "../models/Notification.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const filter = req.user ? { user: req.user._id, type: "notification" } : { type: "notification" };
  const [notifications, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }),
    Notification.countDocuments({ ...filter, unread: true }),
  ]);
  res.status(200).json(new ApiResponse(200, { notifications, unreadCount }, "OK"));
});

// GET /api/notifications/activity - powers the dashboard "Activity feed" card
export const getActivityFeed = asyncHandler(async (req, res) => {
  const filter = req.user ? { user: req.user._id, type: "activity" } : { type: "activity" };
  const limit = Math.min(20, Number(req.query.limit) || 8);
  const activity = await Notification.find(filter).sort({ createdAt: -1 }).limit(limit);
  res.status(200).json(new ApiResponse(200, { activity }, "OK"));
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { unread: false },
    { new: true }
  );
  if (!notification) throw ApiError.notFound("Notification not found");
  res.status(200).json(new ApiResponse(200, { notification }, "Marked as read"));
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const filter = req.user ? { user: req.user._id, type: "notification" } : { type: "notification" };
  await Notification.updateMany(filter, { unread: false });
  res.status(200).json(new ApiResponse(200, null, "All notifications marked as read"));
});
