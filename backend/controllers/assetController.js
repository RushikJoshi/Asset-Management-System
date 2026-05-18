import Asset from "../models/Asset.js";
import QRCode from "qrcode";
import crypto from "crypto";

const normalizeStatus = (status) => {
  const normalized = String(status || "AVAILABLE").toUpperCase().replace(/\s+/g, "_");
  const statusMap = {
    AVAILABLE: "AVAILABLE",
    ASSIGNED: "ASSIGNED",
    REPAIR: "UNDER_REPAIR",
    UNDER_REPAIR: "UNDER_REPAIR",
    RETURNED: "RETURNED",
    DAMAGED: "DAMAGED",
    LOST: "LOST",
    RETIRED: "RETIRED",
    DISPOSED: "DISPOSED",
    RECYCLED: "RECYCLED",
  };

  return statusMap[normalized] || "AVAILABLE";
};

const normalizeAssetPayload = (payload) => {
  const data = { ...payload };
  const isComputerAsset = ["laptop", "pc", "desktop", "computer"].includes(
    String(data.category || "").trim().toLowerCase(),
  );

  if (!isComputerAsset) {
    [
      "ipAddress",
      "macAddress",
      "hostName",
      "networkType",
      "subnet",
      "gateway",
      "operatingSystem",
      "processor",
      "ram",
      "storage",
      "antivirus",
      "domainName",
    ].forEach((key) => {
      data[key] = undefined;
    });
  }

  if (data.assetStatus) {
    data.assetStatus = normalizeStatus(data.assetStatus);
  }

  ["warrantyPeriod", "maintenancePeriod", "price", "warrantyReminderDays"].forEach(
    (key) => {
      if (data[key] === "" || data[key] === null) data[key] = undefined;
      if (data[key] !== undefined) data[key] = Number(data[key]);
    },
  );

  [
    "purchaseDate",
    "warrantyStart",
    "warrantyEnd",
    "assignedDate",
    "expectedReturn",
    "retirementDate",
    "requestDate",
  ].forEach((key) => {
    if (data[key] === "") data[key] = undefined;
  });

  if (data.purchaseDate && data.warrantyPeriod && !data.warrantyEnd) {
    const warrantyEnd = new Date(data.purchaseDate);
    warrantyEnd.setMonth(warrantyEnd.getMonth() + Number(data.warrantyPeriod));
    data.warrantyStart = data.warrantyStart || data.purchaseDate;
    data.warrantyEnd = warrantyEnd;
  }

  if (data.deviceOwnedBy === "Me") {
    data.ownerName = "";
  }

  return data;
};

const appendTimeline = (asset, title, detail) => {
  asset.lifecycleTimeline.push({
    title,
    detail,
    date: new Date(),
  });
};

const isLocalHost = (host = "") =>
  host.includes("localhost") || host.includes("127.0.0.1") || host.includes("::1");

const getClientUrl = (req) => {
  const origin = req.get("x-client-origin") || req.get("origin");

  if (origin && !isLocalHost(origin)) {
    return origin;
  }

  const requestHost = req.get("host") || "";
  const requestHostname = requestHost.split(":")[0];

  if (requestHostname && !isLocalHost(requestHostname)) {
    const protocol = req.protocol || "http";
    const frontendPort = process.env.CLIENT_PORT || "5173";
    return `${protocol}://${requestHostname}:${frontendPort}`;
  }

  return process.env.CLIENT_URL || origin || "http://localhost:5173";
};

const buildQrUrl = (asset, req) => {
  const clientUrl = getClientUrl(req);
  return `${clientUrl}/scan/${asset._id}?t=${asset.qrToken}`;
};

const generateQrCode = async (asset, req) => {
  const qrUrl = buildQrUrl(asset, req);
  return QRCode.toDataURL(qrUrl, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 300,
  });
};

const getWarrantyDays = (asset) => {
  if (!asset.warrantyEnd) return null;
  return Math.ceil((new Date(asset.warrantyEnd) - new Date()) / 86400000);
};

const getRepairCost = (asset) =>
  asset.repairHistory?.reduce((sum, item) => sum + Number(item.repairCost || 0), 0) || 0;

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const groupCount = (items, key) =>
  items.reduce((acc, item) => {
    const value = item[key] || "Unassigned";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

const groupRepairCost = (items, key) =>
  items.reduce((acc, asset) => {
    const value = asset[key] || "Unassigned";
    acc[value] = (acc[value] || 0) + getRepairCost(asset);
    return acc;
  }, {});

export const getAllAssets = async (req, res) => {
  try {
    const assets = await Asset.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: assets.length,
      assets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const createAsset = async (req, res) => {
  try {
    const data = normalizeAssetPayload(req.body);

    if (
      data.deviceOwnedBy === "Other" &&
      (!data.ownerName || data.ownerName.trim() === "")
    ) {
      return res.status(400).json({
        success: false,
        message: "Owner Name is required",
      });
    }
    data.qrToken = crypto.randomBytes(16).toString("hex");
    data.lifecycleTimeline = [
      {
        title: "Asset Registered",
        detail: `${data.assetName} was registered in inventory.`,
        date: new Date(),
      },
    ];

    if (data.assetStatus === "ASSIGNED" && data.assignedTo) {
      data.lifecycleTimeline.push({
        title: "Asset Assigned",
        detail: `Assigned to ${data.assignedTo}.`,
        date: new Date(data.assignedDate || Date.now()),
      });
    }

    const asset = await Asset.create(data);
    asset.qrCode = await generateQrCode(asset, req);
    await asset.save();
    res.status(201).json({
      success: true,
      asset,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getDashboard = async (req, res) => {
  try {
    const assets = await Asset.find().sort({ createdAt: -1 });
    const warrantyAlerts = assets.filter((asset) => {
      const days = getWarrantyDays(asset);
      return days !== null && days >= 0 && days <= Number(asset.warrantyReminderDays || 10);
    });
    const expiredWarranties = assets.filter((asset) => {
      const days = getWarrantyDays(asset);
      return days !== null && days < 0;
    });
    const repairTickets = assets.flatMap((asset) =>
      (asset.repairHistory || []).map((ticket) => ({
        ...ticket.toObject(),
        assetId: asset._id,
        assetName: asset.assetName,
        assetCode: asset.assetCode,
        officeName: asset.officeName,
      })),
    );
    const auditPending = assets.filter(
      (asset) => !asset.auditLogs?.length || asset.auditLogs[asset.auditLogs.length - 1]?.physicalStatus !== "Verified",
    );

    res.status(200).json({
      success: true,
      stats: {
        totalAssets: assets.length,
        availableAssets: assets.filter((asset) => asset.assetStatus === "AVAILABLE").length,
        assignedAssets: assets.filter((asset) => asset.assetStatus === "ASSIGNED").length,
        underRepairAssets: assets.filter((asset) => asset.assetStatus === "UNDER_REPAIR").length,
        retiredAssets: assets.filter((asset) => ["RETIRED", "DISPOSED", "RECYCLED"].includes(asset.assetStatus)).length,
        warrantyAlerts: warrantyAlerts.length,
        expiredWarranties: expiredWarranties.length,
        openRepairTickets: repairTickets.filter((ticket) => ticket.status !== "COMPLETED").length,
        auditPending: auditPending.length,
        totalRepairCost: assets.reduce((sum, asset) => sum + getRepairCost(asset), 0),
      },
      charts: {
        status: groupCount(assets, "assetStatus"),
        category: groupCount(assets, "category"),
        office: groupCount(assets, "officeName"),
        department: groupCount(assets, "department"),
        repairCostByOffice: groupRepairCost(assets, "officeName"),
        repairCostByVendor: repairTickets.reduce((acc, ticket) => {
          const vendor = ticket.vendorName || "Unassigned";
          acc[vendor] = (acc[vendor] || 0) + Number(ticket.repairCost || 0);
          return acc;
        }, {}),
      },
      recentActivities: assets
        .flatMap((asset) =>
          (asset.lifecycleTimeline || []).map((event) => ({
            ...event.toObject?.() || event,
            assetName: asset.assetName,
            assetCode: asset.assetCode,
          })),
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 12),
      notifications: [
        ...warrantyAlerts.map((asset) => ({
          type: "Warranty Expiry",
          message: `${asset.assetCode || asset.assetName} warranty expires in ${getWarrantyDays(asset)} days`,
          assetId: asset._id,
        })),
        ...auditPending.slice(0, 10).map((asset) => ({
          type: "Audit Pending",
          message: `${asset.assetCode || asset.assetName} needs physical verification`,
          assetId: asset._id,
        })),
      ],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    res.status(200).json(asset);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const updateAsset = async (req, res) => {
  try {
    const data = normalizeAssetPayload(req.body);

    if (
      data.deviceOwnedBy === "Other" &&
      (!data.ownerName || data.ownerName.trim() === "")
    ) {
      return res.status(400).json({
        success: false,
        message: "Owner Name is required",
      });
    }

    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    const previousStatus = asset.assetStatus;
    const previousAssignedTo = asset.assignedTo;
    Object.assign(asset, data);

    if (!asset.qrToken) {
      asset.qrToken = crypto.randomBytes(16).toString("hex");
    }

    if (data.assetStatus && data.assetStatus !== previousStatus) {
      appendTimeline(
        asset,
        `Status Changed To ${data.assetStatus}`,
        `Asset status moved from ${previousStatus || "UNKNOWN"} to ${data.assetStatus}.`,
      );
    }

    if (data.assignedTo && data.assignedTo !== previousAssignedTo) {
      appendTimeline(asset, "Asset Assigned", `Assigned to ${data.assignedTo}.`);
    }

    asset.qrCode = await generateQrCode(asset, req);

    const updatedAsset = await asset.save();

    res.status(200).json({
      success: true,
      message: "Asset updated successfully",
      asset: updatedAsset,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const createWorkflowEvent = async (req, res) => {
  try {
    const { workflow } = req.params;
    const data = normalizeAssetPayload(req.body);
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    if (workflow === "repair") {
      asset.repairHistory.push(data);
      asset.assetStatus = data.status === "COMPLETED" ? "AVAILABLE" : "UNDER_REPAIR";
      appendTimeline(asset, `Repair ${data.status || "OPEN"}`, `${data.issue || "Issue"} recorded.`);
    } else if (workflow === "transfer") {
      asset.transferHistory.push(data);
      if (data.toEmployee) asset.assignedTo = data.toEmployee;
      if (data.toOffice) asset.officeName = data.toOffice;
      if (data.transferType === "Return Asset") asset.assetStatus = data.physicalStatus || "RETURNED";
      appendTimeline(asset, data.transferType || "Asset Transfer", `Moved to ${data.toEmployee || data.toOffice || "inventory"}.`);
    } else if (workflow === "audit") {
      asset.auditLogs.push(data);
      appendTimeline(asset, "Audit Verification", `${data.physicalStatus || "Verified"} by ${data.verifiedBy || "Auditor"}.`);
    } else if (workflow === "retire") {
      asset.assetStatus = data.retirementStatus || "RETIRED";
      asset.retirementStatus = data.retirementStatus || "RETIRED";
      asset.retirementApproval = data.retirementApproval || asset.retirementApproval;
      asset.disposalMethod = data.disposalMethod || asset.disposalMethod;
      asset.retirementDate = data.retirementDate || new Date();
      appendTimeline(asset, "Asset Retirement", `${asset.assetStatus} through ${asset.disposalMethod || "standard disposal"}.`);
    } else {
      return res.status(400).json({
        success: false,
        message: "Unsupported workflow",
      });
    }

    const updatedAsset = await asset.save();

    res.status(200).json({
      success: true,
      asset: updatedAsset,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getReports = async (req, res) => {
  try {
    const assets = await Asset.find().sort({ createdAt: -1 });
    const repairTickets = assets.flatMap((asset) =>
      (asset.repairHistory || []).map((ticket) => ({
        ...ticket.toObject(),
        assetName: asset.assetName,
        assetCode: asset.assetCode,
        officeName: asset.officeName,
      })),
    );

    res.status(200).json({
      success: true,
      assetReports: {
        totalAssets: assets.length,
        availableAssets: assets.filter((asset) => asset.assetStatus === "AVAILABLE"),
        assignedAssets: assets.filter((asset) => asset.assetStatus === "ASSIGNED"),
        categoryWiseAssets: groupCount(assets, "category"),
        officeWiseAssets: groupCount(assets, "officeName"),
      },
      repairReports: {
        monthlyRepairCost: repairTickets.reduce((acc, ticket) => {
          const month = ticket.repairDate
            ? new Date(ticket.repairDate).toLocaleString("en-US", { month: "short", year: "numeric" })
            : "Unscheduled";
          acc[month] = (acc[month] || 0) + Number(ticket.repairCost || 0);
          return acc;
        }, {}),
        mostRepairedAssets: assets
          .map((asset) => ({
            assetId: asset._id,
            assetName: asset.assetName,
            assetCode: asset.assetCode,
            repairs: asset.repairHistory?.length || 0,
            cost: getRepairCost(asset),
          }))
          .sort((a, b) => b.repairs - a.repairs),
        vendorWiseRepairs: repairTickets.reduce((acc, ticket) => {
          const vendor = ticket.vendorName || "Unassigned";
          acc[vendor] = (acc[vendor] || 0) + Number(ticket.repairCost || 0);
          return acc;
        }, {}),
      },
      warrantyReports: {
        expiringWarranties: assets.filter((asset) => {
          const days = getWarrantyDays(asset);
          return days !== null && days >= 0 && days <= Number(asset.warrantyReminderDays || 10);
        }),
        expiredWarranties: assets.filter((asset) => {
          const days = getWarrantyDays(asset);
          return days !== null && days < 0;
        }),
      },
      officeReports: {
        officeWiseAssetCount: groupCount(assets, "officeName"),
        officeWiseRepairCost: groupRepairCost(assets, "officeName"),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getScanAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset || asset.qrToken !== req.query.t) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired QR code",
      });
    }

    res.status(200).json(asset);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const refreshQrCodes = async (req, res) => {
  try {
    const assets = await Asset.find();

    await Promise.all(
      assets.map(async (asset) => {
        if (!asset.qrToken) {
          asset.qrToken = crypto.randomBytes(16).toString("hex");
        }

        asset.assetStatus = normalizeStatus(asset.assetStatus);
        asset.qrCode = await generateQrCode(asset, req);
        await asset.save();
      }),
    );

    res.status(200).json({
      success: true,
      message: "QR codes refreshed for current network",
      clientUrl: getClientUrl(req),
      count: assets.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const seedWorkflowDemoData = async (req, res) => {
  try {
    const today = new Date();
    const demoAssets = [
      {
        assetName: "Demo Dell Latitude - Warranty Expiring",
        category: "Laptop",
        subCategory: "Business Laptop",
        assetStatus: "ASSIGNED",
        assignedTo: "Rahul Sharma",
        assignedBy: "IT Admin",
        assignedDate: addDays(today, -35),
        serialNumber: "DEMO-DLL-1001",
        assetCode: "DEMO-WAR-001",
        brand: "Dell",
        model: "Latitude 5440",
        purchaseDate: addDays(today, -355),
        vendor: "Dell India",
        location: "Ahmedabad",
        assetType: "Laptop",
        warrantyPeriod: 12,
        maintenancePeriod: 3,
        price: 65000,
        invoiceNumber: "DEMO-INV-1001",
        warrantyStart: addDays(today, -355),
        warrantyEnd: addDays(today, 7),
        warrantyReminderDays: 15,
        officeName: "GT Ahmedabad",
        branchCode: "AMD001",
        floor: "3rd Floor",
        department: "HR",
        room: "Cabin 302",
        city: "Ahmedabad",
        state: "Gujarat",
        officeContactPerson: "Rahul",
        officePhone: "9876543210",
        assetDescription: "Demo asset for warranty-expiry testing.",
        deviceOwnedBy: "Me",
        repairHistory: [
          {
            ticketId: "DEMO-TKT-101",
            issue: "Keyboard Issue",
            priority: "High",
            description: "Keys not working properly.",
            repairDate: addDays(today, -18),
            returnDate: addDays(today, -16),
            repairCost: 2500,
            repairDetails: "Keyboard replaced",
            vendorName: "Dell Service Center",
            invoiceNumber: "DEMO-REP-220",
            status: "COMPLETED",
            updatedBy: "IT Admin",
          },
        ],
      },
      {
        assetName: "Demo HP Monitor - Under Repair",
        category: "Monitor",
        subCategory: "LED Monitor",
        assetStatus: "UNDER_REPAIR",
        assignedTo: "Amit Patel",
        assignedBy: "IT Admin",
        assignedDate: addDays(today, -70),
        serialNumber: "DEMO-HP-2002",
        assetCode: "DEMO-REP-002",
        brand: "HP",
        model: "E24 G5",
        purchaseDate: addDays(today, -620),
        vendor: "HP India",
        location: "Mumbai",
        assetType: "Monitor",
        warrantyPeriod: 24,
        maintenancePeriod: 6,
        price: 18000,
        invoiceNumber: "DEMO-INV-2002",
        warrantyStart: addDays(today, -620),
        warrantyEnd: addDays(today, 110),
        warrantyReminderDays: 30,
        officeName: "GT Mumbai",
        branchCode: "MUM001",
        floor: "2nd Floor",
        department: "Finance",
        room: "Bay 204",
        city: "Mumbai",
        state: "Maharashtra",
        officeContactPerson: "Amit",
        officePhone: "9123456780",
        assetDescription: "Demo asset for open repair ticket testing.",
        deviceOwnedBy: "Me",
        repairHistory: [
          {
            ticketId: "DEMO-TKT-202",
            issue: "Screen Flickering",
            priority: "Medium",
            description: "Display flickers every few minutes.",
            repairDate: today,
            repairCost: 0,
            repairDetails: "Sent to vendor for diagnosis",
            vendorName: "HP Service",
            invoiceNumber: "",
            status: "UNDER_REPAIR",
            updatedBy: "IT Staff",
          },
        ],
      },
      {
        assetName: "Demo Canon Printer - Warranty Expired",
        category: "Printer",
        subCategory: "Laser Printer",
        assetStatus: "AVAILABLE",
        serialNumber: "DEMO-CAN-3003",
        assetCode: "DEMO-EXP-003",
        brand: "Canon",
        model: "LBP 2900",
        purchaseDate: addDays(today, -900),
        vendor: "Canon Partner",
        location: "Ahmedabad",
        assetType: "Printer",
        warrantyPeriod: 12,
        maintenancePeriod: 2,
        price: 12000,
        invoiceNumber: "DEMO-INV-3003",
        warrantyStart: addDays(today, -900),
        warrantyEnd: addDays(today, -535),
        warrantyReminderDays: 10,
        officeName: "GT Ahmedabad",
        branchCode: "AMD001",
        floor: "1st Floor",
        department: "Admin",
        room: "Store",
        city: "Ahmedabad",
        state: "Gujarat",
        officeContactPerson: "Admin Desk",
        officePhone: "9988776655",
        assetDescription: "Demo asset for expired warranty and maintenance due testing.",
        deviceOwnedBy: "Me",
        repairHistory: [],
      },
    ];

    const savedAssets = [];

    for (const demoAsset of demoAssets) {
      const existingAsset = await Asset.findOne({ assetCode: demoAsset.assetCode });
      const timeline = [
        {
          title: "Demo Data Loaded",
          detail: "Warranty and maintenance demo record prepared.",
          date: today,
        },
      ];

      let asset;
      if (existingAsset) {
        Object.assign(existingAsset, demoAsset, {
          assetStatus: normalizeStatus(demoAsset.assetStatus),
          lifecycleTimeline: [...(existingAsset.lifecycleTimeline || []), ...timeline],
        });
        asset = existingAsset;
      } else {
        asset = new Asset({
          ...demoAsset,
          assetStatus: normalizeStatus(demoAsset.assetStatus),
          qrToken: crypto.randomBytes(16).toString("hex"),
          lifecycleTimeline: timeline,
        });
      }

      if (!asset.qrToken) {
        asset.qrToken = crypto.randomBytes(16).toString("hex");
      }

      asset.qrCode = await generateQrCode(asset, req);
      savedAssets.push(await asset.save());
    }

    res.status(200).json({
      success: true,
      message: "Demo warranty and maintenance data loaded",
      count: savedAssets.length,
      assets: savedAssets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const deleteAsset = async (req, res) => {
  try {
    const deletedAsset = await Asset.findByIdAndDelete(req.params.id);

    if (!deletedAsset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Asset deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
