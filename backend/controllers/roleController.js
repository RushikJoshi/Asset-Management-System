import Role, { ensureDefaultRoles } from "../models/Role.js";
import User from "../models/User.js";

const toRoleKey = (label) =>
  String(label || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^A-Z0-9_]/g, "");

export const listRoles = async (_req, res) => {
  try {
    await ensureDefaultRoles();
    const roles = await Role.find().sort({ isSystem: -1, label: 1 }).lean();
    res.status(200).json({ success: true, roles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createRole = async (req, res) => {
  try {
    const label = String(req.body.label || "").trim();
    const access = String(req.body.access || "").trim();

    if (!label) {
      return res.status(400).json({ success: false, message: "Role name is required" });
    }

    const key = toRoleKey(label);
    if (!key) {
      return res.status(400).json({ success: false, message: "Role name is invalid" });
    }

    const existing = await Role.findOne({ $or: [{ key }, { label }] });
    if (existing) {
      return res.status(409).json({ success: false, message: "Role already exists" });
    }

    const role = await Role.create({ key, label, access, isSystem: false });
    res.status(201).json({ success: true, role });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRole = async (req, res) => {
  try {
    const key = String(req.params.key || "").toUpperCase().trim();
    const role = await Role.findOne({ key });

    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    const label = String(req.body.label ?? role.label).trim();
    const access = String(req.body.access ?? role.access ?? "").trim();

    if (!label) {
      return res.status(400).json({ success: false, message: "Role name is required" });
    }

    const duplicate = await Role.findOne({ label, key: { $ne: key } });
    if (duplicate) {
      return res.status(409).json({ success: false, message: "Role name already exists" });
    }

    role.label = label;
    role.access = access;
    await role.save();

    res.status(200).json({ success: true, role });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const key = String(req.params.key || "").toUpperCase().trim();
    const role = await Role.findOne({ key });

    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    if (role.isSystem) {
      return res.status(403).json({ success: false, message: "System roles cannot be deleted" });
    }

    const usersWithRole = await User.countDocuments({ role: key });
    if (usersWithRole > 0) {
      return res.status(409).json({
        success: false,
        message: "This role is assigned to users. Reassign them before deleting.",
      });
    }

    await Role.deleteOne({ key });
    res.status(200).json({ success: true, message: "Role deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
