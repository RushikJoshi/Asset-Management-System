import "dotenv/config";
import mongoose from "mongoose";
import PurchaseOrder from "../models/PurchaseOrder.js";
import Invoice from "../models/Invoice.js";
import Role, { ensureDefaultRoles } from "../models/Role.js";

const today = new Date();
const daysAgo = (num) => {
  const d = new Date();
  d.setDate(d.getDate() - num);
  return d;
};

const samplePurchaseOrders = [
  {
    poNumber: "PO-40",
    purchaseOrderDate: new Date("2026-02-20"),
    raisedBy: "Albert Admin",
    vendor: {
      orgName: "Luna",
      contactPerson: "Luna Lovegood",
      email: "contact@luna-it.com",
      phone: "+91-9988776611",
    },
    shippingAddress: {
      addressLine1: "Suite 404, Tech Park",
      addressLine2: "Gota",
      city: "Ahmedabad",
      state: "Gujarat",
    },
    products: [
      {
        productName: "Apple iPhone 15 Pro",
        requestId: "Req-120",
        requiredQuantity: 5,
        unitCost: 120000,
        cost: 600000,
      },
    ],
    subTotal: 600000,
    tax: 108000,
    netTotal: 708000,
    status: "Received",
  },
  {
    poNumber: "PO-41",
    purchaseOrderDate: daysAgo(2),
    raisedBy: "Albert Admin",
    vendor: {
      orgName: "Zylker",
      contactPerson: "Zack Rider",
      email: "info@zylker.com",
      phone: "+91-9090909090",
    },
    shippingAddress: {
      addressLine1: "12th Floor, Trade Center",
      addressLine2: "S.G. Highway",
      city: "Ahmedabad",
      state: "Gujarat",
    },
    products: [
      {
        productName: "Dell Inspiron 16",
        requestId: "Req-121",
        requiredQuantity: 10,
        unitCost: 75000,
        cost: 750000,
      },
    ],
    subTotal: 750000,
    tax: 135000,
    netTotal: 885000,
    status: "PO Raised",
  },
  {
    poNumber: "PO-42",
    purchaseOrderDate: new Date("2026-04-02"),
    raisedBy: "Albert Admin",
    vendor: {
      orgName: "Luna",
      contactPerson: "Luna Lovegood",
      email: "contact@luna-it.com",
      phone: "+91-9988776611",
    },
    shippingAddress: {
      addressLine1: "Suite 404, Tech Park",
      addressLine2: "Gota",
      city: "Ahmedabad",
      state: "Gujarat",
    },
    products: [
      {
        productName: "Samsung Galaxy S24 Ultra",
        requestId: "Req-122",
        requiredQuantity: 8,
        unitCost: 110000,
        cost: 880000,
      },
    ],
    subTotal: 880000,
    tax: 158400,
    netTotal: 1038400,
    status: "Partially Received",
  },
  {
    poNumber: "PO-43",
    purchaseOrderDate: new Date("2026-04-28"),
    raisedBy: "Albert Admin",
    vendor: {
      orgName: "NetApp Inc",
      contactPerson: "Nathan Drake",
      email: "support@netapp.com",
      phone: "+91-8888777766",
    },
    shippingAddress: {
      addressLine1: "Server Room B, Data Center",
      addressLine2: "Prahladnagar",
      city: "Ahmedabad",
      state: "Gujarat",
    },
    products: [
      {
        productName: "NetApp AFF A250 Storage",
        requestId: "Req-123",
        requiredQuantity: 2,
        unitCost: 1200000,
        cost: 2400000,
      },
    ],
    subTotal: 2400000,
    tax: 432000,
    netTotal: 2832000,
    status: "PO Raised",
  },
  {
    poNumber: "PO-44",
    purchaseOrderDate: today,
    raisedBy: "Albert Admin",
    vendor: {
      orgName: "Luna",
      contactPerson: "Luna Lovegood",
      email: "contact@luna-it.com",
      phone: "+91-9988776611",
    },
    shippingAddress: {
      addressLine1: "Suite 404, Tech Park",
      addressLine2: "Gota",
      city: "Ahmedabad",
      state: "Gujarat",
    },
    products: [
      {
        productName: "Logitech MX Master 3S",
        requestId: "Req-124",
        requiredQuantity: 20,
        unitCost: 9000,
        cost: 180000,
      },
    ],
    subTotal: 180000,
    tax: 32400,
    netTotal: 212400,
    status: "PO Raised",
  },
];

const sampleInvoices = [
  {
    invoiceNo: "54",
    invoiceDate: new Date("2026-05-08"),
    products: [
      { brand: "Apple", model: "iPhone", quantity: 1, unit: "1" },
      { brand: "Samsung", model: "Galaxy", quantity: 1, unit: "1" },
      { brand: "Apple", model: "iPhone", quantity: 1, unit: "1" },
    ],
    poNumber: "PO-43",
    purchaseOrderDate: new Date("2026-04-28"),
    procurer: "Albert Admin",
    totalCost: 365998,
  },
  {
    invoiceNo: "123",
    invoiceDate: new Date("2026-04-02"),
    products: [
      { brand: "Dell", model: "Inspiron", quantity: 1, unit: "1" },
      { brand: "Apple", model: "iPhone", quantity: 2, unit: "1" },
    ],
    poNumber: "PO-42",
    purchaseOrderDate: new Date("2026-04-02"),
    procurer: "Albert Admin",
    totalCost: 240000,
  },
  {
    invoiceNo: "IN-001",
    invoiceDate: new Date("2026-03-11"),
    products: [
      { brand: "Dell", model: "Inspiron", quantity: 1, unit: "1" },
      { brand: "Dell", model: "Dell", quantity: 1, unit: "1" },
      { brand: "Apple", model: "iPhone", quantity: 1, unit: "1" },
      { brand: "Samsung", model: "Galaxy", quantity: 1, unit: "1" },
    ],
    poNumber: "PO-40",
    purchaseOrderDate: new Date("2026-02-20"),
    procurer: "Albert Admin",
    totalCost: 532800,
  },
  {
    invoiceNo: "INV-000919",
    invoiceDate: new Date("2026-02-12"),
    products: [
      { brand: "Apple", model: "iPhone", quantity: 2, unit: "2" },
      { brand: "Dell", model: "Inspiron", quantity: 1, unit: "1" },
    ],
    poNumber: "PO-38",
    purchaseOrderDate: new Date("2026-02-12"),
    procurer: "Albert Admin",
    totalCost: 360000,
  },
  {
    invoiceNo: "123123",
    invoiceDate: new Date("2026-01-28"),
    products: [
      { brand: "Samsung", model: "Galaxy", quantity: 1, unit: "1" },
      { brand: "Apple", model: "iPhone", quantity: 2, unit: "2" },
      { brand: "Dell", model: "Inspiron", quantity: 1, unit: "1" },
    ],
    poNumber: "PO-36",
    purchaseOrderDate: new Date("2026-01-28"),
    procurer: "Albert Admin",
    totalCost: 425999,
  },
  {
    invoiceNo: "1256",
    invoiceDate: new Date("2026-01-15"),
    products: [
      { brand: "Apple", model: "iPhone", quantity: 1, unit: "1" },
    ],
    poNumber: "PO-34",
    purchaseOrderDate: new Date("2025-12-09"),
    procurer: "Albert Admin",
    totalCost: 123600,
  },
  {
    invoiceNo: "2345654323",
    invoiceDate: new Date("2025-12-26"),
    products: [
      { brand: "Apple", model: "iPhone", quantity: 1, unit: "1" },
      { brand: "Samsung", model: "Galaxy", quantity: 2, unit: "2" },
    ],
    poNumber: "PO-35",
    purchaseOrderDate: new Date("2025-12-26"),
    procurer: "Albert Admin",
    totalCost: 251998,
  },
  {
    invoiceNo: "123-1",
    invoiceDate: new Date("2025-12-09"),
    products: [
      { brand: "Apple", model: "iPhone", quantity: 2, unit: "1" },
    ],
    poNumber: "PO-34",
    purchaseOrderDate: new Date("2025-12-09"),
    procurer: "Albert Admin",
    totalCost: 122400,
  },
  {
    invoiceNo: "123-4",
    invoiceDate: new Date("2025-11-26"),
    products: [
      { brand: "Samsung", model: "Galaxy", quantity: 1, unit: "1" },
    ],
    poNumber: "PO-33",
    purchaseOrderDate: new Date("2025-11-26"),
    procurer: "Albert Admin",
    totalCost: 65999,
  },
  {
    invoiceNo: "123-2",
    invoiceDate: new Date("2025-11-26"),
    products: [
      { brand: "Samsung", model: "Galaxy", quantity: 2, unit: "1" },
    ],
    poNumber: "PO-33",
    purchaseOrderDate: new Date("2025-11-26"),
    procurer: "Albert Admin",
    totalCost: 65999,
  },
  {
    invoiceNo: "123-3",
    invoiceDate: new Date("2025-11-25"),
    products: [
      { brand: "Samsung", model: "Galaxy", quantity: 3, unit: "2" },
    ],
    poNumber: "PO-33",
    purchaseOrderDate: new Date("2025-11-25"),
    procurer: "Albert Admin",
    totalCost: 731998,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB database.");

    // Update system roles to ensure default access lists
    console.log("Ensuring roles and sidebars are fully up to date...");
    await ensureDefaultRoles();
    console.log("Roles updated in DB.");

    // Clean existing POs
    await PurchaseOrder.deleteMany({});
    console.log("Existing purchase orders removed.");

    // Insert sample POs
    const seededPOs = await PurchaseOrder.insertMany(samplePurchaseOrders);
    console.log(`Seeded ${seededPOs.length} sample purchase orders successfully.`);

    // Clean existing Invoices
    await Invoice.deleteMany({});
    console.log("Existing invoices removed.");

    // Insert sample Invoices
    const seededInvoices = await Invoice.insertMany(sampleInvoices);
    console.log(`Seeded ${seededInvoices.length} sample invoices successfully:`);
    seededInvoices.forEach((inv) => {
      console.log(`- Invoice #${inv.invoiceNo} (Date: ${inv.invoiceDate.toLocaleDateString()}): PO: ${inv.poNumber}, Total Cost: ${inv.totalCost}`);
    });

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

seed();
