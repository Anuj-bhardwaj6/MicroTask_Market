import { axiosInstance } from "../axiosInstance.js";
import { ENDPOINTS } from "../endpoints.js";

export const applicationService = {
  getAll: (params) => axiosInstance.get(ENDPOINTS.APPLICATIONS.BASE, { params }),

  // payload: { task, proposal, bidAmount, estimatedTime, attachments: FileList|File[] }
  create: (payload) => {
    const formData = new FormData();
    formData.append("task", payload.task);
    formData.append("proposal", payload.proposal);
    formData.append("bidAmount", payload.bidAmount);
    formData.append("estimatedTime", payload.estimatedTime);
    Array.from(payload.attachments || []).forEach((file) => formData.append("attachments", file));
    return axiosInstance.post(ENDPOINTS.APPLICATIONS.BASE, formData);
  },

  updateStatus: (id, status) =>
    axiosInstance.patch(ENDPOINTS.APPLICATIONS.BY_ID(id), { status }),
  remove: (id) => axiosInstance.delete(ENDPOINTS.APPLICATIONS.BY_ID(id)),
};

export default applicationService;
