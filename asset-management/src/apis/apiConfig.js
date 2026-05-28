import axios from "axios";
import Cookies from "js-cookie";

const getApiBaseUrl = () => {
  if (typeof window === "undefined") {
    return import.meta.env.VITE_API_BASE_URL || "http://localhost:7000/api";
  }
  const { protocol, hostname } = window.location;
  const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(hostname);

  // Check if hostname is a private/local network IP address or local domain
  const isLocalIp = 
    /^192\.168\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    (hostname && hostname.endsWith(".local"));

  if (isLocalHost) {
    if (import.meta.env.DEV) {
      return "/api";
    }
    return `${protocol}//${hostname}:7000/api`;
  }

  if (isLocalIp) {
    return `${protocol}//${hostname}:7000/api`;
  }

  // If there is an explicit environment variable set that does not point to localhost, use it
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  if (envApiUrl && !envApiUrl.includes("localhost") && !envApiUrl.includes("127.0.0.1")) {
    return envApiUrl;
  }

  // Otherwise, default to the public hostname without port 7000
  return `${protocol}//${hostname}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

export const getApiOrigin = () => {
  if (API_BASE_URL.startsWith("/")) {
    return typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
  }
  return API_BASE_URL.replace(/\/api\/?$/, "");
};

const getLocalNetworkIp = () =>
  new Promise((resolve) => {
    if (typeof window === "undefined" || !window.RTCPeerConnection) {
      resolve(null);
      return;
    }

    const peer = new RTCPeerConnection({ iceServers: [] });
    const done = (ip) => {
      peer.close();
      resolve(ip);
    };

    peer.createDataChannel("ip");
    peer
      .createOffer()
      .then((offer) => peer.setLocalDescription(offer))
      .catch(() => done(null));

    peer.onicecandidate = (event) => {
      if (!event?.candidate?.candidate) return;
      const match = /([0-9]{1,3}(?:\.[0-9]{1,3}){3})/.exec(event.candidate.candidate);
      if (match?.[1] && !match[1].startsWith("127.")) {
        done(match[1]);
      }
    };

    setTimeout(() => done(null), 1200);
  });

export const getScanBaseUrl = (override = "") => {
  const custom = String(override || "").trim().replace(/\/+$/, "");
  if (!custom) return getQrClientOrigin();

  try {
    const url = new URL(custom.includes("://") ? custom : `http://${custom}`);
    return url.origin;
  } catch {
    return getQrClientOrigin();
  }
};

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
      if (!config.headers["x-client-origin"]) {
        config.headers["x-client-origin"] = getQrClientOrigin();
      }
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
      if (!config.headers["x-client-origin"]) {
        config.headers["x-client-origin"] = getQrClientOrigin();
      }
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

export const fetchRecommendedScanBaseUrl = async () => {
  try {
    const response = await apiInstance.get("/qr/scan-base-url");
    return response.data?.scanBaseUrl || getQrClientOrigin();
  } catch {
    const { port } = typeof window !== "undefined" ? window.location : { port: "5173" };
    const lanIp = await getLocalNetworkIp();
    if (lanIp) {
      return `http://${lanIp}:${port || "5173"}`;
    }
    return getQrClientOrigin();
  }
};

export default apiInstance;