import axios from "axios";
import Cookies from "js-cookie";

const getApiBaseUrl = () => {
  if (typeof window === "undefined") {
    return import.meta.env.VITE_API_BASE_URL || "http://localhost:7000/api";
  }

  const { protocol, hostname } = window.location;
  const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(hostname);
  const isNetworkHost = hostname && !isLocalHost;

  if (isLocalHost) {
    return `${protocol}//${hostname}:7000/api`;
  }

  if (isNetworkHost) {
    return `${protocol}//${hostname}:7000/api`;
  }

  return import.meta.env.VITE_API_BASE_URL || `${protocol}//${hostname}:7000/api`;
};

export const API_BASE_URL = getApiBaseUrl();

export const getQrClientOrigin = () => {
  if (typeof window === "undefined") {
    return "http://localhost:5173";
  }

  const { protocol, hostname, port, origin } = window.location;
  const isLocalBrowser = ["localhost", "127.0.0.1", "::1"].includes(hostname);

  if (!isLocalBrowser) {
    return origin;
  }

  try {
    const apiUrl = new URL(API_BASE_URL);
    const isNetworkApi = !["localhost", "127.0.0.1", "::1"].includes(apiUrl.hostname);

    if (isNetworkApi) {
      return `${apiUrl.protocol}//${apiUrl.hostname}:${port || "5173"}`;
    }
  } catch {
    return origin;
  }

  return `${protocol}//${hostname}:${port || "5173"}`;
};

const apiInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-platform": "web",
  },
});

export const formDataApiInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "multipart/form-data",
    Accept: "application/json",
    "x-platform": "web",
  },
});

// Request interceptor for formDataApiInstance
formDataApiInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (typeof window !== "undefined") {
      config.headers = config.headers || {};
      config.headers["x-client-origin"] = getQrClientOrigin();
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Request interceptor for apiInstance
apiInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (typeof window !== "undefined") {
      config.headers = config.headers || {};
      config.headers["x-client-origin"] = getQrClientOrigin();
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Logout handler
let handleLogout = null;

export const setLogoutHandler = (logoutFn) => {
  handleLogout = logoutFn;
};

// Response interceptor
apiInstance.interceptors.response.use(
  (response) => {
    if (response?.data?.statusCode === 401) {
      Cookies.remove("token");

      if (handleLogout) {
        handleLogout();
      }

      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", "/login");
      }
    }

    return response;
  },
  (error) => {
    if (error?.response?.status === 401) {
      Cookies.remove("token");

      if (handleLogout) {
        handleLogout();
      }

      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", "/login");
      }
    }

    return Promise.reject(error);
  },
);

export default apiInstance;
