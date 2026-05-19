import mongoose from "mongoose";

export const DEFAULT_ROLES = [
  { key: "SUPER_ADMIN", label: "Super Admin", access: "Dashboard, Assets, Requests, Reports, Employee Portal, Audit Session", isSystem: true },
  { key: "ADMIN", label: "Admin", access: "Dashboard, Assets, Requests, Reports", isSystem: true },
  { key: "IT_STAFF", label: "IT Staff", access: "Assets, Requests", isSystem: true },
  { key: "AUDITOR", label: "Auditor", access: "Audit Session", isSystem: true },
  { key: "EMPLOYEE", label: "Employee", access: "Employee Portal", isSystem: true },
];

const roleSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, uppercase: true, trim: true },
    label: { type: String, required: true, trim: true },
    access: { type: String, default: "", trim: true },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Role = mongoose.models.Role || mongoose.model("Role", roleSchema);

export const ensureDefaultRoles = async () => {
  await Promise.all(
    DEFAULT_ROLES.map((role) =>
      Role.updateOne({ key: role.key }, { $setOnInsert: role }, { upsert: true }),
    ),
  );
};

export default Role;
