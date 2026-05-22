import mongoose from "mongoose";

const invoiceProductSchema = new mongoose.Schema(
  {
    brand: { type: String, required: true },
    model: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unit: { type: String, default: "1" },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: {
      type: String,
      required: true,
      unique: true,
    },
    invoiceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    products: [invoiceProductSchema],
    poNumber: {
      type: String,
      required: true,
    },
    purchaseOrderDate: {
      type: Date,
      required: true,
    },
    procurer: {
      type: String,
      required: true,
      default: "Albert Admin",
    },
    totalCost: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Invoice = mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);

export default Invoice;
