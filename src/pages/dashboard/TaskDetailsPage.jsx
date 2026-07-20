import { useState } from "react";
import {
  FiBookmark,
  FiCheck,
  FiDollarSign,
  FiDownload,
  FiMessageCircle,
  FiPaperclip,
  FiShare2,
  FiX,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "../../components/ui/Badge.jsx";
import { Avatar } from "../../components/ui/Avatar.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Select } from "../../components/ui/Input.jsx";
import { SectionHeader } from "../../components/ui/SectionHeader.jsx";
import { Accordion } from "../../components/common/Accordion.jsx";
import { ApplyTaskModal } from "../../components/common/ApplyTaskModal.jsx";
import { SkeletonLoader } from "../../components/ui/Skeleton.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTaskQuery, useUpdateTaskStatusMutation, useToggleBookmarkMutation } from "../../hooks/api/useTasks.js";
import {
  useApplicationsQuery,
  useUpdateApplicationStatusMutation,
  useWithdrawApplicationMutation,
} from "../../hooks/api/useApplications.js";
import { useStartConversationMutation } from "../../hooks/api/useChat.js";
import { useReleasePaymentMutation, usePayForTaskMutation, useRefundPaymentMutation } from "../../hooks/api/useWallet.js";
import {
  applicationStatusTone,
  formatBudget,
  formatDeadline,
  formatFileSize,
  statusTone,
  escrowStatusTone,
  escrowStatusLabel,
} from "../../utils/format.js";

const TASK_STATUSES = ["Open", "In Progress", "Completed", "Cancelled", "Expired"];

export function TaskDetailsPage({ role = "client" }) {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applyOpen, setApplyOpen] = useState(false);

  const taskQuery = useTaskQuery(id);
  const statusMutation = useUpdateTaskStatusMutation();
  const bookmarkMutation = useToggleBookmarkMutation();
  const startConversationMutation = useStartConversationMutation();
  const releasePaymentMutation = useReleasePaymentMutation();
  const payForTaskMutation = usePayForTaskMutation();
  const refundPaymentMutation = useRefundPaymentMutation();

  const task = taskQuery.data?.data?.task;
  usePageTitle(task?.title || "Task details");

  const handleMessage = async (userId) => {
    if (!userId) return;
    const res = await startConversationMutation.mutateAsync({ userId, taskId: task._id });
    navigate(`/${role}/messages/${res.data.conversation._id}`);
  };

  const handlePayForTask = async () => {
    if (!window.confirm(`Fund escrow with ${formatBudget(task.budget)} for "${task.title}"?`)) return;
    const res = await payForTaskMutation.mutateAsync(task._id);
    const checkoutUrl = res?.data?.checkoutUrl;
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  };

  const handleRefund = () => {
    if (window.confirm(`Refund the held escrow of ${formatBudget(task.escrow?.amount || task.budget)} back to the client?`)) {
      refundPaymentMutation.mutate(task._id);
    }
  };

  // Freelancer: has this person already applied to this task?
  const myApplicationQuery = useApplicationsQuery(
    { mine: true, task: task?._id },
    { enabled: role === "freelancer" && Boolean(task?._id) }
  );
  const myApplication = role === "freelancer" ? myApplicationQuery.data?.data?.applications?.[0] : null;
  const withdrawMutation = useWithdrawApplicationMutation();

  // Client: applicants for this task.
  const applicantsQuery = useApplicationsQuery(
    { task: task?._id },
    { enabled: role === "client" && Boolean(task?._id) }
  );
  const applicants = role === "client" ? applicantsQuery.data?.data?.applications || [] : [];
  const applicationStatusMutation = useUpdateApplicationStatusMutation();

  if (taskQuery.isLoading) {
    return <Card><SkeletonLoader /></Card>;
  }

  if (taskQuery.isError || !task) {
    return <EmptyState title="Task not found" message="This task may have been removed or is no longer available." />;
  }

  const isOwner = user && task.client && user._id === task.client;
  const isAssignee = user && task.assignedTo && user._id === task.assignedTo;
  const canChangeStatus = isOwner || isAssignee;
  const canApply = role === "freelancer" && !isOwner && task.stage === "published" && task.status === "Open";

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
      <Card>
        <SectionHeader eyebrow={task.taskId} title={task.title} action={
          role === "freelancer" ? (
            <div className="flex flex-wrap gap-2">
              {myApplication ? (
                <Badge tone={applicationStatusTone(myApplication.status)}>
                  Application {myApplication.status}
                </Badge>
              ) : canApply ? (
                <Button onClick={() => setApplyOpen(true)}>Apply now</Button>
              ) : (
                <Badge tone="neutral">Not accepting applications</Badge>
              )}
              {myApplication?.status === "Pending" ? (
                <Button
                  variant="danger"
                  disabled={withdrawMutation.isPending}
                  onClick={() => {
                    if (window.confirm("Withdraw your application for this task?")) {
                      withdrawMutation.mutate(myApplication._id);
                    }
                  }}
                >
                  Withdraw
                </Button>
              ) : null}
              <Button
                variant={task.isBookmarked ? "primary" : "secondary"}
                icon={FiBookmark}
                disabled={bookmarkMutation.isPending}
                onClick={() => bookmarkMutation.mutate(task._id)}
              >
                {task.isBookmarked ? "Saved" : "Save"}
              </Button>
              <Button variant="ghost" icon={FiShare2}>Share</Button>
              {task.client ? (
                <Button
                  variant="secondary"
                  icon={FiMessageCircle}
                  disabled={startConversationMutation.isPending}
                  onClick={() => handleMessage(task.client)}
                >
                  Message client
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {task.assignedTo ? (
                <Button
                  icon={FiMessageCircle}
                  disabled={startConversationMutation.isPending}
                  onClick={() => handleMessage(task.assignedTo)}
                >
                  Message {task.assignedToName || "freelancer"}
                </Button>
              ) : null}
              {isOwner && task.assignedTo && (!task.escrow || task.escrow.status === "none") ? (
                <Button
                  variant="accent"
                  icon={FiDollarSign}
                  disabled={payForTaskMutation.isPending}
                  onClick={handlePayForTask}
                >
                  {payForTaskMutation.isPending ? "Processing..." : `Fund escrow - ${formatBudget(task.budget)}`}
                </Button>
              ) : null}
              {isOwner && task.status === "Completed" && task.assignedTo && task.escrow?.status === "held" ? (
                <Button
                  variant="accent"
                  icon={FiDollarSign}
                  disabled={releasePaymentMutation.isPending}
                  onClick={() => {
                    if (window.confirm(`Release ${formatBudget(task.budget)} to ${task.assignedToName || "the freelancer"}?`)) {
                      releasePaymentMutation.mutate(task._id);
                    }
                  }}
                >
                  Release payment
                </Button>
              ) : null}
              {isOwner && task.escrow?.status === "held" && task.status !== "Completed" ? (
                <Button variant="danger" disabled={refundPaymentMutation.isPending} onClick={handleRefund}>
                  Refund escrow
                </Button>
              ) : null}
              {task.escrow && task.escrow.status !== "none" ? (
                <Badge tone={escrowStatusTone(task.escrow.status)}>{escrowStatusLabel(task.escrow.status)}</Badge>
              ) : null}
            </div>
          )
        } />
        <p className="leading-7 text-ink-600 dark:text-ink-300">{task.description || "No description provided."}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {[
            ["Budget", formatBudget(task.budget)],
            ["Deadline", formatDeadline(task.deadline)],
            ["Status", task.status],
            ["Progress", `${task.progress || 0}%`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border p-3">
              <p className="text-xs text-ink-500">{label}</p>
              <p className="mt-1 font-semibold">{value}</p>
            </div>
          ))}
        </div>

        {canChangeStatus ? (
          <div className="mt-5 flex items-center gap-3">
            <span className="text-sm font-medium">Update status</span>
            <Select
              className="max-w-[220px]"
              value={task.status}
              disabled={statusMutation.isPending}
              onChange={(e) => statusMutation.mutate({ id: task._id, status: e.target.value })}
            >
              {TASK_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
            <Badge tone={statusTone(task.status)}>{task.status}</Badge>
          </div>
        ) : null}

        <div className="mt-6">
          <h3 className="mb-3 font-semibold">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {(task.skills || []).length > 0 ? task.skills.map((skill) => <Badge key={skill}>{skill}</Badge>) : <p className="text-sm text-ink-500">No skills listed.</p>}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-3 font-semibold">Attachments</h3>
          {(task.attachments || []).length > 0 ? (
            <div className="space-y-2">
              {task.attachments.map((att) => (
                <a
                  key={att._id}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-ink-50 dark:hover:bg-ink-800/60"
                >
                  <span className="truncate">{att.name}</span>
                  <span className="flex items-center gap-2 text-ink-500">
                    {formatFileSize(att.size)} <FiDownload className="h-4 w-4" />
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-500">No files attached to this task yet.</p>
          )}
        </div>

        <div className="mt-6">
          <Accordion items={[
            { title: "Timeline", body: `Posted by ${task.clientName || "a client"} - currently ${task.status.toLowerCase()}.` },
            { title: "Comments", body: "Comments and file exchanges will appear here once the task is underway." },
            { title: "Reviews", body: "Reviews are shared once the task is marked completed." },
          ]} />
        </div>
      </Card>
      <Card>
        <SectionHeader title={role === "client" ? `Applicants (${applicants.length})` : "Client information"} />
        {role === "client" ? (
          applicantsQuery.isLoading ? (
            <SkeletonLoader />
          ) : applicants.length === 0 ? (
            <p className="text-sm text-ink-500">No applications yet. Check back once freelancers start applying.</p>
          ) : (
            <div className="space-y-4">
              {applicants.map((person) => (
                <div key={person._id} className="rounded-md border p-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={person.avatar} name={person.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{person.name}</p>
                      <p className="text-sm text-ink-500">{person.rating} rating</p>
                    </div>
                    <Badge tone={applicationStatusTone(person.status)}>{person.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">{person.proposal}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink-500">
                    <span>Bid: {formatBudget(person.bidAmount)}</span>
                    <span>ETA: {person.estimatedTime}</span>
                  </div>
                  {(person.attachments || []).length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {person.attachments.map((att) => (
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
                  {person.status === "Pending" ? (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <Button
                        icon={FiCheck}
                        className="px-2"
                        disabled={applicationStatusMutation.isPending}
                        onClick={() => applicationStatusMutation.mutate({ id: person._id, status: "Accepted" })}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="secondary"
                        icon={FiMessageCircle}
                        className="px-2"
                        disabled={startConversationMutation.isPending}
                        onClick={() => handleMessage(person.applicant)}
                      >
                        Message
                      </Button>
                      <Button
                        variant="danger"
                        icon={FiX}
                        className="px-2"
                        disabled={applicationStatusMutation.isPending}
                        onClick={() => applicationStatusMutation.mutate({ id: person._id, status: "Rejected" })}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <Button
                        variant="secondary"
                        icon={FiMessageCircle}
                        className="w-full"
                        disabled={startConversationMutation.isPending}
                        onClick={() => handleMessage(person.applicant)}
                      >
                        Message
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-3 text-sm">
            <p><strong>{task.clientName || "This client"}</strong> posted this task{task.category ? ` in ${task.category}` : ""}.</p>
            <p>Budget: {formatBudget(task.budget)} - Priority: {task.priority}</p>
          </div>
        )}
      </Card>

      {role === "freelancer" ? (
        <ApplyTaskModal open={applyOpen} onClose={() => setApplyOpen(false)} task={task} />
      ) : null}
    </div>
  );
}
