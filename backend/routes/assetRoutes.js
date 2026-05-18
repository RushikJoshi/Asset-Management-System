import express from "express";
import {
  createAsset,
  createWorkflowEvent,
  deleteAsset,
  getAllAssets,
  getAsset,
  getDashboard,
  getReports,
  getScanAsset,
  refreshQrCodes,
  seedWorkflowDemoData,
  updateAsset,
} from "../controllers/assetController.js";
import { currentUser, login, register, updateProfile } from "../controllers/authController.js";
import { allowRoles, authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/auth/register", register);
router.post("/auth/login", login);
router.get("/auth/me", authenticate, currentUser);
router.put("/auth/profile/update", authenticate, updateProfile);

router.get("/scan/:id", getScanAsset);

router.get("/assets", authenticate, getAllAssets);
router.get("/dashboard", authenticate, getDashboard);
router.get("/reports", authenticate, allowRoles("SUPER_ADMIN", "ADMIN"), getReports);
router.post("/qr/refresh", authenticate, allowRoles("SUPER_ADMIN", "ADMIN", "IT_STAFF"), refreshQrCodes);
router.post("/demo/warranty-maintenance", authenticate, allowRoles("SUPER_ADMIN", "ADMIN", "IT_STAFF"), seedWorkflowDemoData);
router.get("/asset/:id", authenticate, getAsset);
router.put("/asset/update/:id", authenticate, allowRoles("SUPER_ADMIN", "ADMIN", "IT_STAFF", "AUDITOR"), updateAsset);
router.post("/asset/create", authenticate, allowRoles("SUPER_ADMIN", "ADMIN", "IT_STAFF"), createAsset);
router.post("/asset/:id/workflow/:workflow", authenticate, allowRoles("SUPER_ADMIN", "ADMIN", "IT_STAFF", "AUDITOR"), createWorkflowEvent);
router.delete("/asset/delete/:id", authenticate, allowRoles("SUPER_ADMIN", "ADMIN"), deleteAsset);

export default router;
