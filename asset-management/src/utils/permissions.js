export const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  IT_STAFF: "IT Staff",
  AUDITOR: "Auditor",
  EMPLOYEE: "Employee",
};

export const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "IT_STAFF", label: "IT Staff" },
  { value: "AUDITOR", label: "Auditor" },
  { value: "EMPLOYEE", label: "Employee" },
];

export const ROLE_HOME = {
  SUPER_ADMIN: "/",
  ADMIN: "/",
  IT_STAFF: "/assets",
  AUDITOR: "/audit",
  EMPLOYEE: "/employees",
};

export const ROUTE_ROLES = {
  "/": ["SUPER_ADMIN", "ADMIN"],
  "/assets": ["SUPER_ADMIN", "ADMIN", "IT_STAFF"],
  "/requests": ["SUPER_ADMIN", "ADMIN", "IT_STAFF"],
  "/inventory": ["SUPER_ADMIN"],
  "/employees": ["SUPER_ADMIN", "EMPLOYEE"],
  "/assignments": ["SUPER_ADMIN"],
  "/maintenance": ["SUPER_ADMIN"],
  "/warranty": ["SUPER_ADMIN"],
  "/offices": ["SUPER_ADMIN"],
  "/audit": ["SUPER_ADMIN", "AUDITOR"],
  "/reports": ["SUPER_ADMIN", "ADMIN"],
  "/roles": ["SUPER_ADMIN"],
  "/scan-demo": ["SUPER_ADMIN", "ADMIN", "IT_STAFF"],
  "/add-asset": ["SUPER_ADMIN", "ADMIN", "IT_STAFF"],
  "/edit-asset": ["SUPER_ADMIN", "ADMIN", "IT_STAFF"],
  "/add-request": ["SUPER_ADMIN", "ADMIN", "IT_STAFF"],
  "/edit-request": ["SUPER_ADMIN", "ADMIN", "IT_STAFF"],
  "/asset-details": ["SUPER_ADMIN", "ADMIN", "IT_STAFF", "AUDITOR"],
};

export const canAccessRoute = (role, pathname) => {
  const routeKey = Object.keys(ROUTE_ROLES)
    .sort((a, b) => b.length - a.length)
    .find((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!routeKey) return true;
  return ROUTE_ROLES[routeKey].includes(role);
};

export const getRoleHome = (role) => ROLE_HOME[role] || "/employees";
