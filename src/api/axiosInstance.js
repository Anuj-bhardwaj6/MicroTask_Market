import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api";

export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true, // send/receive the httpOnly access + refresh cookies
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

axiosInstance.interceptors.request.use((config) => {
  const headers = { ...(config.headers || {}) };

  if (config.data instanceof FormData) {
    delete headers["Content-Type"];
    delete headers["content-type"];
    config.headers = headers;
    return config;
  }

  if (!headers["Content-Type"] && !headers["content-type"]) {
    headers["Content-Type"] = "application/json";
    config.headers = headers;
  }

  return config;
});

function normalizeError(error) {
  if (error.response) {
    const { status, data } = error.response;
    return {
      status,
      message: data?.message || "Something went wrong",
      errors: data?.errors || [],
      code: data?.code,
    };
  }
  if (error.request) {
    return {
      status: 0,
      message: "Unable to reach the server. Please check your connection.",
      errors: [],
    };
  }
  return { status: 0, message: error.message, errors: [] };
}

// Auth endpoints should never trigger a silent-refresh retry loop on their
// own 401s - a failed login/register/refresh is a real failure, not an
// expired-session situation.
const AUTH_ENDPOINTS_WITHOUT_RETRY = ["/auth/login", "/auth/register", "/auth/refresh-token"];

let pendingRefresh = null;

// Normalize successful responses so callers can just read res.data / res.message,
// and transparently retry a request once if the access token has expired,
// using the httpOnly refresh-token cookie to get a new one (persistent login).
axiosInstance.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config || {};
    const isAuthNoRetry = AUTH_ENDPOINTS_WITHOUT_RETRY.some((path) => original.url?.includes(path));

    if (error.response?.status === 401 && !original._retried && !isAuthNoRetry) {
      original._retried = true;
      try {
        pendingRefresh = pendingRefresh || axiosInstance.post("/auth/refresh-token");
        await pendingRefresh;
        pendingRefresh = null;
        return axiosInstance(original);
      } catch (refreshError) {
        pendingRefresh = null;
        // The refresh token is gone/expired too - the session is truly over.
        window.dispatchEvent(new Event("auth:session-expired"));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

export default axiosInstance;
