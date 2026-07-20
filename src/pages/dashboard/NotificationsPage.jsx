import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Tabs } from "../../components/common/Tabs.jsx";
import { SkeletonLoader } from "../../components/ui/Skeleton.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import {
  useNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "../../hooks/api/useNotifications.js";
import { formatRelativeTime } from "../../utils/format.js";

export function NotificationsPage() {
  const [active, setActive] = useState("All");
  usePageTitle("Notifications");

  const { data, isLoading, isError } = useNotificationsQuery();
  const notifications = data?.data?.notifications || [];
  const unreadCount = data?.data?.unreadCount ?? notifications.filter((n) => n.unread).length;

  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  const filtered = active === "Unread" ? notifications.filter((item) => item.unread) : notifications;

  return (
    <Card>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Notifications</h2>
          <p className="text-sm text-ink-500">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-full sm:w-56"><Tabs tabs={["All", "Unread"]} active={active} onChange={setActive} /></div>
          {unreadCount > 0 ? (
            <Button
              variant="secondary"
              disabled={markAllReadMutation.isPending}
              onClick={() => markAllReadMutation.mutate()}
            >
              Mark all read
            </Button>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <SkeletonLoader />
      ) : isError ? (
        <EmptyState title="Couldn't load notifications" message="Something went wrong reaching the server. Try again shortly." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={active === "Unread" ? "No unread notifications" : "No notifications yet"}
          message="Updates about your tasks and applications will show up here."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <motion.button
              key={item._id}
              type="button"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => item.unread && markReadMutation.mutate(item._id)}
              className="block w-full rounded-md border p-4 text-left transition hover:bg-ink-50 dark:hover:bg-ink-800/60"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-ink-500">{item.group}</p>
                  <h3 className="mt-1 font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">{item.body}</p>
                  <p className="mt-2 text-xs text-ink-400">{formatRelativeTime(item.createdAt)}</p>
                </div>
                {item.unread ? <Badge tone="green">Unread</Badge> : null}
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </Card>
  );
}
