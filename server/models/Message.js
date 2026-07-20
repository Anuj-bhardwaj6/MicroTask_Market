import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    name: { type: String, required: true },
    fileType: { type: String, default: "" },
    resourceType: { type: String, default: "auto" },
    size: { type: Number, default: 0 },
  },
  { _id: true }
);

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, default: "", trim: true },
    attachments: [attachmentSchema],
    // Read receipts: every participant who has seen this message, including the sender.
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

messageSchema.pre("validate", function ensureContent(next) {
  const hasText = Boolean(this.text && this.text.trim());
  const hasAttachments = Array.isArray(this.attachments) && this.attachments.length > 0;
  if (!hasText && !hasAttachments) {
    next(new Error("A message needs text or at least one attachment"));
    return;
  }
  next();
});

export const Message = mongoose.model("Message", messageSchema);
export default Message;
