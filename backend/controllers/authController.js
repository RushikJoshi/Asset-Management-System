import User from "../models/User.js";
import Role, { ensureDefaultRoles } from "../models/Role.js";
import { createToken } from "../utils/authToken.js";

const normalizeRole = async (role) => {
  await ensureDefaultRoles();
  const value = String(role || "EMPLOYEE").toUpperCase().replace(/[\s-]+/g, "_");
  const exists = await Role.exists({ key: value });
  return exists ? value : "EMPLOYEE";
};

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,30}$/;

const normalizeUsername = (value) => String(value || "").trim().toLowerCase();

const findUserByEmailOrUsername = (identifier) => {
  const normalized = String(identifier || "").trim().toLowerCase();
  if (!normalized) return null;

  if (normalized.includes("@")) {
    return User.findOne({ email: normalized });
  }

  return User.findOne({ username: normalized });
};

export const register = async (req, res) => {
  try {
    const { name, username, email, password, employeeId } = req.body;
    const normalizedUsername = normalizeUsername(username);

    if (!name || !normalizedUsername || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, username, email, and password are required",
      });
    }

    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      return res.status(400).json({
        success: false,
        message: "Username must be 3-30 characters and contain only letters, numbers, or underscores",
      });
    }

    const existingEmail = await User.findOne({ email: String(email).toLowerCase() });

    if (existingEmail) {
      return res.status(409).json({ success: false, message: "Email is already registered" });
    }

    const existingUsername = await User.findOne({ username: normalizedUsername });

    if (existingUsername) {
      return res.status(409).json({ success: false, message: "Username is already taken" });
    }

    const hasUsers = await User.exists({});
    const requestedRole = await normalizeRole(req.body.role);
    const role = hasUsers ? requestedRole : "SUPER_ADMIN";
    const user = new User({ name, username: normalizedUsername, email, employeeId, role });
    user.setPassword(password);
    await user.save();

    const token = createToken(user);

    res.status(201).json({
      success: true,
      token,
      user: user.toSafeJSON(),
      message: hasUsers ? "Registration completed" : "First user registered as Super Admin",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email/username and password are required" });
    }

    const user = await findUserByEmailOrUsername(email);

    if (!user || !user.verifyPassword(password)) {
      return res.status(401).json({ success: false, message: "Invalid email/username or password" });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({ success: false, message: "User is inactive" });
    }

    res.status(200).json({
      success: true,
      token: createToken(user),
      user: user.toSafeJSON(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const currentUser = (req, res) => {
  res.status(200).json({ success: true, user: req.user.toSafeJSON() });
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email, employeeId, department, phoneNumber, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(409).json({ success: false, message: "Email is already registered" });
      }
      user.email = email.toLowerCase();
    }

    if (name) user.name = name;
    if (employeeId !== undefined) user.employeeId = employeeId;
    if (department !== undefined) user.department = department;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;

    if (newPassword) {
      user.setPassword(newPassword);
    }

    await user.save();

    res.status(200).json({
      success: true,
      user: user.toSafeJSON(),
      message: "Profile updated successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
