import { useState } from "react";
import { Link } from "react-router-dom";
import { FiBell, FiMoon, FiSearch, FiSun } from "react-icons/fi";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotificationsQuery } from "../../hooks/api/useNotifications.js";
import { NotificationDropdown } from "../common/NotificationDropdown.jsx";
import { Avatar } from "../ui/Avatar.jsx";

export function Topbar({ title, subtitle }) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notificationsQuery = useNotificationsQuery({ enabled: Boolean(user) });
  const unreadCount = notificationsQuery.data?.data?.unreadCount || 0;
  const profilePath = user?.role ? `/${user.role}/profile` : "/login";

  return (
    <div className="sticky top-0 z-30 border-b bg-ink-50/90 px-4 py-4 backdrop-blur dark:bg-ink-950/90 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="pl-12 lg:pl-0">
          <p className="text-sm text-ink-500 dark:text-ink-400">Real-time marketplace</p>
          <h1 className="text-2xl font-semibold tracking-normal text-ink-950 dark:text-white">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <label className="relative hidden min-w-72 md:block">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input className="h-10 w-full rounded-md border bg-white pl-9 pr-3 text-sm dark:bg-ink-900" placeholder="Search tasks, people, payments" />
          </label>
          <button onClick={toggleTheme} className="rounded-md border bg-white p-2 dark:bg-ink-900" aria-label="Toggle theme">
            {theme === "dark" ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              className="relative rounded-md border bg-white p-2 dark:bg-ink-900"
              aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
            >
              <FiBell className="h-4 w-4" />
              {unreadCount > 0 ? (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-coral-500" />
              ) : null}
            </button>
            <NotificationDropdown open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
          </div>
          <Link
            to={profilePath}
            className="rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-ink-950"
            aria-label="Open profile"
            title="Open profile"
          >
            <Avatar src={user?.avatar} name={user?.name} />
          </Link>
        </div>
      </div>
    </div>
  );
}