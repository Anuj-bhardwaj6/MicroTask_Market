import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationService } from "../../api/services/applicationService.js";
import { taskKeys } from "./useTasks.js";

export const applicationKeys = {
  all: ["applications"],
  list: (params) => ["applications", "list", params],
};

export function useApplicationsQuery(params = {}, options = {}) {
  return useQuery({
    queryKey: applicationKeys.list(params),
    queryFn: () => applicationService.getAll(params),
    enabled: options.enabled !== undefined ? options.enabled : true,
  });
}

function invalidateApplicationQueries(queryClient, taskId) {
  queryClient.invalidateQueries({ queryKey: applicationKeys.all });
  queryClient.invalidateQueries({ queryKey: taskKeys.stats });
  if (taskId) queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
}

export function useCreateApplicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => applicationService.create(payload),
    onSuccess: (_, variables) => invalidateApplicationQueries(queryClient, variables.task),
  });
}

export function useUpdateApplicationStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => applicationService.updateStatus(id, status),
    onSuccess: () => invalidateApplicationQueries(queryClient),
  });
}

export function useWithdrawApplicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => applicationService.remove(id),
    onSuccess: () => invalidateApplicationQueries(queryClient),
  });
}
