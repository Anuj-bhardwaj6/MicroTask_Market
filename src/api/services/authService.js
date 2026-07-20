import { axiosInstance } from "../axiosInstance.js";
import { ENDPOINTS } from "../endpoints.js";

export const authService = {
  register: (payload) => axiosInstance.post(ENDPOINTS.AUTH.REGISTER, payload),
  login: (payload) => axiosInstance.post(ENDPOINTS.AUTH.LOGIN, payload),
  logout: () => axiosInstance.post(ENDPOINTS.AUTH.LOGOUT),
  getMe: () => axiosInstance.get(ENDPOINTS.AUTH.ME),
  forgotPassword: (payload) => axiosInstance.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, payload),
  resetPassword: (payload) => axiosInstance.post(ENDPOINTS.AUTH.RESET_PASSWORD, payload),
  sendOtp: (payload) => axiosInstance.post(ENDPOINTS.AUTH.SEND_OTP, payload),
  verifyOtp: (payload) => axiosInstance.post(ENDPOINTS.AUTH.VERIFY_OTP, payload),
  refreshToken: () => axiosInstance.post(ENDPOINTS.AUTH.REFRESH_TOKEN),
};

export default authService;
