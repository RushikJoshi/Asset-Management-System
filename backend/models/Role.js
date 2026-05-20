import mongoose from "mongoose";
import { DEFAULT_ROLE_PERMISSIONS, DEFAULT_ROLE_SIDEBAR } from "../utils/permissionCatalog.js";

export const DEFAULT_ROLES = [
  { key: "SUPER_ADMIN", label: "Super Admin", isSystem: true },
  { key: "ADMIN", label: "Admin", isSystem: true },
  { key: "IT_STAFF", label: "IT Staff", isSystem: true },
  { key: "MANAGER", label: "Manager", isSystem: true },
  { key: "AUDITOR", label: "Auditor", isSystem: true },
  { key: "EMPLOYEE", label: "Employee", isSystem: true },
].map((role) => ({
  ...role,
  sidebarAccess: DEFAULT_ROLE_SIDEBAR[role.key] || [],
  permissions: DEFAULT_ROLE_PERMISSIONS[role.key] || [],
  access: (DEFAULT_ROLE_SIDEBAR[role.key] || []).join(", "),
}));

const roleSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, uppercase: true, trim: true },
    label: { type: String, required: true, trim: true },
    access: { type: String, default: "", trim: true },
    sidebarAccess: [{ type: String, trim: true }],
    permissions: [{ type: String, trim: true }],
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Role = mongoose.models.Role || mongoose.model("Role", roleSchema);

export const ensureDefaultRoles = async () => {
  await Promise.all(
    DEFAULT_ROLES.map((role) =>
      Role.updateOne(
        { key: role.key },
        {
          $set: {
            label: role.label,
            access: role.access,
            sidebarAccess: role.sidebarAccess,
            permissions: role.permissions,
            isSystem: true,
          },
        },
        { upsert: true },
      ),
    ),
  );
};

export default Role;
