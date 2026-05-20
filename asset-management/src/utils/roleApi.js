import apiInstance from "../apis/apiConfig";
import { DEFAULT_ROLE_CONFIG, ROLE_OPTIONS } from "./permissions";

const fallbackRoles = () =>
  ROLE_OPTIONS.map((role) => ({
    key: role.value,
    label: role.label,
    access: (DEFAULT_ROLE_CONFIG[role.value]?.sidebarAccess || []).join(", "),
    sidebarAccess: DEFAULT_ROLE_CONFIG[role.value]?.sidebarAccess || [],
    permissions: DEFAULT_ROLE_CONFIG[role.value]?.permissions || [],
  }));

export const fetchRoles = async () => {
  try {
    const response = await apiInstance.get("/roles");
    const roles = response.data?.roles || [];
    if (!roles.length) return fallbackRoles();
    return roles;
  } catch {
    return fallbackRoles();
  }
};

export const createRole = async (payload) => {
  const response = await apiInstance.post("/roles", payload);
  return response.data?.role;
};

export const updateRole = async (key, payload) => {
  const response = await apiInstance.put(`/roles/${key}`, payload);
  return response.data?.role;
};

export const deleteRole = async (key) => {
  const response = await apiInstance.delete(`/roles/${key}`);
  return response.data;
};

export const rolesToOptions = (roles) =>
  roles.map((role) => ({
    value: role.key,
    label: role.label,
  }));
