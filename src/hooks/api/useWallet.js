import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { walletService } from "../../api/services/walletService.js";
import { taskKeys } from "./useTasks.js";

export const walletKeys = {
  all: ["wallet"],
  wallet: ["wallet", "me"],
  transactions: (params) => ["wallet", "transactions", params],
  withdrawals: (params) => ["wallet", "withdrawals", params],
  paymentStatus: (taskId) => ["wallet", "payment-status", taskId],
};

// Refetches every wallet-related query - used after mutations and when the
// "wallet:updated" socket event fires so dashboards update automatically.
function invalidateWallet(queryClient) {
  queryClient.invalidateQueries({ queryKey: walletKeys.all });
}

export function useWalletQuery(options = {}) {
  return useQuery({
    queryKey: walletKeys.wallet,
    queryFn: () => walletService.getWallet(),
    ...options,
  });
}

export function useTransactionsQuery(params = {}, options = {}) {
  return useQuery({
    queryKey: walletKeys.transactions(params),
    queryFn: () => walletService.getTransactions(params),
    ...options,
  });
}

export function useWithdrawalsQuery(params = {}, options = {}) {
  return useQuery({
    queryKey: walletKeys.withdrawals(params),
    queryFn: () => walletService.getWithdrawals(params),
    ...options,
  });
}

export function usePaymentStatusQuery(taskId, options = {}) {
  return useQuery({
    queryKey: walletKeys.paymentStatus(taskId),
    queryFn: () => walletService.getPaymentStatus(taskId),
    enabled: Boolean(taskId),
    ...options,
  });
}

export function usePayForTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId) => walletService.payForTask(taskId),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      invalidateWallet(queryClient);
    },
  });
}

export function useReleasePaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId) => walletService.releasePayment(taskId),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      invalidateWallet(queryClient);
    },
  });
}

export function useRefundPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId) => walletService.refundPayment(taskId),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      invalidateWallet(queryClient);
    },
  });
}

export function useRequestWithdrawalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => walletService.requestWithdrawal(payload),
    onSuccess: () => invalidateWallet(queryClient),
  });
}

export function useUpdateWithdrawalStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => walletService.updateWithdrawalStatus(id, status),
    onSuccess: () => invalidateWallet(queryClient),
  });
}
