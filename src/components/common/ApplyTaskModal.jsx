import { useState } from "react";
import { FiPaperclip } from "react-icons/fi";
import { Modal } from "./Modal.jsx";
import { Button } from "../ui/Button.jsx";
import { Input, Textarea } from "../ui/Input.jsx";
import { useCreateApplicationMutation } from "../../hooks/api/useApplications.js";

export function ApplyTaskModal({ open, onClose, task, onApplied }) {
  const [proposal, setProposal] = useState("");
  const [bidAmount, setBidAmount] = useState(task?.budget || "");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");

  const applyMutation = useCreateApplicationMutation();

  const resetAndClose = () => {
    setProposal("");
    setBidAmount(task?.budget || "");
    setEstimatedTime("");
    setFiles([]);
    setError("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!proposal.trim() || !bidAmount || !estimatedTime.trim()) {
      setError("Proposal, bid amount, and estimated time are required.");
      return;
    }

    try {
      await applyMutation.mutateAsync({
        task: task._id,
        proposal: proposal.trim(),
        bidAmount: Number(bidAmount),
        estimatedTime: estimatedTime.trim(),
        attachments: files,
      });
      onApplied?.();
      resetAndClose();
    } catch (err) {
      setError(err?.message || "Couldn't submit your application. Try again.");
    }
  };

  if (!task) return null;

  return (
    <Modal open={open} onClose={resetAndClose} title={`Apply to "${task.title}"`}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Textarea
          label="Proposal"
          placeholder="Explain why you're a great fit for this task..."
          value={proposal}
          onChange={(e) => setProposal(e.target.value)}
          required
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Bid amount ($)"
            type="number"
            min="1"
            step="1"
            placeholder={String(task.budget || "")}
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            required
          />
          <Input
            label="Estimated time"
            placeholder="e.g. 3 days"
            value={estimatedTime}
            onChange={(e) => setEstimatedTime(e.target.value)}
            required
          />
        </div>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink-800 dark:text-ink-100">
            Attachments (optional)
          </span>
          <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-sm text-ink-600 dark:text-ink-300">
            <FiPaperclip className="h-4 w-4 shrink-0" />
            <input
              type="file"
              multiple
              className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-ink-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold dark:file:bg-ink-800"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
          </div>
          {files.length > 0 ? (
            <p className="mt-1 text-xs text-ink-500">{files.length} file(s) selected</p>
          ) : null}
        </label>

        {error ? <p className="text-sm text-coral-600">{error}</p> : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={applyMutation.isPending}>
            {applyMutation.isPending ? "Submitting..." : "Submit application"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
