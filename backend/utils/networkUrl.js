import os from "os";

const isLocalHost = (host = "") =>
  host.includes("localhost") || host.includes("127.0.0.1") || host === "::1";

export const cleanUrl = (url = "") => String(url).trim().replace(/\/+$/, "");

export const isValidHttpUrl = (value = "") => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const getLanIpv4 = () => {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  Object.values(interfaces).forEach((entries) => {
    (entries || []).forEach((entry) => {
      if (entry?.family === "IPv4" && !entry.internal && entry.address) {
        candidates.push(entry.address);
      }
    });
  });

  return (
    candidates.find((ip) => ip.startsWith("192.168.")) ||
    candidates.find((ip) => ip.startsWith("10.")) ||
    candidates.find((ip) => /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) ||
    candidates[0] ||
    null
  );
};

export const resolveClientPort = (req, fallback = "5173") => {
  const origin = req.get("x-client-origin") || req.get("origin") || "";

  try {
    const url = new URL(origin);
    return url.port || fallback;
  } catch {
    return fallback;
  }
};

export const resolveScanBaseUrl = (req) => {
  const scannerOrigin = cleanUrl(req.get("x-scanner-origin"));
  if (scannerOrigin && isValidHttpUrl(scannerOrigin)) {
    try {
      const url = new URL(scannerOrigin);
      if (!isLocalHost(url.hostname)) {
        return url.origin;
      }
    } catch {
      // fall through to LAN detection
    }
  }

  const clientOrigin = cleanUrl(req.get("x-client-origin") || req.get("origin") || "");
  if (clientOrigin && isValidHttpUrl(clientOrigin)) {
    try {
      const url = new URL(clientOrigin);
      if (!isLocalHost(url.hostname)) {
        return url.origin;
      }
    } catch {
      // fall through
    }
  }

  const lanIp = getLanIpv4();
  const port = resolveClientPort(req);

  if (lanIp) {
    return `http://${lanIp}:${port}`;
  }

  if (clientOrigin && isValidHttpUrl(clientOrigin)) {
    return new URL(clientOrigin).origin;
  }

  return `http://localhost:${port}`;
};
