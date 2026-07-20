import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "../../api/services/notificationService.js";

export const notificationKeys = {
  all: ["notifications"],
  activity: (params) => ["notifications", "activity", params],
};

export function useNotificationsQuery(options = {}) {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: () => notificationService.getAll(),
    refetchInterval: 30 * 1000,
    ...options,
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => notificationService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
