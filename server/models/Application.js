import mongoose from "mongoose";

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

const applicationSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String },
    rating: { type: Number, default: 5 },
    skills: [{ type: String }],
    proposal: { type: String, required: true },
    bidAmount: { type: Number, required: true, min: 0 },
    estimatedTime: { type: String, required: true, trim: true },
    attachments: [attachmentSchema],
    avatar: { type: String },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

// A freelancer may only submit one application per task.
applicationSchema.index({ task: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ applicant: 1, status: 1 });
applicationSchema.index({ task: 1, status: 1 });

export const Application = mongoose.model("Application", applicationSchema);
export default Application;
