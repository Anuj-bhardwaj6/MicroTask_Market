import { axiosInstance } from "../axiosInstance.js";
import { ENDPOINTS } from "../endpoints.js";

export const taskService = {
  getAll: (params) => axiosInstance.get(ENDPOINTS.TASKS.BASE, { params }),
  getById: (id) => axiosInstance.get(ENDPOINTS.TASKS.BY_ID(id)),
  create: (payload) => axiosInstance.post(ENDPOINTS.TASKS.BASE, payload),
  update: (id, payload) => axiosInstance.patch(ENDPOINTS.TASKS.BY_ID(id), payload),
  remove: (id) => axiosInstance.delete(ENDPOINTS.TASKS.BY_ID(id)),

  publish: (id) => axiosInstance.patch(ENDPOINTS.TASKS.PUBLISH(id)),
  archive: (id) => axiosInstance.patch(ENDPOINTS.TASKS.ARCHIVE(id)),
  updateStatus: (id, status) => axiosInstance.patch(ENDPOINTS.TASKS.STATUS(id), { status }),

  uploadAttachments: (id, files) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));
    return axiosInstance.post(ENDPOINTS.TASKS.ATTACHMENTS(id), formData);
  },
  deleteAttachment: (id, attachmentId) =>
    axiosInstance.delete(ENDPOINTS.TASKS.ATTACHMENT_BY_ID(id, attachmentId)),

  getDashboardStats: () => axiosInstance.get(ENDPOINTS.TASKS.DASHBOARD_STATS),
  getDashboardInsights: () => axiosInstance.get(ENDPOINTS.TASKS.DASHBOARD_INSIGHTS),
  getRecent: (params) => axiosInstance.get(ENDPOINTS.TASKS.DASHBOARD_RECENT, { params }),

  toggleBookmark: (id) => axiosInstance.patch(ENDPOINTS.TASKS.BOOKMARK(id)),
};

export default taskService;
