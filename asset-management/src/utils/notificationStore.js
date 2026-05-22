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

const userKeys = (user = {}) =>
  [
    user._id,
    user.id,
    user.email,
    user.employeeId,
    user.username,
    user.name,
  ]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);

const requestOwnerKeys = (asset = {}) =>
  [
    asset.createdBy,
    asset.requestedByUser,
    asset.requestedByEmail,
    asset.employeeEmail,
    asset.employeeId,
    asset.requestedBy,
  ]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);

const hasAnyMatch = (left = [], right = []) =>
  left.some((item) => right.includes(item));

const parseReportingTo = (reportingToString) => {
  if (!reportingToString) return [];
  return reportingToString
    .split(/[\n,;]+/)
    .map(val => val.trim().toLowerCase())
    .filter(Boolean);
};

const isNotificationForUser = (item, user = {}) => {
  const meta = item.meta || {};
  const targets = meta.targetUsers || [];
  const targetRoles = meta.targetRoles || [];
  const excluded = meta.excludeUsers || [];
  const currentKeys = userKeys(user);
  const currentRole = user?.role || "";

  if (excluded.length && hasAnyMatch(currentKeys, excluded)) return false;
  if (currentRole === "SUPER_ADMIN" || currentRole === "ADMIN") return true;
  if (targets.length) return hasAnyMatch(currentKeys, targets);
  if (targetRoles.length) return targetRoles.includes(currentRole);
  return true;
};

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

export function getNotifications(user = {}) {
  return readAll().filter((item) => isNotificationForUser(item, user));
}

export function getUnreadNotificationCount(user = {}) {
  return getNotifications(user).filter((item) => isNotificationUnread(item, user)).length;
}

export function isNotificationUnread(item, user = {}) {
  const currentKeys = userKeys(user);
  if (item.read) return false;
  if (!currentKeys.length) return !item.read;
  return !currentKeys.some((key) => item.readBy?.[key]);
}

export function getUnreadNotificationCountsByMenu(user = {}) {
  return getNotifications(user).reduce((counts, item) => {
    if (!isNotificationUnread(item, user)) return counts;
    const menuLabel = item.meta?.menuLabel;
    if (!menuLabel) return counts;
    return { ...counts, [menuLabel]: (counts[menuLabel] || 0) + 1 };
  }, {});
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

export function syncAssetNotifications(assets = []) {
  const today = new Date();
  const items = [];
  const managedPrefixes = [
    "sys_request_owner_manager_",
    "sys_request_owner_admin_",
    "sys_request_manager_",
    "sys_request_admin_",
    "sys_warranty_",
    "sys_maintenance_",
    "sys_audit_"
  ];

  assets.forEach((asset) => {
    const assetName = asset.assetCode || asset.assetName || asset.requestId || "Record";
    const ownerKeys = requestOwnerKeys(asset);

    if (
      asset.recordType === "REQUEST" &&
      asset.managerApproval !== "Approved"
    ) {
      items.push({
        id: `sys_request_manager_${asset._id}`,
        title: "Manager approval pending",
        message: `${asset.requestId || assetName} needs manager approval.`,
        type: "info",
        meta: {
          requestId: asset._id,
          menuLabel: "Requests",
          route: "/requests",
          targetUsers: parseReportingTo(asset.reportingTo),
          targetRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
          excludeUsers: ownerKeys,
        },
        read: false,
        createdAt: asset.updatedAt || asset.createdAt || new Date().toISOString(),
      });
    }

    if (
      asset.recordType === "REQUEST" &&
      asset.managerApproval === "Approved" &&
      asset.adminApproval !== "Approved"
    ) {
      items.push({
        id: `sys_request_admin_${asset._id}`,
        title: "IT/Admin approval pending",
        message: `${asset.requestId || assetName} is waiting for IT/Admin approval.`,
        type: "info",
        meta: {
          requestId: asset._id,
          menuLabel: "Requests",
          route: "/requests",
          targetRoles: ["SUPER_ADMIN", "ADMIN", "IT_STAFF"],
          excludeUsers: ownerKeys,
        },
        read: false,
        createdAt: asset.updatedAt || asset.createdAt || new Date().toISOString(),
      });
    }

    if (asset.warrantyEnd) {
      const daysLeft = Math.ceil((new Date(asset.warrantyEnd) - today) / 86400000);
      const reminderDays = Number(asset.warrantyReminderDays || 10);
      if (daysLeft >= 0 && daysLeft <= reminderDays) {
        items.push({
          id: `sys_warranty_${asset._id}`,
          title: "Warranty expiring soon",
          message: `${assetName} warranty expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
          type: "info",
          meta: {
            assetId: asset._id,
            menuLabel: "Warranty",
            route: "/warranty",
            targetRoles: ["SUPER_ADMIN", "ADMIN", "IT_STAFF"],
          },
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (
      asset.recordType !== "REQUEST" &&
      asset.purchaseDate &&
      asset.maintenancePeriod
    ) {
      const dueDate = new Date(asset.purchaseDate);
      dueDate.setMonth(dueDate.getMonth() + Number(asset.maintenancePeriod));
      while (dueDate < today) {
        dueDate.setMonth(dueDate.getMonth() + Number(asset.maintenancePeriod));
      }
      const daysLeft = Math.ceil((dueDate - today) / 86400000);
      if (daysLeft >= 0 && daysLeft <= 7) {
        items.push({
          id: `sys_maintenance_${asset._id}`,
          title: "Maintenance due soon",
          message: `${assetName} maintenance is due in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
          type: "info",
          meta: {
            assetId: asset._id,
            menuLabel: "Maintenance",
            route: "/maintenance",
            targetRoles: ["SUPER_ADMIN", "ADMIN", "IT_STAFF"],
          },
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (
      asset.recordType !== "REQUEST" &&
      (!asset.auditLogs?.length || asset.auditLogs[asset.auditLogs.length - 1]?.physicalStatus !== "Verified")
    ) {
      items.push({
        id: `sys_audit_${asset._id}`,
        title: "Audit verification pending",
        message: `${assetName} needs physical verification.`,
        type: "info",
        meta: {
          assetId: asset._id,
          menuLabel: "Audit Session",
          route: "/audit",
          targetRoles: ["SUPER_ADMIN", "AUDITOR"],
        },
        read: false,
        createdAt: asset.updatedAt || asset.createdAt || new Date().toISOString(),
      });
    }

    if (asset.recordType === "REQUEST" && ownerKeys.length) {
      if (asset.managerApproval === "Approved" || asset.managerApproval === "Rejected") {
        items.push({
          id: `sys_request_owner_manager_${asset._id}_${asset.managerApproval}`,
          title: `Manager ${asset.managerApproval.toLowerCase()}`,
          message: `${asset.requestId || assetName} manager status is ${asset.managerApproval}.`,
          type: asset.managerApproval === "Approved" ? "success" : "info",
          meta: {
            requestId: asset._id,
            menuLabel: "Requests",
            route: "/requests",
            targetUsers: ownerKeys,
          },
          read: false,
          createdAt: asset.updatedAt || asset.createdAt || new Date().toISOString(),
        });
      }

      if (asset.adminApproval === "Approved" || asset.adminApproval === "Rejected") {
        items.push({
          id: `sys_request_owner_admin_${asset._id}_${asset.adminApproval}`,
          title: `IT/Admin ${asset.adminApproval.toLowerCase()}`,
          message: `${asset.requestId || assetName} IT/Admin status is ${asset.adminApproval}.`,
          type: asset.adminApproval === "Approved" ? "success" : "info",
          meta: {
            requestId: asset._id,
            menuLabel: "Requests",
            route: "/requests",
            targetUsers: ownerKeys,
          },
          read: false,
          createdAt: asset.updatedAt || asset.createdAt || new Date().toISOString(),
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

export function markUserNotificationsRead(user = {}) {
  const currentKeys = userKeys(user);
  if (!currentKeys.length) {
    markAllNotificationsRead();
    return;
  }

  writeAll(
    readAll().map((item) =>
      isNotificationForUser(item, user)
        ? {
            ...item,
            readBy: currentKeys.reduce(
              (acc, key) => ({ ...acc, [key]: true }),
              item.readBy || {},
            ),
          }
        : item,
    ),
  );
}

export function markUserNotificationsReadByMenu(menuLabel, user = {}) {
  const currentKeys = userKeys(user);
  if (!menuLabel) return;

  writeAll(
    readAll().map((item) => {
      if (!isNotificationForUser(item, user) || item.meta?.menuLabel !== menuLabel) {
        return item;
      }

      if (!currentKeys.length) return { ...item, read: true };

      return {
        ...item,
        readBy: currentKeys.reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          item.readBy || {},
        ),
      };
    }),
  );
}

export function markUserNotificationRead(id, user = {}) {
  const currentKeys = userKeys(user);
  writeAll(
    readAll().map((item) => {
      if (item.id !== id) return item;
      if (!currentKeys.length) return { ...item, read: true };
      return {
        ...item,
        readBy: currentKeys.reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          item.readBy || {},
        ),
      };
    }),
  );
}

export function markNotificationRead(id) {
  writeAll(
    readAll().map((item) => (item.id === id ? { ...item, read: true } : item)),
  );
}
