import moment from "moment";

export const statusOptions = [
  "AVAILABLE",
  "ASSIGNED",
  "UNDER_REPAIR",
  "RETURNED",
  "DAMAGED",
  "LOST",
  "RETIRED",
  "DISPOSED",
  "RECYCLED",
];

export const currency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

export const dateText = (value) => (value ? moment(value).format("DD-MM-YYYY") : "-");

export const warrantyDays = (asset) => {
  if (!asset.warrantyEnd) return null;
  return Math.ceil((new Date(asset.warrantyEnd) - new Date()) / 86400000);
};

export const repairCost = (asset) =>
  asset.repairHistory?.reduce((sum, item) => sum + Number(item.repairCost || 0), 0) || 0;

export const groupByCount = (items, key) =>
  items.reduce((acc, item) => {
    const value = item[key] || "Unassigned";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

export const exportRowsToCsv = (fileName, headers, rows) => {
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export const assetImportHeaders = [
  "Asset Name",
  "Category",
  "Sub Category",
  "Asset Status",
  "Assigned To",
  "Serial Number",
  "Asset Code",
  "Brand",
  "Model",
  "Asset Type",
  "Purchase Date",
  "Vendor",
  "Invoice Number",
  "Purchase Cost",
  "Warranty Period",
  "Warranty Start",
  "Warranty End",
  "Warranty Reminder Days",
  "Maintenance Period",
  "Office Name",
  "Branch Code",
  "Floor",
  "Department",
  "Room",
  "City",
  "State",
  "Office Contact Person",
  "Office Phone",
  "Assigned Date",
  "Assigned By",
  "Device Owned By",
  "Owner Name",
  "Description",
];

export const assetImportSampleRows = [
  [
    "Lenovo ThinkPad E14",
    "Laptop",
    "Business Laptop",
    "ASSIGNED",
    "Ravi Patel",
    "LEN-TP-001",
    "AST-1001",
    "Lenovo",
    "ThinkPad E14",
    "Laptop",
    "2026-05-10",
    "Lenovo India",
    "INV-1001",
    "55000",
    "36",
    "2026-05-10",
    "2029-05-10",
    "30",
    "6",
    "GT Ahmedabad",
    "AMD001",
    "3rd Floor",
    "IT",
    "Cabin 301",
    "Ahmedabad",
    "Gujarat",
    "Rahul",
    "9876543210",
    "2026-05-12",
    "Admin",
    "Me",
    "",
    "Imported sample laptop",
  ],
  [
    "HP Monitor 24 inch",
    "Monitor",
    "Display",
    "AVAILABLE",
    "",
    "HP-MON-002",
    "AST-1002",
    "HP",
    "E24",
    "Monitor",
    "2026-05-11",
    "HP India",
    "INV-1002",
    "15000",
    "24",
    "2026-05-11",
    "2028-05-11",
    "30",
    "6",
    "GT Mumbai",
    "MUM001",
    "2nd Floor",
    "Finance",
    "Bay 204",
    "Mumbai",
    "Maharashtra",
    "Amit",
    "9123456780",
    "",
    "Admin",
    "Me",
    "",
    "Imported sample monitor",
  ],
];

const assetImportColumnMap = {
  "asset name": "assetName",
  category: "category",
  "sub category": "subCategory",
  "asset status": "assetStatus",
  "assigned to": "assignedTo",
  "serial number": "serialNumber",
  "asset code": "assetCode",
  brand: "brand",
  model: "model",
  "asset type": "assetType",
  "purchase date": "purchaseDate",
  vendor: "vendor",
  "invoice number": "invoiceNumber",
  "purchase cost": "price",
  price: "price",
  "warranty period": "warrantyPeriod",
  "warranty start": "warrantyStart",
  "warranty end": "warrantyEnd",
  "warranty reminder days": "warrantyReminderDays",
  "maintenance period": "maintenancePeriod",
  "office name": "officeName",
  "branch code": "branchCode",
  floor: "floor",
  department: "department",
  room: "room",
  "room/cabin": "room",
  city: "city",
  state: "state",
  "office contact person": "officeContactPerson",
  "office phone": "officePhone",
  "assigned date": "assignedDate",
  "assigned by": "assignedBy",
  "device owned by": "deviceOwnedBy",
  "owner name": "ownerName",
  description: "assetDescription",
  "asset description": "assetDescription",
};

const normalizeHeader = (value) => String(value || "").trim().toLowerCase();

const parseCsvLine = (line) => {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

export const parseCsvText = (csvText) => {
  const lines = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error("CSV file must include a header row and at least one asset row.");
  }

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line, rowIndex) => {
    const values = parseCsvLine(line);
    const row = {};

    headers.forEach((header, index) => {
      const fieldName = assetImportColumnMap[normalizeHeader(header)];

      if (fieldName) {
        row[fieldName] = values[index] || "";
      }
    });

    if (!row.assetName || !row.category) {
      throw new Error(`Row ${rowIndex + 2}: Asset Name and Category are required.`);
    }

    const numericFields = ["warrantyPeriod", "maintenancePeriod", "price", "warrantyReminderDays"];
    numericFields.forEach((field) => {
      row[field] = Number(row[field] || 0);
    });

    row.assetStatus = row.assetStatus || "AVAILABLE";
    row.deviceOwnedBy = row.deviceOwnedBy || "Me";
    row.warrantyReminderDays = row.warrantyReminderDays || 10;

    if (row.deviceOwnedBy === "Me") {
      delete row.ownerName;
    }

    return row;
  });
};

export const buildStats = (assets) => ({
  total: assets.length,
  available: assets.filter((asset) => asset.assetStatus === "AVAILABLE").length,
  assigned: assets.filter((asset) => asset.assetStatus === "ASSIGNED").length,
  repair: assets.filter((asset) => asset.assetStatus === "UNDER_REPAIR").length,
  warranty: assets.filter((asset) => {
    const days = warrantyDays(asset);
    return days !== null && days >= 0 && days <= Number(asset.warrantyReminderDays || 10);
  }).length,
  auditPending: assets.filter((asset) => !asset.auditLogs?.length).length,
  repairCost: assets.reduce((sum, asset) => sum + repairCost(asset), 0),
});
