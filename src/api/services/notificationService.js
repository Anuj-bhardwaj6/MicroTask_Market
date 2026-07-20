import { axiosInstance } from "../axiosInstance.js";
import { ENDPOINTS } from "../endpoints.js";

export const notificationService = {
  getAll: () => axiosInstance.get(ENDPOINTS.NOTIFICATIONS.BASE),
  getActivity: (params) => axiosInstance.get(ENDPOINTS.NOTIFICATIONS.ACTIVITY, { params }),
  markRead: (id) => axiosInstance.patch(ENDPOINTS.NOTIFICATIONS.READ(id)),
  markAllRead: () => axiosInstance.patch(ENDPOINTS.NOTIFICATIONS.READ_ALL),
};

export default notificationService;
