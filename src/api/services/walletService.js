import { axiosInstance } from "../axiosInstance.js";
import { ENDPOINTS } from "../endpoints.js";

export const walletService = {
  getWallet: () => axiosInstance.get(ENDPOINTS.WALLET.ME),
  getTransactions: (params) => axiosInstance.get(ENDPOINTS.WALLET.TRANSACTIONS, { params }),
  createTransaction: (payload) => axiosInstance.post(ENDPOINTS.WALLET.TRANSACTIONS, payload),

  payForTask: (taskId) => axiosInstance.post(ENDPOINTS.WALLET.PAY(taskId)),
  getPaymentStatus: (taskId) => axiosInstance.get(ENDPOINTS.WALLET.PAYMENT_STATUS(taskId)),
  releasePayment: (taskId) => axiosInstance.post(ENDPOINTS.WALLET.RELEASE_PAYMENT(taskId)),
  refundPayment: (taskId) => axiosInstance.post(ENDPOINTS.WALLET.REFUND(taskId)),

  requestWithdrawal: (payload) => axiosInstance.post(ENDPOINTS.WALLET.WITHDRAW, payload),
  getWithdrawals: (params) => axiosInstance.get(ENDPOINTS.WALLET.WITHDRAWALS, { params }),
  updateWithdrawalStatus: (id, status) => axiosInstance.patch(ENDPOINTS.WALLET.WITHDRAWAL_STATUS(id), { status }),
};

export default walletService;
