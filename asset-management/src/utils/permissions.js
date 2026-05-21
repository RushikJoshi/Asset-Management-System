export const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  IT_STAFF: "IT Staff",
  MANAGER: "Manager",
  AUDITOR: "Auditor",
  EMPLOYEE: "Employee",
};

export const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "IT_STAFF", label: "IT Staff" },
  { value: "MANAGER", label: "Manager" },
  { value: "AUDITOR", label: "Auditor" },
  { value: "EMPLOYEE", label: "Employee" },
];

export const ROLE_HOME = {
  SUPER_ADMIN: "/",
  ADMIN: "/",
  IT_STAFF: "/assets",
  MANAGER: "/requests",
  AUDITOR: "/audit",
  EMPLOYEE: "/employees",
};

export const PERMISSION_OPTIONS = [
  { value: "dashboard.view", label: "Dashboard View", group: "Dashboard" },
  { value: "asset.view", label: "Asset View", group: "Assets" },
  { value: "asset.create", label: "Asset Add", group: "Assets" },
  { value: "asset.edit", label: "Asset Edit", group: "Assets" },
  { value: "asset.delete", label: "Asset Delete", group: "Assets" },
  { value: "asset.assign", label: "Asset Assign", group: "Assets" },
  { value: "qr.generate", label: "QR Generate", group: "QR" },
  { value: "qr.scan", label: "QR Scan", group: "QR" },
  { value: "request.view", label: "Request View", group: "Requests" },
  { value: "request.create", label: "Create Request", group: "Requests" },
  { value: "request.approve", label: "Request Approve", group: "Requests" },
  { value: "request.reject", label: "Request Reject", group: "Requests" },
  { value: "inventory.view", label: "Inventory View", group: "Inventory" },
  { value: "inventory.manage", label: "Inventory Management", group: "Inventory" },
  { value: "maintenance.view", label: "Maintenance View", group: "Maintenance" },
  { value: "maintenance.manage", label: "Maintenance Management", group: "Maintenance" },
  { value: "warranty.view", label: "Warranty View", group: "Warranty" },
  { value: "warranty.manage", label: "Warranty Management", group: "Warranty" },
  { value: "employee.portal", label: "Employee Portal Access", group: "Employees" },
  { value: "user.manage", label: "Users & Roles Management", group: "Users" },
  { value: "office.view", label: "Office View", group: "Offices" },
  { value: "office.manage", label: "Office Management", group: "Offices" },
  { value: "report.view", label: "Reports View", group: "Reports" },
  { value: "report.export", label: "Reports Export", group: "Reports" },
  { value: "audit.view", label: "Audit Session View", group: "Audit" },
  { value: "audit.manage", label: "Audit Session Management", group: "Audit" },
  { value: "system.settings", label: "System Settings Access", group: "System" },
];

export const MENU_ACCESS_OPTIONS = [
  { label: "Dashboard", routes: ["/"] },
  { label: "Assets", routes: ["/assets", "/add-asset", "/edit-asset", "/asset-details"] },
  { label: "Masters", routes: ["/masters", "/master-editor", "/masters/asset-form", "/masters/request-form", "/masters/categories"] },
  { label: "QR Console", routes: ["/scan-demo"] },
  { label: "Requests", routes: ["/requests", "/add-request", "/edit-request"] },
  { label: "Inventory", routes: ["/inventory"] },
  { label: "Employee Portal", routes: ["/employees"] },
  { label: "Assignments", routes: ["/assignments"] },
  { label: "Maintenance", routes: ["/maintenance"] },
  { label: "Warranty", routes: ["/warranty"] },
  { label: "Offices", routes: ["/offices"] },
  { label: "Audit Session", routes: ["/audit"] },
  { label: "Reports", routes: ["/reports"] },
  { label: "Users & Access", routes: ["/roles"] },
];

export const DEFAULT_ROLE_CONFIG = {
  SUPER_ADMIN: {
    sidebarAccess: MENU_ACCESS_OPTIONS.map((item) => item.label),
    permissions: PERMISSION_OPTIONS.map((item) => item.value),
  },
  ADMIN: {
    sidebarAccess: [
      "Dashboard",
      "Assets",
      "Masters",
      "QR Console",
      "Requests",
      "Inventory",
      "Employee Portal",
      "Assignments",
      "Maintenance",
      "Warranty",
      "Offices",
      "Audit Session",
      "Reports",
      "Users & Access",
    ],
    permissions: [
      "dashboard.view",
      "asset.view",
      "asset.create",
      "asset.edit",
      "asset.delete",
      "asset.assign",
      "qr.generate",
      "qr.scan",
      "request.view",
      "request.approve",
      "request.reject",
      "inventory.view",
      "inventory.manage",
      "maintenance.view",
      "maintenance.manage",
      "warranty.view",
      "warranty.manage",
      "employee.portal",
      "user.manage",
      "office.view",
      "office.manage",
      "report.view",
      "report.export",
      "audit.view",
    ],
  },
  IT_STAFF: {
    sidebarAccess: ["Dashboard", "Assets", "QR Console", "Requests", "Inventory", "Assignments", "Maintenance", "Warranty", "Reports", "Masters"],
    permissions: [
      "dashboard.view",
      "asset.view",
      "asset.create",
      "asset.edit",
      "asset.assign",
      "qr.generate",
      "qr.scan",
      "request.view",
      "request.create",
      "inventory.view",
      "maintenance.view",
      "maintenance.manage",
      "warranty.view",
      "report.view",
    ],
  },
  MANAGER: {
    sidebarAccess: ["Dashboard", "Assets", "Requests", "Reports"],
    permissions: ["dashboard.view", "asset.view", "request.view", "request.approve", "request.reject", "report.view"],
  },
  EMPLOYEE: {
    sidebarAccess: ["Employee Portal", "Requests", "Warranty", "QR Console"],
    permissions: ["employee.portal", "asset.view", "request.create", "request.view", "warranty.view", "qr.scan"],
  },
  AUDITOR: {
    sidebarAccess: ["Audit Session", "Reports", "Assets"],
    permissions: ["audit.view", "report.view", "asset.view"],
  },
};

export const ROUTE_ROLES = {
  "/": ["SUPER_ADMIN", "ADMIN"],
  "/assets": ["SUPER_ADMIN", "ADMIN", "IT_STAFF"],
  "/requests": ["SUPER_ADMIN", "ADMIN", "IT_STAFF", "MANAGER"],
  "/inventory": ["SUPER_ADMIN"],
  "/employees": ["SUPER_ADMIN", "EMPLOYEE"],
  "/assignments": ["SUPER_ADMIN"],
  "/maintenance": ["SUPER_ADMIN"],
  "/warranty": ["SUPER_ADMIN"],
  "/offices": ["SUPER_ADMIN"],
  "/audit": ["SUPER_ADMIN", "AUDITOR"],
  "/reports": ["SUPER_ADMIN", "ADMIN"],
  "/roles": ["SUPER_ADMIN"],
  "/master-editor": ["SUPER_ADMIN", "ADMIN", "IT_STAFF"],
  "/masters": ["SUPER_ADMIN", "ADMIN", "IT_STAFF"],
  "/scan-demo": ["SUPER_ADMIN", "ADMIN", "IT_STAFF"],
  "/add-asset": ["SUPER_ADMIN", "ADMIN", "IT_STAFF"],
  "/edit-asset": ["SUPER_ADMIN", "ADMIN", "IT_STAFF"],
  "/add-request": ["SUPER_ADMIN", "ADMIN", "IT_STAFF", "MANAGER"],
  "/edit-request": ["SUPER_ADMIN", "ADMIN", "IT_STAFF", "MANAGER"],
  "/asset-details": ["SUPER_ADMIN", "ADMIN", "IT_STAFF", "AUDITOR"],
  "/profile": ["SUPER_ADMIN", "ADMIN", "IT_STAFF", "MANAGER", "AUDITOR", "EMPLOYEE"],
};

export const ROUTE_PERMISSIONS = {
  "/": ["dashboard.view"],
  "/assets": ["asset.view"],
  "/requests": ["request.view"],
  "/inventory": ["inventory.view", "inventory.manage"],
  "/employees": ["employee.portal"],
  "/assignments": ["asset.assign"],
  "/maintenance": ["maintenance.view", "maintenance.manage"],
  "/warranty": ["warranty.view", "warranty.manage"],
  "/offices": ["office.view", "office.manage"],
  "/audit": ["audit.view", "audit.manage"],
  "/reports": ["report.view"],
  "/roles": ["user.manage"],
  "/master-editor": ["system.settings", "user.manage"],
  "/masters": ["system.settings", "user.manage"],
  "/masters/asset-form": ["asset.create", "asset.edit", "asset.view"],
  "/masters/request-form": ["request.view"],
  "/masters/categories": [],
  "/add-request": ["request.create"],
  "/edit-request": ["request.create"],
  "/asset-details": ["asset.view"],
  "/profile": [],
};

export const parseAccessLabels = (access = "") =>
  Array.isArray(access)
    ? access.map((item) => String(item || "").trim()).filter(Boolean)
    : String(access || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

export const formatAccessLabels = (labels = []) =>
  labels.filter(Boolean).join(", ");

export const getMenuOption = (label) =>
  MENU_ACCESS_OPTIONS.find((item) => item.label.toLowerCase() === String(label || "").trim().toLowerCase());

export const getAccessibleRoutes = (access = "") =>
  parseAccessLabels(access)
    .flatMap((label) => getMenuOption(label)?.routes || [])
    .filter(Boolean);

export const roleHasMenuAccess = (role, menuLabel, access = "") => {
  if (role === "SUPER_ADMIN") return true;
  const selected = parseAccessLabels(access);
  if (selected.length) {
    return selected.some((label) => label.toLowerCase() === menuLabel.toLowerCase());
  }
  return false;
};

export const canAccessRoute = (role, pathname, access = "", permissions = []) => {
  if (role === "SUPER_ADMIN") return true;
  if (pathname === "/profile") return true;

  const routePermissionKey = Object.keys(ROUTE_PERMISSIONS)
    .sort((a, b) => b.length - a.length)
    .find((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (routePermissionKey && permissions.length) {
    const allowed = ROUTE_PERMISSIONS[routePermissionKey];
    if (!allowed.length) return true;
    return allowed.some((permission) => permissions.includes(permission));
  }

  const accessRoutes = getAccessibleRoutes(access);
  if (accessRoutes.length) {
    return accessRoutes.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  }

  const routeKey = Object.keys(ROUTE_ROLES)
    .sort((a, b) => b.length - a.length)
    .find((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!routeKey) return true;
  return ROUTE_ROLES[routeKey].includes(role);
};

export const getRoleHome = (role, access = "") => {
  const accessRoutes = getAccessibleRoutes(access);
  return ROLE_HOME[role] || accessRoutes[0] || "/employees";
};
