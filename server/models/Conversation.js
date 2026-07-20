import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    // Exactly two participants - this app only supports private 1:1 chat.
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    // Optional context: the task this conversation started from.
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", default: null },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now },
    lastSender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // Keyed by participant id (string) -> number of unread messages for them.
    unreadCounts: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
