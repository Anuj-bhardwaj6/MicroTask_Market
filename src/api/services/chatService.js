import { axiosInstance } from "../axiosInstance.js";
import { ENDPOINTS } from "../endpoints.js";

export const chatService = {
  getConversations: () => axiosInstance.get(ENDPOINTS.CHAT.CONVERSATIONS),
  startConversation: ({ userId, taskId }) =>
    axiosInstance.post(ENDPOINTS.CHAT.CONVERSATIONS, { userId, taskId }),
  getMessages: (conversationId) => axiosInstance.get(ENDPOINTS.CHAT.CONVERSATION_MESSAGES(conversationId)),

  // payload: { text, attachments: File[] }
  sendMessage: (conversationId, { text, attachments }) => {
    const formData = new FormData();
    if (text) formData.append("text", text);
    Array.from(attachments || []).forEach((file) => formData.append("attachments", file));
    return axiosInstance.post(ENDPOINTS.CHAT.CONVERSATION_MESSAGES(conversationId), formData);
  },

  markRead: (conversationId) => axiosInstance.patch(ENDPOINTS.CHAT.CONVERSATION_READ(conversationId)),
};

export default chatService;
