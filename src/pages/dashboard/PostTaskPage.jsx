import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiPaperclip, FiSave, FiSend, FiX } from "react-icons/fi";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Input, Select, Textarea } from "../../components/ui/Input.jsx";
import { SectionHeader } from "../../components/ui/SectionHeader.jsx";
import { SkeletonLoader } from "../../components/ui/Skeleton.jsx";
import { categories } from "../../data/sampleData.js";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import {
  useTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useUploadAttachmentsMutation,
  useDeleteAttachmentMutation,
} from "../../hooks/api/useTasks.js";
import { formatFileSize } from "../../utils/format.js";

const PRIORITIES = ["High", "Medium", "Low"];

function toDateInputValue(deadline) {
  if (!deadline) return "";
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function PostTaskPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  usePageTitle(isEditing ? "Edit task" : "Post task");

  const taskQuery = useTaskQuery(id);
  const createMutation = useCreateTaskMutation();
  const updateMutation = useUpdateTaskMutation();
  const uploadMutation = useUploadAttachmentsMutation();
  const deleteAttachmentMutation = useDeleteAttachmentMutation();

  const [form, setForm] = useState({
    title: "",
    description: "",
    budget: "",
    category: categories[0] || "",
    skills: "",
    deadline: "",
    priority: "Medium",
  });
  const [pendingFiles, setPendingFiles] = useState([]);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const task = taskQuery.data?.data?.task;
    if (isEditing && task) {
      setForm({
        title: task.title || "",
        description: task.description || "",
        budget: task.budget ?? "",
        category: task.category || categories[0] || "",
        skills: (task.skills || []).join(", "),
        deadline: toDateInputValue(task.deadline),
        priority: task.priority || "Medium",
      });
    }
  }, [isEditing, taskQuery.data]);

  const updateField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const buildPayload = () => ({
    title: form.title.trim(),
    description: form.description.trim(),
    budget: Number(form.budget),
    category: form.category,
    skills: form.skills,
    deadline: form.deadline || null,
    priority: form.priority,
  });

  const validate = () => {
    if (!form.title.trim()) return "Give the task a title.";
    if (!form.budget || Number(form.budget) <= 0) return "Enter a budget greater than 0.";
    if (!form.category) return "Choose a category.";
    return "";
  };

  const uploadPendingFiles = async (taskId) => {
    if (pendingFiles.length === 0) return;
    await uploadMutation.mutateAsync({ id: taskId, files: pendingFiles });
    setPendingFiles([]);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) return setFormError(error);
    setFormError("");

    await updateMutation.mutateAsync({ id, payload: buildPayload() });
    await uploadPendingFiles(id);
    navigate(`/client/tasks/${id}`);
  };

  const handleCreate = async (publish) => {
    const error = validate();
    if (error) return setFormError(error);
    setFormError("");

    const result = await createMutation.mutateAsync({ ...buildPayload(), publish });
    const newTask = result?.data?.task;
    if (newTask?._id) await uploadPendingFiles(newTask._id);
    navigate("/client/tasks");
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (isEditing && id) {
      uploadMutation.mutate({ id, files });
    } else {
      setPendingFiles((prev) => [...prev, ...files]);
    }
    e.target.value = "";
  };

  const removePendingFile = (index) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const existingAttachments = isEditing ? taskQuery.data?.data?.task?.attachments || [] : [];
  const isSaving = createMutation.isPending || updateMutation.isPending || uploadMutation.isPending;

  if (isEditing && taskQuery.isLoading) {
    return (
      <Card className="mx-auto max-w-4xl">
        <SkeletonLoader />
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-4xl">
      <SectionHeader
        eyebrow={isEditing ? "Edit task" : "New task"}
        title={isEditing ? "Update your task" : "Post a clear micro task"}
      >
        Add enough context for freelancers to estimate quickly and start without back-and-forth.
      </SectionHeader>
      <form className="grid gap-5 md:grid-cols-2" onSubmit={isEditing ? handleSaveEdit : (e) => e.preventDefault()}>
        <div className="md:col-span-2">
          <Input label="Task title" placeholder="Audit checkout flow on mobile" value={form.title} onChange={updateField("title")} />
        </div>
        <div className="md:col-span-2">
          <Textarea
            label="Description"
            placeholder="Describe the outcome, acceptance criteria, and key links."
            value={form.description}
            onChange={updateField("description")}
          />
        </div>
        <Input label="Budget" type="number" min="0" placeholder="500" value={form.budget} onChange={updateField("budget")} />
        <Select label="Category" value={form.category} onChange={updateField("category")}>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <Input label="Skills required" placeholder="React, WCAG, QA" value={form.skills} onChange={updateField("skills")} />
        <Input label="Deadline" type="date" value={form.deadline} onChange={updateField("deadline")} />
        <Select label="Priority" value={form.priority} onChange={updateField("priority")}>
          {PRIORITIES.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>

        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium">Attachments</span>
          <div className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border bg-white px-3 text-sm dark:bg-ink-900">
            <FiPaperclip className="h-4 w-4" />
            <span>Upload brief, screenshots, or data files</span>
            <input type="file" multiple className="hidden" onChange={handleFileChange} />
          </div>
        </label>

        {(pendingFiles.length > 0 || existingAttachments.length > 0) && (
          <div className="md:col-span-2 space-y-2">
            {existingAttachments.map((att) => (
              <div key={att._id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <a href={att.url} target="_blank" rel="noreferrer" className="truncate hover:underline">
                  {att.name} <span className="text-ink-400">({formatFileSize(att.size)})</span>
                </a>
                <button
                  type="button"
                  className="text-ink-500 hover:text-coral-600"
                  aria-label={`Remove ${att.name}`}
                  onClick={() => deleteAttachmentMutation.mutate({ id, attachmentId: att._id })}
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            ))}
            {pendingFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span className="truncate">
                  {file.name} <span className="text-ink-400">({formatFileSize(file.size)})</span>
                </span>
                <button
                  type="button"
                  className="text-ink-500 hover:text-coral-600"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => removePendingFile(index)}
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {formError && <p className="md:col-span-2 text-sm text-coral-600">{formError}</p>}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row md:col-span-2">
          {isEditing ? (
            <Button type="submit" icon={FiSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          ) : (
            <>
              <Button type="button" icon={FiSend} disabled={isSaving} onClick={() => handleCreate(true)}>
                {isSaving ? "Publishing..." : "Publish task"}
              </Button>
              <Button type="button" variant="secondary" icon={FiSave} disabled={isSaving} onClick={() => handleCreate(false)}>
                {isSaving ? "Saving..." : "Save draft"}
              </Button>
            </>
          )}
        </div>
      </form>
    </Card>
  );
}
