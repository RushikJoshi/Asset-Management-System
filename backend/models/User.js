import crypto from "crypto";
import mongoose from "mongoose";

export const USER_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "IT_STAFF",
  "MANAGER",
  "AUDITOR",
  "EMPLOYEE",
];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    employeeId: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    profilePhoto: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      default: "EMPLOYEE",
      required: true,
      trim: true,
      uppercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    passwordSalt: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  { timestamps: true },
);

userSchema.methods.setPassword = function setPassword(password) {
  this.passwordSalt = crypto.randomBytes(16).toString("hex");
  this.passwordHash = crypto
    .pbkdf2Sync(password, this.passwordSalt, 120000, 64, "sha512")
    .toString("hex");
};

userSchema.methods.verifyPassword = function verifyPassword(password) {
  const incomingHash = crypto
    .pbkdf2Sync(password, this.passwordSalt, 120000, 64, "sha512")
    .toString("hex");

  return crypto.timingSafeEqual(
    Buffer.from(this.passwordHash, "hex"),
    Buffer.from(incomingHash, "hex"),
  );
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    username: this.username,
    email: this.email,
    employeeId: this.employeeId,
    role: this.role,
    status: this.status,
    department: this.department,
    phoneNumber: this.phoneNumber,
    profilePhoto: this.profilePhoto,
  };
};

export default mongoose.model("User", userSchema);
