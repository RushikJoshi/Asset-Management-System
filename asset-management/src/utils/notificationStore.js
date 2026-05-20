const STORAGE_KEY = "assetpro_app_notifications";
const EVENT_NAME = "assetpro-notifications";

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeAll(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 80)));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

function upsertSystemNotifications(incoming, managedPrefixes = []) {
  const existing = readAll();
  const incomingIds = new Set(incoming.map((item) => item.id));
  const keepExisting = existing.filter((item) => {
    const isManaged = managedPrefixes.some((prefix) => item.id?.startsWith(prefix));
    return !isManaged || incomingIds.has(item.id);
  });
  const seen = new Set(keepExisting.map((item) => item.id));
  const next = [
    ...incoming.filter((item) => !seen.has(item.id)),
    ...keepExisting,
  ];

  writeAll(next);
}

export function subscribeNotifications(handler) {
  const listener = () => handler(readAll());
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}

export function getNotifications() {
  return readAll();
}

export function getUnreadNotificationCount() {
  return readAll().filter((item) => !item.read).length;
}

export function pushAppNotification({ title, message, type = "success", meta = {} }) {
  const items = readAll();
  items.unshift({
    id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title,
    message,
    type,
    meta,
    read: false,
    createdAt: new Date().toISOString(),
  });
  writeAll(items);
}

export function syncAssetNotifications(assets = [], role = "") {
  const today = new Date();
  const items = [];
  const managedPrefixes = [];

  if (["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(role)) {
    managedPrefixes.push("sys_request_manager_");
  }
  if (["SUPER_ADMIN", "ADMIN", "IT_STAFF"].includes(role)) {
    managedPrefixes.push("sys_request_admin_", "sys_warranty_");
  }

  assets.forEach((asset) => {
    const assetName = asset.assetCode || asset.assetName || asset.requestId || "Record";

    if (
      asset.recordType === "REQUEST" &&
      asset.managerApproval !== "Approved" &&
      ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(role)
    ) {
      items.push({
        id: `sys_request_manager_${asset._id}`,
        title: "Manager approval pending",
        message: `${asset.requestId || assetName} needs manager approval.`,
        type: "info",
        meta: { requestId: asset._id },
        read: false,
        createdAt: asset.updatedAt || asset.createdAt || new Date().toISOString(),
      });
    }

    if (
      asset.recordType === "REQUEST" &&
      asset.managerApproval === "Approved" &&
      asset.adminApproval !== "Approved" &&
      ["SUPER_ADMIN", "ADMIN", "IT_STAFF"].includes(role)
    ) {
      items.push({
        id: `sys_request_admin_${asset._id}`,
        title: "IT/Admin approval pending",
        message: `${asset.requestId || assetName} is waiting for IT/Admin approval.`,
        type: "info",
        meta: { requestId: asset._id },
        read: false,
        createdAt: asset.updatedAt || asset.createdAt || new Date().toISOString(),
      });
    }

    if (asset.warrantyEnd && ["SUPER_ADMIN", "ADMIN", "IT_STAFF"].includes(role)) {
      const daysLeft = Math.ceil((new Date(asset.warrantyEnd) - today) / 86400000);
      const reminderDays = Number(asset.warrantyReminderDays || 10);
      if (daysLeft >= 0 && daysLeft <= reminderDays) {
        items.push({
          id: `sys_warranty_${asset._id}`,
          title: "Warranty expiring soon",
          message: `${assetName} warranty expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
          type: "info",
          meta: { assetId: asset._id },
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
  });

  if (items.length || managedPrefixes.length) {
    upsertSystemNotifications(items, managedPrefixes);
  }
}

export function markAllNotificationsRead() {
  writeAll(readAll().map((item) => ({ ...item, read: true })));
}

export function markNotificationRead(id) {
  writeAll(
    readAll().map((item) => (item.id === id ? { ...item, read: true } : item)),
  );
}
