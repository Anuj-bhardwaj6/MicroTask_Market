import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FiBell } from "react-icons/fi";
import { Badge } from "../ui/Badge.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotificationsQuery, useMarkNotificationReadMutation } from "../../hooks/api/useNotifications.js";
import { formatRelativeTime } from "../../utils/format.js";

export function NotificationDropdown({ open, onClose }) {
  const { user } = useAuth();
  const ref = useRef(null);

  const { data, isLoading } = useNotificationsQuery({ enabled: Boolean(user) && open });
  const notifications = (data?.data?.notifications || []).slice(0, 8);
  const unreadCount = data?.data?.unreadCount || 0;
  const markReadMutation = useMarkNotificationReadMutation();

  useEffect(() => {
    if (!open) return undefined;
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-40 mt-2 w-80 rounded-md border bg-white shadow-lg dark:bg-ink-900 sm:w-96"
    >
      <div className="flex items-center justify-between border-b p-3">
        <h3 className="text-sm font-semibold">Notifications</h3>
        {unreadCount > 0 ? <Badge tone="green">{unreadCount} new</Badge> : null}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <p className="p-4 text-center text-sm text-ink-500">Loading...</p>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-ink-500">
            <FiBell className="h-6 w-6 text-ink-300" />
            You're all caught up
          </div>
        ) : (
          <ul className="divide-y">
            {notifications.map((item) => (
              <li key={item._id}>
                <button
                  type="button"
                  onClick={() => item.unread && markReadMutation.mutate(item._id)}
                  className="flex w-full flex-col gap-0.5 px-4 py-3 text-left text-sm hover:bg-ink-50 dark:hover:bg-ink-800/60"
                >
                  <span className="flex items-center gap-2">
                    {item.unread ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" /> : null}
                    <span className="font-medium">{item.title}</span>
                  </span>
                  <span className="line-clamp-2 text-ink-500">{item.body}</span>
                  <span className="text-xs text-ink-400">{formatRelativeTime(item.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        to={user ? `/${user.role}/notifications` : "#"}
        onClick={onClose}
        className="block border-t p-3 text-center text-sm font-medium text-brand-700 hover:bg-ink-50 dark:text-brand-300 dark:hover:bg-ink-800/60"
      >
        View all notifications
      </Link>
    </div>
  );
}
