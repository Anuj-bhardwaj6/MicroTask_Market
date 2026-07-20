import { Notification } from "../models/Notification.js";

// Creates a real (bell/notifications-page) notification for a user, inside
// an optional transaction session, and pushes it over socket.io to that
// user's room (if they're connected) so the UI updates without a manual
// refresh.
export async function notifyUser(io, userId, { title, body, group = "Today" }, { session } = {}) {
  if (!userId) return null;

  const [notification] = await Notification.create(
    [{ user: userId, type: "notification", group, title, body, unread: true }],
    { session }
  );

  if (io) {
    io.to(`user:${userId}`).emit("notification:new", notification);
  }

  return notification;
}

export default notifyUser;
