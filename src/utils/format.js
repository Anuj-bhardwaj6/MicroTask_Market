// Small formatting helpers shared by task-facing pages so dates, budgets,
// and status colors stay consistent without duplicating logic per page.

export function formatDeadline(deadline) {
  if (!deadline) return "No deadline";
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return "No deadline";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfTarget - startOfToday) / (1000 * 60 * 60 * 24));

  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  if (dayDiff === 0) return `Today, ${time}`;
  if (dayDiff === 1) return `Tomorrow, ${time}`;
  if (dayDiff === -1) return `Yesterday, ${time}`;
  if (dayDiff < -1) return `${Math.abs(dayDiff)}d overdue`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatRelativeTime(input) {
  if (!input) return "";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatBudget(budget) {
  const value = Number(budget) || 0;
  return `$${value.toLocaleString()}`;
}

export function statusTone(status) {
  switch (status) {
    case "Open":
      return "green";
    case "In Progress":
      return "amber";
    case "Completed":
      return "green";
    case "Cancelled":
      return "red";
    case "Expired":
      return "neutral";
    default:
      return "neutral";
  }
}

export function priorityTone(priority) {
  if (priority === "High") return "red";
  if (priority === "Medium") return "amber";
  return "neutral";
}

export function applicationStatusTone(status) {
  switch (status) {
    case "Accepted":
      return "green";
    case "Rejected":
      return "red";
    case "Pending":
    default:
      return "amber";
  }
}

export function formatFileSize(bytes) {
  const size = Number(bytes) || 0;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

// Transaction.direction + Transaction.amount -> "+$486" / "-$760"
export function formatSignedAmount(transaction) {
  const amount = Number(transaction?.amount) || 0;
  const sign = transaction?.direction === "debit" ? "-" : "+";
  return `${sign}$${amount.toLocaleString()}`;
}

export function transactionStatusTone(status) {
  switch (status) {
    case "Completed":
      return "green";
    case "Processing":
    case "Pending":
      return "amber";
    case "Failed":
      return "red";
    case "Refunded":
      return "neutral";
    default:
      return "neutral";
  }
}

export function escrowStatusTone(status) {
  switch (status) {
    case "held":
      return "amber";
    case "released":
      return "green";
    case "refunded":
      return "neutral";
    case "pending":
      return "amber";
    default:
      return "neutral";
  }
}

export function escrowStatusLabel(status) {
  switch (status) {
    case "held":
      return "In escrow";
    case "released":
      return "Payment released";
    case "refunded":
      return "Refunded";
    case "pending":
      return "Payment pending";
    default:
      return "Not funded";
  }
}
