import { axiosInstance } from "../axiosInstance.js";
import { ENDPOINTS } from "../endpoints.js";

export const userService = {
  getAll: (params) => axiosInstance.get(ENDPOINTS.USERS.BASE, { params }),
  getById: (id) => axiosInstance.get(ENDPOINTS.USERS.BY_ID(id)),
  updateProfile: (payload) => axiosInstance.patch(ENDPOINTS.USERS.ME, payload),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return axiosInstance.post(ENDPOINTS.USERS.AVATAR, formData);
  },
  remove: (id) => axiosInstance.delete(ENDPOINTS.USERS.BY_ID(id)),
};

export default userService;
