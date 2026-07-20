import mongoose from "mongoose";
import {
  CATEGORIES,
  PRIORITIES,
  TASK_STATUSES,
  TASK_STAGES,
  ACTIVE_STATUSES,
  ESCROW_STATUSES,
} from "../utils/constants.js";

// Tracks the lifecycle of the client's payment for this task:
//   none      -> nothing paid yet
//   pending   -> a Stripe Checkout session was created, awaiting confirmation
//   held      -> payment captured and held in escrow, ready to release
//   released  -> escrow paid out to the freelancer
//   refunded  -> escrow returned to the client (task cancelled/disputed)
const escrowSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ESCROW_STATUSES, default: "none" },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: "usd" },
    stripeCheckoutSessionId: { type: String, default: "" },
    stripePaymentIntentId: { type: String, default: "" },
    heldAt: { type: Date, default: null },
    releasedAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
  },
  { _id: false }
);

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    name: { type: String, required: true },
    fileType: { type: String, default: "" },
    resourceType: { type: String, default: "auto" },
    size: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    taskId: { type: String, unique: true }, // human friendly id e.g. MT-1042
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, required: true, enum: CATEGORIES },
    budget: { type: Number, required: true, min: 0 },
    deadline: { type: Date, default: null },
    priority: { type: String, enum: PRIORITIES, default: "Medium" },

    // Lifecycle stage: draft -> published -> archived. Drafts are only
    // visible to their owner; only published tasks appear on the
    // marketplace / freelancer browse view.
    stage: { type: String, enum: TASK_STAGES, default: "draft" },

    // Working status of a published task.
    status: { type: String, enum: TASK_STATUSES, default: "Open" },

    progress: { type: Number, default: 0, min: 0, max: 100 },
    skills: [{ type: String, trim: true }],
    attachments: [attachmentSchema],

    client: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    clientName: { type: String },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    assignedToName: { type: String, default: "" },
    paymentReleased: { type: Boolean, default: false },
    escrow: { type: escrowSchema, default: () => ({}) },
  },
  { timestamps: true }
);

taskSchema.index({ title: "text", description: "text" });
taskSchema.index({ client: 1, stage: 1 });
taskSchema.index({ stage: 1, status: 1 });

// Lazily flips any Open/In Progress task whose deadline has passed to
// Expired. Called at the top of read routes so status is always accurate
// without needing a background cron job.
taskSchema.statics.autoExpire = async function autoExpire() {
  const now = new Date();
  await this.updateMany(
    {
      status: { $in: ACTIVE_STATUSES },
      deadline: { $ne: null, $lt: now },
    },
    { $set: { status: "Expired" } }
  );
};

export const Task = mongoose.model("Task", taskSchema);
export default Task;
