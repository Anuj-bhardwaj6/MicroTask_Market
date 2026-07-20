import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { withTransaction } from "../utils/withTransaction.js";
import { notifyUser } from "../utils/notify.js";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload.js";
import { isCloudinaryConfigured } from "../config/env.js";
import { isOnline } from "../sockets/presence.js";

function isParticipant(conversation, userId) {
  return conversation.participants.some((p) => p.toString() === userId.toString());
}

function otherParticipantId(conversation, userId) {
  const other = conversation.participants.find((p) => p.toString() !== userId.toString());
  return other ? other.toString() : null;
}

// Shapes a Conversation document into what the conversation-list UI needs:
// the *other* participant's profile + online status, this user's unread
// count, and a plain-object view of the otherwise Map-typed unreadCounts.
async function toConversationSummary(conversation, currentUserId) {
  const otherId = otherParticipantId(conversation, currentUserId);
  const other = otherId ? await User.findById(otherId).select("name avatar role") : null;

  return {
    _id: conversation._id,
    task: conversation.task,
    lastMessage: conversation.lastMessage,
    lastMessageAt: conversation.lastMessageAt,
    lastSender: conversation.lastSender,
    unreadCount: conversation.unreadCounts?.get?.(currentUserId.toString()) || 0,
    participant: other
      ? { _id: other._id, name: other.name, avatar: other.avatar, role: other.role, isOnline: isOnline(other._id) }
      : null,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

// GET /api/chat/conversations
export const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .populate("task", "title taskId")
    .sort({ lastMessageAt: -1 });

  const summaries = await Promise.all(conversations.map((c) => toConversationSummary(c, req.user._id)));

  res.status(200).json(new ApiResponse(200, { conversations: summaries }, "OK"));
});

// POST /api/chat/conversations - get-or-create a private thread with another user
export const startConversation = asyncHandler(async (req, res) => {
  const { userId, taskId } = req.body;

  if (!userId) throw ApiError.badRequest("userId is required");
  if (userId === req.user._id.toString()) throw ApiError.badRequest("You can't message yourself");

  const otherUser = await User.findById(userId);
  if (!otherUser) throw ApiError.notFound("User not found");

  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, userId], $size: 2 },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, userId],
      task: taskId || null,
    });
  } else if (taskId && !conversation.task) {
    conversation.task = taskId;
    await conversation.save();
  }

  const summary = await toConversationSummary(conversation, req.user._id);
  res.status(200).json(new ApiResponse(200, { conversation: summary }, "OK"));
});

// GET /api/chat/conversations/:id/messages
export const getMessages = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) throw ApiError.notFound("Conversation not found");
  if (!isParticipant(conversation, req.user._id)) {
    throw ApiError.forbidden("You do not have permission to view this conversation");
  }

  const limit = Math.min(200, Number(req.query.limit) || 100);
  const messages = await Message.find({ conversation: conversation._id })
    .sort({ createdAt: -1 })
    .limit(limit);

  res.status(200).json(new ApiResponse(200, { messages: messages.reverse() }, "OK"));
});

// POST /api/chat/conversations/:id/messages (multipart/form-data, field name "attachments")
export const sendMessage = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) throw ApiError.notFound("Conversation not found");
  if (!isParticipant(conversation, req.user._id)) {
    throw ApiError.forbidden("You do not have permission to message in this conversation");
  }

  const text = (req.body.text || "").trim();
  const otherId = otherParticipantId(conversation, req.user._id);

  // File uploads hit Cloudinary (external I/O) before the DB transaction.
  let attachments = [];
  if (req.files && req.files.length > 0) {
    if (!isCloudinaryConfigured) {
      throw ApiError.badRequest(
        "File upload isn't configured yet. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET on the server."
      );
    }
    for (const file of req.files) {
      const result = await uploadBufferToCloudinary(file.buffer, {
        folder: `microtask-marketplace/chat/${conversation._id}`,
      });
      attachments.push({
        url: result.secure_url,
        publicId: result.public_id,
        name: file.originalname,
        fileType: file.mimetype,
        resourceType: result.resource_type,
        size: file.size,
      });
    }
  }

  if (!text && attachments.length === 0) {
    throw ApiError.badRequest("A message needs text or at least one attachment");
  }

  const io = req.app.get("io");

  const message = await withTransaction(async (session) => {
    const [created] = await Message.create(
      [
        {
          conversation: conversation._id,
          sender: req.user._id,
          text,
          attachments,
          readBy: [req.user._id],
        },
      ],
      { session }
    );

    conversation.lastMessage =
      text || (attachments.length === 1 ? `Sent a file: ${attachments[0].name}` : `Sent ${attachments.length} files`);
    conversation.lastMessageAt = created.createdAt;
    conversation.lastSender = req.user._id;
    if (otherId) {
      const current = conversation.unreadCounts.get(otherId) || 0;
      conversation.unreadCounts.set(otherId, current + 1);
    }
    await conversation.save({ session });

    if (otherId) {
      await notifyUser(
        io,
        otherId,
        { title: "New message", body: `${req.user.name}: ${conversation.lastMessage}` },
        { session }
      );
    }

    return created;
  });

  // Anyone actively viewing this thread gets the message immediately...
  if (io) {
    io.to(`conversation:${conversation._id}`).emit("message:new", message);
    // ...and the recipient's conversation list updates even if they're
    // elsewhere in the app.
    if (otherId) {
      const summary = await toConversationSummary(conversation, otherId);
      io.to(`user:${otherId}`).emit("conversation:updated", summary);
    }
  }

  res.status(201).json(new ApiResponse(201, { message }, "Message sent"));
});

// PATCH /api/chat/conversations/:id/read
export const markConversationRead = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) throw ApiError.notFound("Conversation not found");
  if (!isParticipant(conversation, req.user._id)) {
    throw ApiError.forbidden("You do not have permission to view this conversation");
  }

  conversation.unreadCounts.set(req.user._id.toString(), 0);
  await conversation.save();

  await Message.updateMany(
    { conversation: conversation._id, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id } }
  );

  const io = req.app.get("io");
  if (io) {
    io.to(`conversation:${conversation._id}`).emit("message:read", {
      conversationId: conversation._id,
      readerId: req.user._id,
      readAt: new Date(),
    });
  }

  res.status(200).json(new ApiResponse(200, null, "Marked as read"));
});
