import mongoose from "mongoose";

const poProductSchema = new mongoose.Schema(
  {
    productName: { type: String },
    requestId: { type: String, default: "" },
    requiredQuantity: { type: Number, default: 1 },
    unitCost: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      unique: true,
    },
    purchaseOrderDate: {
      type: Date,
      default: Date.now,
    },
    raisedBy: {
      type: String,
    },
    vendor: {
      orgName: { type: String },
      contactPerson: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
    shippingAddress: {
      addressLine1: { type: String },
      addressLine2: { type: String, default: "" },
      city: { type: String },
      state: { type: String },
    },
    products: [poProductSchema],
    subTotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    netTotal: { type: Number, default: 0 },
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
