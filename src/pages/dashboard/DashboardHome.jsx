import { FiActivity, FiBarChart2, FiCalendar, FiCreditCard, FiPlusCircle, FiTarget, FiTrendingUp } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Card, StatCard } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { SectionHeader } from "../../components/ui/SectionHeader.jsx";
import { SkeletonLoader } from "../../components/ui/Skeleton.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import {
  useTaskStatsQuery,
  useTaskInsightsQuery,
  useRecentTasksQuery,
  useActivityFeedQuery,
} from "../../hooks/api/useTasks.js";
import { useTransactionsQuery } from "../../hooks/api/useWallet.js";
import { formatBudget, formatDeadline, formatRelativeTime, formatSignedAmount, statusTone } from "../../utils/format.js";

const STAT_ICONS = [FiActivity, FiPlusCircle, FiCalendar, FiCreditCard];
const TASKS_PATH_BY_ROLE = { client: "/client/tasks", freelancer: "/freelancer/tasks", admin: "/admin/tasks" };

function InsightMetric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-md border bg-white p-4 dark:border-ink-800 dark:bg-ink-950">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-500 dark:text-ink-400">{label}</p>
        {Icon ? <Icon className="h-4 w-4 text-brand-600 dark:text-brand-300" aria-hidden="true" /> : null}
      </div>
      <p className="mt-2 text-xl font-semibold tracking-normal text-ink-950 dark:text-white">{value}</p>
    </div>
  );
}

function DashboardInsights({ query, role }) {
  const insights = query.data?.data || {};
  const pipeline = insights.pipeline || [];
  const categoryMix = insights.categoryMix || [];
  const benchmark = insights.benchmark || {};
  const urgentTasks = insights.urgentTasks || [];
  const recommendations = insights.recommendations || [];
  const maxCategory = Math.max(...categoryMix.map((item) => item.count), 1);
  const pipelineTotal = Math.max(pipeline.reduce((sum, item) => sum + item.count, 0), 1);

  if (query.isLoading) {
    return <Card><SkeletonLoader /></Card>;
  }

  return (
    <Card>
      <SectionHeader title={role === "admin" ? "Marketplace intelligence" : "Work intelligence"} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InsightMetric label="Average budget" value={formatBudget(benchmark.avgBudget)} icon={FiTrendingUp} />
        <InsightMetric label="Total value" value={formatBudget(benchmark.totalBudget)} icon={FiBarChart2} />
        <InsightMetric label="Applications" value={benchmark.applicationTotal || 0} icon={FiTarget} />
        <InsightMetric label="Net wallet flow" value={formatBudget(benchmark.netFlow)} icon={FiCreditCard} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr_1.1fr]">
        <div>
          <h3 className="text-sm font-semibold text-ink-950 dark:text-white">Pipeline</h3>
          <div className="mt-4 space-y-3">
            {pipeline.length === 0 ? (
              <p className="text-sm text-ink-500">No task pipeline yet.</p>
            ) : (
              pipeline.map((item) => (
                <div key={item.status}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.status}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-ink-100 dark:bg-ink-800">
                    <div className="h-2 rounded-full bg-brand-500" style={{ width: `${(item.count / pipelineTotal) * 100}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink-950 dark:text-white">Category mix</h3>
          <div className="mt-4 space-y-3">
            {categoryMix.length === 0 ? (
              <p className="text-sm text-ink-500">No category data yet.</p>
            ) : (
              categoryMix.map((item) => (
                <div key={item.category} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-ink-600 dark:text-ink-300">{item.category}</span>
                  <div className="h-2 flex-1 rounded-full bg-ink-100 dark:bg-ink-800">
                    <div className="h-2 rounded-full bg-coral-500" style={{ width: `${(item.count / maxCategory) * 100}%` }} />
                  </div>
                  <span className="w-10 text-right font-semibold">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink-950 dark:text-white">Next best actions</h3>
          <div className="mt-4 space-y-3">
            {recommendations.length === 0 ? (
              <p className="text-sm text-ink-500">Post, apply, or complete tasks to unlock guidance.</p>
            ) : (
              recommendations.map((item) => (
                <div key={item} className="rounded-md border p-3 text-sm dark:border-ink-800">
                  {item}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {urgentTasks.length > 0 ? (
        <div className="mt-6 border-t pt-5 dark:border-ink-800">
          <h3 className="text-sm font-semibold text-ink-950 dark:text-white">Upcoming deadlines</h3>
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            {urgentTasks.map((task) => (
              <div key={task._id} className="rounded-md border p-3 text-sm dark:border-ink-800">
                <div className="flex items-center justify-between gap-3">
                  <Badge tone={statusTone(task.status)}>{task.status}</Badge>
                  <span className="font-semibold">{formatBudget(task.budget)}</span>
                </div>
                <p className="mt-3 font-medium">{task.title}</p>
                <p className="mt-1 text-ink-500">{formatDeadline(task.deadline)}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

export function DashboardHome({ role }) {
  usePageTitle(`${role} dashboard`);

  const statsQuery = useTaskStatsQuery();
  const insightsQuery = useTaskInsightsQuery();
  const recentQuery = useRecentTasksQuery({ limit: 5 });
  const activityQuery = useActivityFeedQuery({ limit: 6 });
  const transactionsQuery = useTransactionsQuery({ limit: 3 });

  const stats = statsQuery.data?.data?.stats || [];
  const recentTasks = recentQuery.data?.data?.tasks || [];
  const activity = activityQuery.data?.data?.activity || [];
  const transactions = transactionsQuery.data?.data?.transactions || [];

  const freelancerStats = role === "freelancer"
    ? {
        assigned: Number(stats.find((item) => item.label === "Assigned to you")?.value || 0),
        completed: Number(stats.find((item) => item.label === "Completed")?.value || 0),
      }
    : null;
  const throughputPercent = freelancerStats && freelancerStats.assigned > 0
    ? Math.min(100, Math.round((freelancerStats.completed / freelancerStats.assigned) * 100))
    : 0;
  const throughputLabel = role === "freelancer"
    ? `${throughputPercent}% completion pace`
    : "Live marketplace activity";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsQuery.isLoading ? (
          <SkeletonLoader />
        ) : (
          stats.map((stat, index) => <StatCard key={stat.label} {...stat} icon={STAT_ICONS[index]} />)
        )}
      </div>

      <DashboardInsights query={insightsQuery} role={role} />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <SectionHeader
            title={role === "client" ? "Recent tasks" : "Platform throughput"}
            action={
              <Link to={TASKS_PATH_BY_ROLE[role]}>
                <Button variant="secondary">View all</Button>
              </Link>
            }
          />
          {recentQuery.isLoading || statsQuery.isLoading ? (
            <SkeletonLoader />
          ) : role === "freelancer" ? (
            <div className="space-y-4">
              <div className="rounded-md border border-brand-200 bg-brand-50 p-4 dark:border-brand-900/50 dark:bg-brand-950/30">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-brand-700 dark:text-brand-200">Current throughput</p>
                    <p className="text-2xl font-semibold text-ink-950 dark:text-white">{throughputLabel}</p>
                  </div>
                  <div className="text-sm text-ink-600 dark:text-ink-300">
                    <p>{freelancerStats?.completed || 0} completed</p>
                    <p>{freelancerStats?.assigned || 0} assigned</p>
                  </div>
                </div>
              </div>
              {recentTasks.length === 0 ? (
                <EmptyState title="No tasks yet" message="Tasks you post or get matched to will show up here." />
              ) : (
                <div className="space-y-3">
                  {recentTasks.map((task) => (
                    <Link
                      key={task._id}
                      to={`/${role === "freelancer" ? "freelancer" : role === "admin" ? "admin" : "client"}/tasks/${task._id}`}
                      className="block rounded-md border p-4 transition hover:bg-ink-50 dark:hover:bg-ink-800/60"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold">{task.title}</p>
                          <p className="mt-1 text-sm text-ink-500">
                            {task.clientName || "Unassigned"} - {formatDeadline(task.deadline)}
                          </p>
                        </div>
                        <span className="text-sm font-semibold">{formatBudget(task.budget)}</span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-ink-100 dark:bg-ink-800">
                        <div className="h-2 rounded-full bg-brand-500" style={{ width: `${task.progress || 0}%` }} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : recentTasks.length === 0 ? (
            <EmptyState title="No tasks yet" message="Tasks you post or get matched to will show up here." />
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <Link
                  key={task._id}
                  to={`/${role === "freelancer" ? "freelancer" : role === "admin" ? "admin" : "client"}/tasks/${task._id}`}
                  className="block rounded-md border p-4 transition hover:bg-ink-50 dark:hover:bg-ink-800/60"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">{task.title}</p>
                      <p className="mt-1 text-sm text-ink-500">
                        {task.clientName || "Unassigned"} - {formatDeadline(task.deadline)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">{formatBudget(task.budget)}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-ink-100 dark:bg-ink-800">
                    <div className="h-2 rounded-full bg-brand-500" style={{ width: `${task.progress || 0}%` }} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
        <div className="space-y-6">
          <Card>
            <SectionHeader title="Activity feed" />
            {activityQuery.isLoading ? (
              <SkeletonLoader />
            ) : activity.length === 0 ? (
              <p className="text-sm text-ink-500">No activity yet. Actions on your tasks will appear here.</p>
            ) : (
              <div className="space-y-4">
                {activity.map((item) => (
                  <div key={item._id} className="flex gap-3 text-sm">
                    <span className="mt-1 h-2 w-2 rounded-full bg-brand-500" />
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-ink-500">{item.body}</p>
                      <p className="mt-0.5 text-xs text-ink-400">{formatRelativeTime(item.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card>
            <SectionHeader title={role === "freelancer" ? "Performance" : "Recent payments"} />
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <p className="text-sm text-ink-500">No payment activity yet.</p>
              ) : (
                transactions.map((item) => (
                  <div key={item._id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="line-clamp-1">{item.label}</span>
                    <span
                      className={`font-semibold ${item.direction === "debit" ? "text-coral-600 dark:text-coral-300" : "text-brand-700 dark:text-brand-300"}`}
                    >
                      {formatSignedAmount(item)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
