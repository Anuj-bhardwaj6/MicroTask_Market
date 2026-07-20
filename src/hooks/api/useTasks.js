import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { taskService } from "../../api/services/taskService.js";
import { notificationService } from "../../api/services/notificationService.js";

export const taskKeys = {
  all: ["tasks"],
  list: (params) => ["tasks", "list", params],
  detail: (id) => ["tasks", "detail", id],
  stats: ["tasks", "stats"],
  insights: ["tasks", "insights"],
  recent: (params) => ["tasks", "recent", params],
};

export function useTasksQuery(params = {}) {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => taskService.getAll(params),
    placeholderData: keepPreviousData,
  });
}

export function useTaskQuery(id) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => taskService.getById(id),
    enabled: Boolean(id),
  });
}

export function useTaskStatsQuery() {
  return useQuery({
    queryKey: taskKeys.stats,
    queryFn: () => taskService.getDashboardStats(),
  });
}

export function useTaskInsightsQuery() {
  return useQuery({
    queryKey: taskKeys.insights,
    queryFn: () => taskService.getDashboardInsights(),
  });
}

export function useRecentTasksQuery(params = {}) {
  return useQuery({
    queryKey: taskKeys.recent(params),
    queryFn: () => taskService.getRecent(params),
  });
}

export function useActivityFeedQuery(params = {}) {
  return useQuery({
    queryKey: ["notifications", "activity", params],
    queryFn: () => notificationService.getActivity(params),
  });
}

function invalidateTaskQueries(queryClient, id) {
  queryClient.invalidateQueries({ queryKey: taskKeys.all });
  queryClient.invalidateQueries({ queryKey: taskKeys.stats });
  queryClient.invalidateQueries({ queryKey: taskKeys.insights });
  if (id) queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => taskService.create(payload),
    onSuccess: () => invalidateTaskQueries(queryClient),
  });
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => taskService.update(id, payload),
    onSuccess: (_, variables) => invalidateTaskQueries(queryClient, variables.id),
  });
}

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => taskService.remove(id),
    onSuccess: () => invalidateTaskQueries(queryClient),
  });
}

export function usePublishTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => taskService.publish(id),
    onSuccess: (_, id) => invalidateTaskQueries(queryClient, id),
  });
}

export function useArchiveTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => taskService.archive(id),
    onSuccess: (_, id) => invalidateTaskQueries(queryClient, id),
  });
}

export function useUpdateTaskStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => taskService.updateStatus(id, status),
    onSuccess: (_, variables) => invalidateTaskQueries(queryClient, variables.id),
  });
}

export function useUploadAttachmentsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, files }) => taskService.uploadAttachments(id, files),
    onSuccess: (_, variables) => invalidateTaskQueries(queryClient, variables.id),
  });
}

export function useDeleteAttachmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, attachmentId }) => taskService.deleteAttachment(id, attachmentId),
    onSuccess: (_, variables) => invalidateTaskQueries(queryClient, variables.id),
  });
}

export function useToggleBookmarkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => taskService.toggleBookmark(id),
    onSuccess: (_, id) => invalidateTaskQueries(queryClient, id),
  });
}
