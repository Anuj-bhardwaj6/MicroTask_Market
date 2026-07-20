import { FiCheck, FiMessageCircle, FiPaperclip, FiX } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { Avatar } from "../../components/ui/Avatar.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { SectionHeader } from "../../components/ui/SectionHeader.jsx";
import { SkeletonLoader } from "../../components/ui/Skeleton.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useApplicationsQuery, useUpdateApplicationStatusMutation } from "../../hooks/api/useApplications.js";
import { useStartConversationMutation } from "../../hooks/api/useChat.js";
import { applicationStatusTone, formatBudget } from "../../utils/format.js";

export function ApplicationsPage() {
  usePageTitle("Applications");
  const navigate = useNavigate();
  const { data, isLoading, isError } = useApplicationsQuery({});
  const applications = data?.data?.applications || [];
  const statusMutation = useUpdateApplicationStatusMutation();
  const startConversationMutation = useStartConversationMutation();

  const handleMessage = async (person) => {
    const res = await startConversationMutation.mutateAsync({ userId: person.applicant, taskId: person.task?._id });
    navigate(`/client/messages/${res.data.conversation._id}`);
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Application review" />
      {isLoading ? (
        <Card><SkeletonLoader /></Card>
      ) : isError ? (
        <EmptyState title="Couldn't load applications" message="Something went wrong reaching the server. Try again shortly." />
      ) : applications.length === 0 ? (
        <EmptyState
          title="No applications yet"
          message="Applications from freelancers on your published tasks will show up here."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          {applications.map((person) => (
            <Card key={person._id} interactive>
              <div className="flex items-center gap-3">
                <Avatar src={person.avatar} name={person.name} size="lg" />
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{person.name}</h3>
                  <p className="text-sm text-ink-500">{person.rating} rating</p>
                </div>
              </div>
              {person.task ? (
                <p className="mt-3 text-xs text-ink-500">
                  Applied to{" "}
                  <Link to={`/client/tasks/${person.task._id}`} className="font-medium underline">
                    {person.task.title}
                  </Link>
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone={applicationStatusTone(person.status)}>{person.status}</Badge>
                <Badge>Bid {formatBudget(person.bidAmount)}</Badge>
                <Badge>ETA {person.estimatedTime}</Badge>
              </div>
              <p className="mt-4 text-sm leading-6 text-ink-600 dark:text-ink-300">{person.proposal}</p>
              {(person.attachments || []).length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
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
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <Button
                    icon={FiCheck}
                    className="px-2"
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate({ id: person._id, status: "Accepted" })}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="secondary"
                    icon={FiMessageCircle}
                    className="px-2"
                    disabled={startConversationMutation.isPending}
                    onClick={() => handleMessage(person)}
                  >
                    Message
                  </Button>
                  <Button
                    variant="danger"
                    icon={FiX}
                    className="px-2"
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate({ id: person._id, status: "Rejected" })}
                  >
                    Reject
                  </Button>
                </div>
              ) : (
                <div className="mt-5">
                  <Button
                    variant="secondary"
                    icon={FiMessageCircle}
                    className="w-full"
                    disabled={startConversationMutation.isPending}
                    onClick={() => handleMessage(person)}
                  >
                    Message
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
