// import mongoose from "mongoose";

// const assetSchema = new mongoose.Schema({
//   assetName: String,
//   modelNo: String,
//   receivedThrough: String,
//   assignedTo: String,
//   assignedDate: Date,
//   companyName: String,
//   branchName: String,
//   qrCode: String,
// });

// export default mongoose.model("Asset", assetSchema);

import mongoose from "mongoose";

const lifecycleEventSchema = new mongoose.Schema(
  {
    title: String,
    detail: String,
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const repairHistorySchema = new mongoose.Schema(
  {
    ticketId: String,
    issue: String,
    priority: String,
    description: String,
    repairDate: Date,
    returnDate: Date,
    repairCost: Number,
    repairDetails: String,
    vendorName: String,
    invoiceNumber: String,
    status: {
      type: String,
      default: "OPEN",
    },
    updatedBy: String,
  },
  { timestamps: true },
);

const transferHistorySchema = new mongoose.Schema(
  {
    transferType: String,
    fromEmployee: String,
    toEmployee: String,
    fromOffice: String,
    toOffice: String,
    approvalStatus: {
      type: String,
      default: "Pending",
    },
    dispatchDate: Date,
    receivedDate: Date,
    notes: String,
  },
  { timestamps: true },
);

const auditLogSchema = new mongoose.Schema(
  {
    auditDate: {
      type: Date,
      default: Date.now,
    },
    verifiedBy: String,
    physicalStatus: String,
    locationVerified: String,
    notes: String,
  },
  { timestamps: true },
);

const assetSchema = new mongoose.Schema(
  {
    // Asset Information
    assetName: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    subCategory: {
      type: String,
    },

    assetStatus: {
      type: String,
      required: true,
      enum: [
        "AVAILABLE",
        "ASSIGNED",
        "UNDER_REPAIR",
        "RETURNED",
        "DAMAGED",
        "LOST",
        "RETIRED",
        "DISPOSED",
        "RECYCLED",
      ],
      default: "AVAILABLE",
    },

    assignedTo: {
      type: String,
    },

    serialNumber: {
      type: String,
    },

    assetCode: {
      type: String,
    },

    brand: {
      type: String,
    },

    model: {
      type: String,
    },

    // Network/IP configuration for computer-style assets
    ipAddress: String,
    macAddress: String,
    hostName: String,
    networkType: String,
    subnet: String,
    gateway: String,

    // Computer specifications for laptop/PC categories
    operatingSystem: String,
    processor: String,
    ram: String,
    storage: String,
    antivirus: String,
    domainName: String,

    // Identification & Purchase Details
    purchaseDate: {
      type: Date,
    },

    vendor: {
      type: String,
    },

    location: {
      type: String,
    },

    assetType: {
      type: String,
    },

    warrantyPeriod: {
      type: Number,
    },

    maintenancePeriod: {
      type: Number,
    },

    price: {
      type: Number,
    },

    invoiceNumber: {
      type: String,
    },

    warrantyStart: {
      type: Date,
    },

    warrantyEnd: {
      type: Date,
    },

    warrantyReminderDays: {
      type: Number,
      default: 10,
    },

    purchaseStatus: {
      type: String,
      default: "Purchased",
    },

    // Office / Branch Management
    officeName: String,
    branchCode: String,
    floor: String,
    department: String,
    room: String,
    city: String,
    state: String,
    officeContactPerson: String,
    officePhone: String,

    // Asset Request / Assignment
    requestId: String,
    requestType: String,
    requestDate: Date,
    requestedBy: String,
    requestPriority: String,
    requestReason: String,
    requestStatus: {
      type: String,
      default: "Pending",
    },
    managerApproval: {
      type: String,
      default: "Pending",
    },
    adminApproval: {
      type: String,
      default: "Pending",
    },
    assignedDate: Date,
    employeeId: String,
    employeeEmail: String,
    expectedReturn: Date,
    assignedBy: String,

    // Lifecycle workflows
    repairHistory: [repairHistorySchema],
    transferHistory: [transferHistorySchema],
    auditLogs: [auditLogSchema],
    lifecycleTimeline: [lifecycleEventSchema],
    retirementStatus: String,
    retirementApproval: String,
    disposalMethod: String,
    retirementDate: Date,
    notifications: [String],

    // Ownership & Documentation
    assetDescription: {
      type: String,
    },

    // Radio Button
    deviceOwnedBy: {
      type: String,
      enum: ["Me", "Other"],
      default: "Me",
    },

    ownerName: {
      type: String,
      default: "",
    },

    // QR Code
    qrCode: {
      type: String,
    },

    qrToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Asset", assetSchema);
