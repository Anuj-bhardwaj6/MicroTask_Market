import { useEffect, useMemo, useState } from "react";
import { FiBookmark, FiGrid, FiList, FiSearch } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Input, Select } from "../../components/ui/Input.jsx";
import { SectionHeader } from "../../components/ui/SectionHeader.jsx";
import { Pagination } from "../../components/common/Pagination.jsx";
import { SkeletonLoader } from "../../components/ui/Skeleton.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { categories } from "../../data/sampleData.js";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import {
  useTasksQuery,
  useDeleteTaskMutation,
  usePublishTaskMutation,
  useArchiveTaskMutation,
  useToggleBookmarkMutation,
} from "../../hooks/api/useTasks.js";
import { formatBudget, formatDeadline, priorityTone, statusTone } from "../../utils/format.js";

const TASK_STATUSES = ["Open", "In Progress", "Completed", "Cancelled", "Expired"];
const DEADLINE_PRESETS = [
  { label: "Any deadline", value: "" },
  { label: "Due today", value: "today" },
  { label: "Due this week", value: "week" },
  { label: "Due this month", value: "month" },
];
const MAX_BUDGET = 5000;
const PAGE_SIZE = 9;

function deadlineRangeFor(preset) {
  if (!preset) return {};
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (preset === "today") {
    const end = new Date(startOfToday);
    end.setDate(end.getDate() + 1);
    return { deadlineFrom: startOfToday.toISOString(), deadlineTo: end.toISOString() };
  }
  if (preset === "week") {
    const end = new Date(startOfToday);
    end.setDate(end.getDate() + 7);
    return { deadlineFrom: startOfToday.toISOString(), deadlineTo: end.toISOString() };
  }
  if (preset === "month") {
    const end = new Date(startOfToday);
    end.setMonth(end.getMonth() + 1);
    return { deadlineFrom: startOfToday.toISOString(), deadlineTo: end.toISOString() };
  }
  return {};
}

// mode: "client" | "freelancer"
// assignedOnly + fixedStatus: used for the freelancer "Ongoing"/"Completed" views,
// which reuse this same browse UI but scoped to tasks assigned to the caller.
export function TaskListPage({ mode = "client", assignedOnly = false, fixedStatus = "", title }) {
  const isFreelancerBrowse = mode === "freelancer" && !assignedOnly;

  const [view, setView] = useState("grid");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [skills, setSkills] = useState("");
  const [debouncedSkills, setDebouncedSkills] = useState("");
  const [deadlinePreset, setDeadlinePreset] = useState("");
  const [budgetMax, setBudgetMax] = useState(MAX_BUDGET);
  const [budgetTouched, setBudgetTouched] = useState(false);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);

  usePageTitle(title || (mode === "freelancer" ? "Browse tasks" : "Tasks"));

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSkills(skills.trim()), 350);
    return () => clearTimeout(timer);
  }, [skills]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, status, debouncedSkills, deadlinePreset, budgetMax, bookmarkedOnly]);

  const queryParams = useMemo(() => {
    const params = { page, limit: PAGE_SIZE };
    if (debouncedSearch) params.search = debouncedSearch;
    if (category) params.category = category;

    if (assignedOnly) {
      params.assignedToMe = true;
      if (fixedStatus) params.status = fixedStatus;
    } else if (mode === "client") {
      params.mine = true;
      if (status) params.status = status;
    } else if (bookmarkedOnly) {
      params.bookmarked = true;
      if (status) params.status = status;
    } else {
      if (status) params.status = status;
    }

    if (isFreelancerBrowse) {
      if (debouncedSkills) params.skills = debouncedSkills;
      if (budgetTouched) params.budgetMax = budgetMax;
      Object.assign(params, deadlineRangeFor(deadlinePreset));
    }

    return params;
  }, [
    page,
    debouncedSearch,
    category,
    status,
    mode,
    assignedOnly,
    fixedStatus,
    isFreelancerBrowse,
    debouncedSkills,
    deadlinePreset,
    budgetMax,
    budgetTouched,
    bookmarkedOnly,
  ]);

  const { data, isLoading, isError } = useTasksQuery(queryParams);
  const tasks = data?.data?.tasks || [];
  const pagination = data?.data?.pagination;

  const deleteMutation = useDeleteTaskMutation();
  const publishMutation = usePublishTaskMutation();
  const archiveMutation = useArchiveTaskMutation();
  const bookmarkMutation = useToggleBookmarkMutation();

  const detailsBasePath = mode === "freelancer" ? "freelancer" : "client";

  const handleDelete = (task) => {
    if (window.confirm(`Delete "${task.title}"? This can't be undone.`)) {
      deleteMutation.mutate(task._id);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title={title || (mode === "freelancer" ? (assignedOnly ? "My tasks" : "Browse matched tasks") : "My tasks")}
      />
      <Card>
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.5fr]">
          <Input
            placeholder="Search by title, skill, or category"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </Select>
          {assignedOnly ? (
            <div className="flex items-center rounded-md border px-3 text-sm text-ink-500">
              {fixedStatus || "All statuses"}
            </div>
          ) : (
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {TASK_STATUSES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
          )}
          <div className="flex rounded-md border p-1">
            <button onClick={() => setView("grid")} className={`flex-1 rounded p-2 ${view === "grid" ? "bg-ink-950 text-white dark:bg-white dark:text-ink-950" : ""}`} aria-label="Grid view"><FiGrid className="mx-auto h-4 w-4" /></button>
            <button onClick={() => setView("list")} className={`flex-1 rounded p-2 ${view === "list" ? "bg-ink-950 text-white dark:bg-white dark:text-ink-950" : ""}`} aria-label="List view"><FiList className="mx-auto h-4 w-4" /></button>
          </div>
        </div>

        {isFreelancerBrowse ? (
          <div className="mt-4 grid gap-3 border-t pt-4 lg:grid-cols-[1fr_0.8fr_1.4fr_auto]">
            <Input
              placeholder="Filter by skill (e.g. Figma)"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
            <Select value={deadlinePreset} onChange={(e) => setDeadlinePreset(e.target.value)}>
              {DEADLINE_PRESETS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </Select>
            <label className="block text-sm font-medium">
              Budget up to {formatBudget(budgetMax)}
              <input
                type="range"
                min="50"
                max={MAX_BUDGET}
                step="50"
                value={budgetMax}
                className="mt-2 w-full accent-brand-600"
                aria-label="Budget filter"
                onChange={(e) => {
                  setBudgetTouched(true);
                  setBudgetMax(Number(e.target.value));
                }}
              />
            </label>
            <Button
              variant={bookmarkedOnly ? "primary" : "secondary"}
              icon={FiBookmark}
              onClick={() => setBookmarkedOnly((prev) => !prev)}
            >
              {bookmarkedOnly ? "Saved only" : "Show saved"}
            </Button>
          </div>
        ) : null}
      </Card>

      {isLoading ? (
        <Card><SkeletonLoader /></Card>
      ) : isError ? (
        <EmptyState title="Couldn't load tasks" message="Something went wrong reaching the server. Try again shortly." />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          message={mode === "client" ? "Post a task or adjust your filters to see results." : "No matching tasks right now - try a different search or category."}
        />
      ) : (
        <div className={view === "grid" ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
          {tasks.map((task) => (
            <Card key={task._id} interactive>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
                    <Badge tone={statusTone(task.status)}>{task.status}</Badge>
                    {mode === "client" && task.stage !== "published" ? (
                      <Badge tone="neutral">{task.stage === "draft" ? "Draft" : "Archived"}</Badge>
                    ) : null}
                  </div>
                  <h3 className="mt-3 font-semibold">{task.title}</h3>
                  <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">{task.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="font-semibold">{formatBudget(task.budget)}</span>
                  {isFreelancerBrowse ? (
                    <button
                      type="button"
                      aria-label={task.isBookmarked ? "Remove bookmark" : "Bookmark task"}
                      disabled={bookmarkMutation.isPending}
                      onClick={() => bookmarkMutation.mutate(task._id)}
                      className={`rounded-md p-1.5 transition ${
                        task.isBookmarked
                          ? "bg-ink-950 text-white dark:bg-white dark:text-ink-950"
                          : "text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
                      }`}
                    >
                      <FiBookmark className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(task.skills || []).map((skill) => <Badge key={skill}>{skill}</Badge>)}
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-ink-500">{formatDeadline(task.deadline)}</p>
                <div className="flex flex-wrap gap-2">
                  {mode === "client" ? (
                    <>
                      {task.stage === "draft" ? (
                        <Button
                          variant="secondary"
                          disabled={publishMutation.isPending}
                          onClick={() => publishMutation.mutate(task._id)}
                        >
                          Publish
                        </Button>
                      ) : task.stage === "published" ? (
                        <Button
                          variant="secondary"
                          disabled={archiveMutation.isPending}
                          onClick={() => archiveMutation.mutate(task._id)}
                        >
                          Archive
                        </Button>
                      ) : null}
                      <Link to={`/client/tasks/${task._id}/edit`}>
                        <Button variant="secondary">Edit</Button>
                      </Link>
                      <Button
                        variant="danger"
                        disabled={deleteMutation.isPending}
                        onClick={() => handleDelete(task)}
                      >
                        Delete
                      </Button>
                    </>
                  ) : null}
                  <Link to={`/${detailsBasePath}/tasks/${task._id}`}>
                    <Button variant="secondary" icon={FiSearch}>Details</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 ? (
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
      ) : null}
    </div>
  );
}
