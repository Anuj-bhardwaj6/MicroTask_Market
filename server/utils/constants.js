export const CATEGORIES = [
  "Design",
  "Development",
  "Writing",
  "Marketing",
  "Operations",
  "Research",
];

export const PRIORITIES = ["Low", "Medium", "High"];

// Working status of a published task.
export const TASK_STATUSES = ["Open", "In Progress", "Completed", "Cancelled", "Expired"];

// Lifecycle stage - separate from working status. A task is a Draft until the
// owner publishes it (making it visible on the marketplace); it can later be
// Archived to hide it without deleting it.
export const TASK_STAGES = ["draft", "published", "archived"];

export const ACTIVE_STATUSES = ["Open", "In Progress"];

// --- Payments / wallet ---

// Every ledger entry recorded in Transaction.type:
//  - payment          client funds a task's escrow (debit for client)
//  - escrow_hold      mirror entry marking funds as held in escrow
//  - escrow_release   escrow paid out to the freelancer (credit for freelancer)
//  - refund           escrowed funds returned to the client (credit for client)
//  - withdrawal       freelancer/user cashes out available wallet balance (debit)
//  - fee              platform fee (reserved for future use)
//  - adjustment       manual/admin correction
export const TRANSACTION_TYPES = [
  "payment",
  "escrow_hold",
  "escrow_release",
  "refund",
  "withdrawal",
  "fee",
  "adjustment",
];

export const TRANSACTION_DIRECTIONS = ["credit", "debit"];

export const TRANSACTION_STATUSES = ["Pending", "Processing", "Completed", "Failed", "Refunded"];

export const ESCROW_STATUSES = ["none", "pending", "held", "released", "refunded"];

export const WITHDRAWAL_STATUSES = ["Processing", "Completed", "Failed"];

export const WITHDRAWAL_METHODS = ["bank_transfer", "paypal", "upi"];
