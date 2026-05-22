import PurchaseOrder from "../models/PurchaseOrder.js";

// Helper to auto-generate PO Number starting from PO-45 to continue user's sample data seamlessly
const generateNextPoNumber = async () => {
  const lastPo = await PurchaseOrder.findOne().sort({ createdAt: -1 });
  if (!lastPo) {
    return "PO-45";
  }
  const match = lastPo.poNumber.match(/PO-(\d+)/);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `PO-${nextNum}`;
  }
  return "PO-45";
};

// Create a Purchase Order
export const createPurchaseOrder = async (req, res) => {
  try {
    const { vendor, shippingAddress, products, taxPercent = 18 } = req.body;

    if (!vendor || !vendor.orgName) {
      return res.status(400).json({ success: false, message: "Vendor organization name is required" });
    }
    if (!shippingAddress || !shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.state) {
      return res.status(400).json({ success: false, message: "Valid shipping address is required" });
    }
    if (!products || !products.length) {
      return res.status(400).json({ success: false, message: "At least one product line item is required" });
    }

    // Calculate totals on backend to guarantee accuracy
    let subTotal = 0;
    const validatedProducts = products.map((item) => {
      const quantity = Math.max(1, Number(item.requiredQuantity || 1));
      const unitCost = Math.max(0, Number(item.unitCost || 0));
      const cost = quantity * unitCost;
      subTotal += cost;
      return {
        productName: item.productName,
        requestId: item.requestId || "",
        requiredQuantity: quantity,
        unitCost: unitCost,
        cost: cost,
      };
    });

    const tax = Math.round((subTotal * (taxPercent / 100)) * 100) / 100;
    const netTotal = subTotal + tax;
    const poNumber = await generateNextPoNumber();
    const raisedBy = req.user?.name || req.user?.username || "Admin";

    const newPo = await PurchaseOrder.create({
      poNumber,
      raisedBy,
      vendor,
      shippingAddress,
      products: validatedProducts,
      subTotal,
      tax,
      netTotal,
      status: "PO Raised",
    });

    res.status(201).json({
      success: true,
      message: "Purchase Order raised successfully",
      purchaseOrder: newPo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all Purchase Orders
export const getAllPurchaseOrders = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status && status !== "ALL") {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { poNumber: searchRegex },
        { raisedBy: searchRegex },
        { "vendor.orgName": searchRegex },
        { "products.productName": searchRegex },
      ];
    }

    const purchaseOrders = await PurchaseOrder.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: purchaseOrders.length,
      purchaseOrders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single Purchase Order
export const getPurchaseOrderById = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) {
      return res.status(404).json({
        success: false,
        message: "Purchase Order not found",
      });
    }
    res.status(200).json({
      success: true,
      purchaseOrder: po,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Purchase Order Status
export const updatePurchaseOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["PO Raised", "Received", "Partially Received"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const po = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!po) {
      return res.status(404).json({
        success: false,
        message: "Purchase Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Purchase Order status updated successfully",
      purchaseOrder: po,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
