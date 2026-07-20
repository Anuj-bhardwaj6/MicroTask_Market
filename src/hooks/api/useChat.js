import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatService } from "../../api/services/chatService.js";

export const chatKeys = {
  conversations: ["chat", "conversations"],
  messages: (conversationId) => ["chat", "messages", conversationId],
};

export function useConversationsQuery() {
  return useQuery({
    queryKey: chatKeys.conversations,
    queryFn: () => chatService.getConversations(),
    // Realtime events keep this fresh; polling is just a safety net.
    refetchInterval: 30 * 1000,
  });
}

export function useStartConversationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => chatService.startConversation(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.conversations }),
  });
}

export function useMessagesQuery(conversationId) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId),
    queryFn: () => chatService.getMessages(conversationId),
    enabled: Boolean(conversationId),
    // The socket delivers new messages live; this only matters on first load.
    refetchInterval: false,
  });
}

export function useSendMessageMutation(conversationId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => chatService.sendMessage(conversationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations });
    },
  });
}

export function useMarkConversationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId) => chatService.markRead(conversationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.conversations }),
  });
}
