const STORAGE_KEY = "assetFormBuilderConfig";

export const assetFormSections = [
  {
    title: "Asset Information",
    description: "Capture asset identity, QR, and status details.",
    fields: [
      { name: "assetName", label: "Asset Name", required: true, locked: true },
      { name: "category", label: "Category", required: true, locked: true },
      { name: "subCategory", label: "Sub Category" },
      { name: "assetStatus", label: "Asset Status", required: true, locked: true },
      { name: "assignedTo", label: "Assigned To" },
      { name: "serialNumber", label: "Serial Number" },
      { name: "assetCode", label: "Asset Code" },
      { name: "brand", label: "Brand" },
      { name: "model", label: "Model" },
      { name: "assetType", label: "Asset Type" },
    ],
  },
  {
    title: "IP Configuration",
    description: "Visible only for Laptop, PC, Desktop, or Computer assets.",
    fields: [
      { name: "ipAddress", label: "IP Address" },
      { name: "macAddress", label: "MAC Address" },
      { name: "hostName", label: "Host / Device Name" },
      { name: "networkType", label: "Network Type" },
      { name: "subnet", label: "Subnet" },
      { name: "gateway", label: "Gateway" },
    ],
  },
  {
    title: "Computer Specifications",
    description: "Hardware and software details for computer-style assets.",
    fields: [
      { name: "operatingSystem", label: "Operating System" },
      { name: "processor", label: "Processor" },
      { name: "ram", label: "RAM" },
      { name: "storage", label: "Storage" },
      { name: "antivirus", label: "Antivirus" },
      { name: "domainName", label: "Domain" },
    ],
  },
  {
    title: "Request & Purchase Details",
    description: "Track request approvals, vendor purchase, and invoice data.",
    fields: [
      { name: "requestId", label: "Request ID" },
      { name: "requestedBy", label: "Requested By" },
      { name: "requestPriority", label: "Priority" },
      { name: "requestReason", label: "Reason" },
      { name: "requestStatus", label: "Request Status" },
      { name: "managerApproval", label: "Manager Approval" },
      { name: "adminApproval", label: "IT/Admin Approval" },
      { name: "purchaseDate", label: "Purchase Date" },
      { name: "vendor", label: "Vendor" },
      { name: "invoiceNumber", label: "Invoice Number" },
      { name: "price", label: "Purchase Cost" },
      { name: "purchaseStatus", label: "Purchase Status" },
    ],
  },
  {
    title: "Warranty, Office & Assignment",
    description: "Manage reminders, branch placement, and employee assignment.",
    fields: [
      { name: "warrantyPeriod", label: "Warranty Period (Months)" },
      { name: "warrantyStart", label: "Warranty Start" },
      { name: "warrantyEnd", label: "Warranty End" },
      { name: "warrantyReminderDays", label: "Reminder Days" },
      { name: "maintenancePeriod", label: "Maintenance Period (Months)" },
      { name: "officeName", label: "Office Name" },
      { name: "branchCode", label: "Branch Code" },
      { name: "floor", label: "Floor" },
      { name: "department", label: "Department" },
      { name: "room", label: "Room/Cabin" },
      { name: "city", label: "City" },
      { name: "state", label: "State" },
      { name: "officeContactPerson", label: "Office Contact Person" },
      { name: "officePhone", label: "Office Phone" },
      { name: "assignedDate", label: "Assigned Date" },
      { name: "employeeId", label: "Employee ID" },
      { name: "employeeEmail", label: "Employee Email" },
      { name: "expectedReturn", label: "Expected Return" },
      { name: "assignedBy", label: "Assigned By" },
    ],
  },
  {
    title: "Retirement & Documentation",
    description: "Record retirement, disposal, ownership, and supporting notes.",
    fields: [
      { name: "retirementStatus", label: "Retirement Status" },
      { name: "retirementApproval", label: "Retirement Approval" },
      { name: "disposalMethod", label: "Disposal Method" },
      { name: "retirementDate", label: "Retirement Date" },
      { name: "assetDescription", label: "Asset Description" },
      { name: "deviceOwnedBy", label: "Device Owned By", required: true, locked: true },
      { name: "ownerName", label: "Owner Name" },
    ],
  },
];

const defaultConfig = assetFormSections.reduce((acc, section) => {
  section.fields.forEach((field) => {
    acc[field.name] = {
      visible: true,
      required: Boolean(field.required),
      locked: Boolean(field.locked),
    };
  });
  return acc;
}, {});

const applyFieldLabels = (fields, labels = {}) =>
  fields.map((field) => ({
    ...field,
    label: labels[field.name] || field.label,
  }));

const applyOrder = (items, order = [], getKey = (item) => item.key) => {
  if (!Array.isArray(order) || !order.length) return items;

  const orderMap = new Map(order.map((key, index) => [key, index]));

  return [...items].sort((a, b) => {
    const aIndex = orderMap.has(getKey(a)) ? orderMap.get(getKey(a)) : Number.MAX_SAFE_INTEGER;
    const bIndex = orderMap.has(getKey(b)) ? orderMap.get(getKey(b)) : Number.MAX_SAFE_INTEGER;

    if (aIndex === bIndex) return 0;
    return aIndex - bIndex;
  });
};

export const getAssetFormSections = (config = {}) => {
  const customFields = config.__customFields || [];
  const labels = config.__fieldLabels || {};
  const sectionLabels = config.__sectionLabels || {};
  const sectionDescriptions = config.__sectionDescriptions || {};
  const customSections = config.__customSections || [];
  const deletedFields = new Set(config.__deletedFields || []);
  const fieldSections = config.__fieldSections || {};
  const fieldOrder = config.__fieldOrder || {};
  const baseSections = assetFormSections.map((section) => ({
    key: section.title,
    ...section,
    title: sectionLabels[section.title] || section.title,
    description: sectionDescriptions[section.title] || section.description,
    fields: [],
  }));

  const sectionMap = baseSections.reduce((acc, section) => {
    acc[section.key] = {
      ...section,
      fields: [],
    };
    return acc;
  }, {});

  customSections.forEach((section) => {
    const sectionKey = section.key || section.title;
    if (!sectionMap[sectionKey]) {
      sectionMap[sectionKey] = {
        key: sectionKey,
        title: sectionLabels[sectionKey] || section.title,
        description: sectionDescriptions[sectionKey] || section.description || "",
        fields: [],
      };
    }
  });

  const ensureSection = (sectionKey, fallbackTitle = sectionKey, fallbackDescription = "") => {
    if (!sectionMap[sectionKey]) {
      sectionMap[sectionKey] = {
        key: sectionKey,
        title: sectionLabels[sectionKey] || fallbackTitle,
        description: sectionDescriptions[sectionKey] || fallbackDescription,
        fields: [],
      };
    }

    return sectionMap[sectionKey];
  };

  assetFormSections.forEach((section) => {
    applyFieldLabels(
      section.fields.filter((field) => !deletedFields.has(field.name)),
      labels,
    ).forEach((field) => {
      const sectionKey = fieldSections[field.name] || section.title;
      ensureSection(sectionKey, sectionKey).fields.push(field);
    });
  });

  customFields.forEach((field) => {
    const sectionKey = fieldSections[field.name] || field.sectionKey || field.sectionTitle || "Custom Fields";
    ensureSection(sectionKey, field.sectionTitle || sectionKey, field.sectionDescription || "").fields.push({
      ...field,
      label: labels[field.name] || field.label,
    });
  });

  Object.values(sectionMap).forEach((section) => {
    section.fields = applyOrder(section.fields, fieldOrder[section.key], (field) => field.name);
  });

  const defaultSectionOrder = [
    ...baseSections.map((section) => section.key),
    ...customSections.map((section) => section.key || section.title),
  ];

  return applyOrder(Object.values(sectionMap), config.__sectionOrder || defaultSectionOrder);
};

export const getDefaultAssetFormConfig = () => defaultConfig;

export const loadAssetFormConfig = () => {
  if (typeof window === "undefined") return defaultConfig;

  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    const config = Object.keys(defaultConfig).reduce((acc, name) => {
      acc[name] = { ...defaultConfig[name], ...(saved[name] || {}) };
      return acc;
    }, {});
    config.__customFields = Array.isArray(saved.__customFields) ? saved.__customFields : [];
    config.__fieldLabels = saved.__fieldLabels || {};
    config.__sectionLabels = saved.__sectionLabels || {};
    config.__sectionDescriptions = saved.__sectionDescriptions || {};
    config.__customSections = Array.isArray(saved.__customSections) ? saved.__customSections : [];
    config.__deletedFields = Array.isArray(saved.__deletedFields) ? saved.__deletedFields : [];
    config.__sectionOrder = Array.isArray(saved.__sectionOrder) ? saved.__sectionOrder : [];
    config.__fieldOrder = saved.__fieldOrder || {};
    config.__fieldSections = saved.__fieldSections || {};
    config.__customFields.forEach((field) => {
      config[field.name] = {
        visible: true,
        required: false,
        ...(saved[field.name] || {}),
      };
    });
    return config;
  } catch {
    return defaultConfig;
  }
};

export const saveAssetFormConfig = (config) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event("asset-form-builder-updated"));
};

export const resetAssetFormConfig = () => {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("asset-form-builder-updated"));
};
