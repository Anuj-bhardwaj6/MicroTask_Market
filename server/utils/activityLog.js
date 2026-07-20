import { Notification } from "../models/Notification.js";

// Activity-feed entries reuse the Notification collection with
// type: "activity" so they're stored and queried the same way as
// regular notifications, but rendered in a separate feed and never
// counted against the unread notification badge.
export async function logActivity(userId, title, body, { session } = {}) {
  if (!userId) return null;
  try {
    const [doc] = await Notification.create(
      [{ user: userId, type: "activity", group: "Today", title, body, unread: false }],
      { session }
    );
    return doc;
  } catch (err) {
    console.error("[activity] failed to log activity:", err.message);
    return null;
  }
}

export default logActivity;
