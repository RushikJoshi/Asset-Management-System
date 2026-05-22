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
  getQrScanBaseUrl,
  seedWorkflowDemoData,
  updateAsset,
} from "../controllers/assetController.js";
import { currentUser, login, register, updateProfile } from "../controllers/authController.js";
import { createRole, deleteRole, listRoles, updateRole } from "../controllers/roleController.js";
import {
  createPurchaseOrder,
  getAllPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrderStatus,
} from "../controllers/purchaseOrderController.js";
import { getAllInvoices } from "../controllers/invoiceController.js";
import {
  getAllWorkOrders,
  getWorkOrderById,
  createWorkOrder,
  updateWorkOrder,
} from "../controllers/workOrderController.js";
import { allowPermissions, authenticate } from "../middlewares/authMiddleware.js";
import { PERMISSIONS } from "../utils/permissionCatalog.js";

const router = express.Router();

router.get("/roles", listRoles);
router.post("/roles", authenticate, allowPermissions(PERMISSIONS.USER_MANAGE), createRole);
router.put("/roles/:key", authenticate, allowPermissions(PERMISSIONS.USER_MANAGE), updateRole);
router.delete("/roles/:key", authenticate, allowPermissions(PERMISSIONS.USER_MANAGE), deleteRole);
router.post("/auth/register", register);
router.post("/auth/login", login);
router.get("/auth/me", authenticate, currentUser);
router.put("/auth/profile/update", authenticate, updateProfile);

router.get("/scan/:id", getScanAsset);
router.get("/qr/scan-base-url", authenticate, getQrScanBaseUrl);

router.get("/assets", authenticate, allowPermissions(PERMISSIONS.ASSET_VIEW, PERMISSIONS.REQUEST_VIEW), getAllAssets);
router.get("/dashboard", authenticate, allowPermissions(PERMISSIONS.DASHBOARD_VIEW), getDashboard);
router.get("/reports", authenticate, allowPermissions(PERMISSIONS.REPORT_VIEW), getReports);
router.post("/qr/refresh", authenticate, allowPermissions(PERMISSIONS.QR_GENERATE), refreshQrCodes);
router.post("/demo/warranty-maintenance", authenticate, allowPermissions(PERMISSIONS.MAINTENANCE_MANAGE), seedWorkflowDemoData);
router.get("/asset/:id", authenticate, allowPermissions(PERMISSIONS.ASSET_VIEW), getAsset);
router.put("/asset/update/:id", authenticate, allowPermissions(PERMISSIONS.ASSET_EDIT, PERMISSIONS.ASSET_ASSIGN, PERMISSIONS.REQUEST_APPROVE, PERMISSIONS.REQUEST_REJECT, PERMISSIONS.AUDIT_MANAGE, PERMISSIONS.AUDIT_VIEW), updateAsset);
router.post("/asset/create", authenticate, allowPermissions(PERMISSIONS.ASSET_CREATE, PERMISSIONS.REQUEST_CREATE), createAsset);
router.post("/asset/:id/workflow/:workflow", authenticate, allowPermissions(PERMISSIONS.AUDIT_MANAGE, PERMISSIONS.MAINTENANCE_MANAGE), createWorkflowEvent);
router.delete("/asset/delete/:id", authenticate, allowPermissions(PERMISSIONS.ASSET_DELETE, PERMISSIONS.REQUEST_CREATE), deleteAsset);

// Purchase Order Routes
router.post("/purchase-orders", authenticate, allowPermissions(PERMISSIONS.PROCUREMENT_MANAGE), createPurchaseOrder);
router.get("/purchase-orders", authenticate, allowPermissions(PERMISSIONS.PROCUREMENT_MANAGE), getAllPurchaseOrders);
router.get("/purchase-orders/:id", authenticate, allowPermissions(PERMISSIONS.PROCUREMENT_MANAGE), getPurchaseOrderById);
router.put("/purchase-orders/:id/status", authenticate, allowPermissions(PERMISSIONS.PROCUREMENT_MANAGE), updatePurchaseOrderStatus);

// Invoice Routes
router.get("/invoices", authenticate, allowPermissions(PERMISSIONS.PROCUREMENT_MANAGE), getAllInvoices);

// Work Order Routes
router.get("/work-orders", authenticate, allowPermissions(PERMISSIONS.WORK_ORDERS_MANAGE), getAllWorkOrders);
router.get("/work-orders/:id", authenticate, allowPermissions(PERMISSIONS.WORK_ORDERS_MANAGE), getWorkOrderById);
router.post("/work-orders", authenticate, allowPermissions(PERMISSIONS.WORK_ORDERS_MANAGE), createWorkOrder);
router.put("/work-orders/:id", authenticate, allowPermissions(PERMISSIONS.WORK_ORDERS_MANAGE), updateWorkOrder);

export default router;
