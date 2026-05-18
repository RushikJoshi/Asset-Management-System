import User, { USER_ROLES } from "../models/User.js";
import { createToken } from "../utils/authToken.js";

const normalizeRole = (role) => {
  const value = String(role || "EMPLOYEE").toUpperCase().replace(/[\s-]+/g, "_");
  return USER_ROLES.includes(value) ? value : "EMPLOYEE";
};

export const register = async (req, res) => {
  try {
    const { name, email, password, employeeId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email: String(email).toLowerCase() });

    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email is already registered" });
    }

    const hasUsers = await User.exists({});
    const requestedRole = normalizeRole(req.body.role);
    const role = hasUsers ? requestedRole : "SUPER_ADMIN";
    const user = new User({ name, email, employeeId, role });
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
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });

    if (!user || !user.verifyPassword(password)) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
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
