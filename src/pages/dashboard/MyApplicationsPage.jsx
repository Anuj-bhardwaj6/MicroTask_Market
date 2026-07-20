import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMessageCircle, FiPaperclip } from "react-icons/fi";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { SectionHeader } from "../../components/ui/SectionHeader.jsx";
import { Tabs } from "../../components/common/Tabs.jsx";
import { SkeletonLoader } from "../../components/ui/Skeleton.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useApplicationsQuery, useWithdrawApplicationMutation } from "../../hooks/api/useApplications.js";
import { useStartConversationMutation } from "../../hooks/api/useChat.js";
import { applicationStatusTone, formatBudget, formatDeadline, formatRelativeTime } from "../../utils/format.js";

const TABS = ["All", "Pending", "Accepted", "Rejected"];

export function MyApplicationsPage() {
  usePageTitle("Applied tasks");
  const [tab, setTab] = useState("All");

  const params = useMemo(() => {
    const p = { mine: true };
    if (tab !== "All") p.status = tab;
    return p;
  }, [tab]);

  const navigate = useNavigate();
  const { data, isLoading, isError } = useApplicationsQuery(params);
  const applications = data?.data?.applications || [];

  const withdrawMutation = useWithdrawApplicationMutation();
  const startConversationMutation = useStartConversationMutation();

  const handleMessage = async (task) => {
    if (!task?.client) return;
    const res = await startConversationMutation.mutateAsync({ userId: task.client, taskId: task._id });
    navigate(`/freelancer/messages/${res.data.conversation._id}`);
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Applied tasks" />
      <Card>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </Card>

      {isLoading ? (
        <Card><SkeletonLoader /></Card>
      ) : isError ? (
        <EmptyState title="Couldn't load applications" message="Something went wrong reaching the server. Try again shortly." />
      ) : applications.length === 0 ? (
        <EmptyState
          title="No applications yet"
          message="Tasks you apply to will show up here so you can track their status."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {applications.map((application) => {
            const task = application.task;
            return (
              <Card key={application._id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{task?.title || "Task removed"}</p>
                    <p className="mt-1 text-xs text-ink-500">
                      Applied {formatRelativeTime(application.createdAt)}
                    </p>
                  </div>
                  <Badge tone={applicationStatusTone(application.status)}>{application.status}</Badge>
                </div>

                <p className="mt-3 text-sm leading-6 text-ink-600 dark:text-ink-300">{application.proposal}</p>

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-ink-500">
                  <span>Your bid: {formatBudget(application.bidAmount)}</span>
                  <span>ETA: {application.estimatedTime}</span>
                  {task ? <span>Deadline: {formatDeadline(task.deadline)}</span> : null}
                </div>

                {(application.attachments || []).length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {application.attachments.map((att) => (
                      <a
                        key={att._id}
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-ink-50 dark:hover:bg-ink-800/60"
                      >
                        <FiPaperclip className="h-3 w-3" /> {att.name}
                      </a>
                    ))}
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  {task ? (
                    <Link to={`/freelancer/tasks/${task._id}`}>
                      <Button variant="secondary">View task</Button>
                    </Link>
                  ) : null}
                  {task?.client ? (
                    <Button
                      variant="secondary"
                      icon={FiMessageCircle}
                      disabled={startConversationMutation.isPending}
                      onClick={() => handleMessage(task)}
                    >
                      Message client
                    </Button>
                  ) : null}
                  {application.status === "Pending" ? (
                    <Button
                      variant="danger"
                      disabled={withdrawMutation.isPending}
                      onClick={() => {
                        if (window.confirm("Withdraw this application?")) {
                          withdrawMutation.mutate(application._id);
                        }
                      }}
                    >
                      Withdraw
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
