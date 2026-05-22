import mongoose from "mongoose";

const poProductSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },
    requestId: { type: String, default: "" },
    requiredQuantity: { type: Number, required: true, default: 1 },
    unitCost: { type: Number, required: true, default: 0 },
    cost: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      required: true,
      unique: true,
    },
    purchaseOrderDate: {
      type: Date,
      default: Date.now,
    },
    raisedBy: {
      type: String,
      required: true,
    },
    vendor: {
      orgName: { type: String, required: true },
      contactPerson: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
    shippingAddress: {
      addressLine1: { type: String, required: true },
      addressLine2: { type: String, default: "" },
      city: { type: String, required: true },
      state: { type: String, required: true },
    },
    products: [poProductSchema],
    subTotal: { type: Number, required: true, default: 0 },
    tax: { type: Number, required: true, default: 0 },
    netTotal: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ["PO Raised", "Received", "Partially Received"],
      default: "PO Raised",
    },
  },
  {
    timestamps: true,
  }
);

const PurchaseOrder = mongoose.models.PurchaseOrder || mongoose.model("PurchaseOrder", purchaseOrderSchema);

export default PurchaseOrder;
