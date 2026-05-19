export const FORM_TYPES = {
  ASSET: "asset",
  REQUEST: "request",
};

const STORAGE_KEYS = {
  [FORM_TYPES.ASSET]: "assetFormBuilderConfig",
  [FORM_TYPES.REQUEST]: "requestFormBuilderConfig",
};

const ASSET_EXCLUDED_SECTION_KEYS = new Set(["Request & Purchase Details"]);

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
    title: "Purchase & Invoice",
    description: "Recorded purchase details for inventory assets.",
    fields: [
      { name: "purchaseDate", label: "Purchase Date" },
      { name: "vendor", label: "Vendor" },
      { name: "invoiceNumber", label: "Invoice Number" },
      { name: "price", label: "Purchase Cost" },
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

export const requestFormSections = [
  {
    title: "Request Details",
    description: "Employee and procurement request information.",
    fields: [
      { name: "requestId", label: "Request ID" },
      { name: "requestType", label: "Request Type", required: true, locked: true },
      { name: "requestDate", label: "Request Date", required: true },
      { name: "requestedBy", label: "Requested By", required: true },
      { name: "employeeId", label: "Employee ID" },
      { name: "employeeEmail", label: "Employee Email" },
      { name: "department", label: "Department" },
      { name: "officeName", label: "Office Name" },
      { name: "requestPriority", label: "Priority" },
      { name: "requestReason", label: "Reason / Notes" },
    ],
  },
  {
    title: "Requested Asset",
    description: "Asset details needed before approval and purchase.",
    fields: [
      { name: "assetName", label: "Requested Asset Name", required: true, locked: true },
      { name: "category", label: "Category", required: true, locked: true },
      { name: "subCategory", label: "Sub Category" },
      { name: "brand", label: "Brand" },
      { name: "model", label: "Model" },
      { name: "vendor", label: "Preferred Vendor" },
      { name: "price", label: "Estimated Cost" },
    ],
  },
  {
    title: "Approval & Purchase",
    description: "Manager, IT/admin approval, and purchase tracking.",
    fields: [
      { name: "requestStatus", label: "Request Status", required: true },
      { name: "managerApproval", label: "Manager Approval" },
      { name: "adminApproval", label: "IT/Admin Approval" },
      { name: "purchaseStatus", label: "Purchase Status" },
      { name: "expectedReturn", label: "Expected Return" },
    ],
  },
];

const FORM_SECTIONS = {
  [FORM_TYPES.ASSET]: assetFormSections,
  [FORM_TYPES.REQUEST]: requestFormSections,
};

const buildDefaultConfig = (sections) =>
  sections.reduce((acc, section) => {
    section.fields.forEach((field) => {
      acc[field.name] = {
        visible: true,
        required: Boolean(field.required),
        locked: Boolean(field.locked),
      };
    });
    return acc;
  }, {});

const defaultAssetConfig = buildDefaultConfig(assetFormSections);
const defaultRequestConfig = buildDefaultConfig(requestFormSections);

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

const buildFormSections = (formType, config = {}) => {
  const sectionDefinitions = FORM_SECTIONS[formType] || assetFormSections;
  const customFields = config.__customFields || [];
  const labels = config.__fieldLabels || {};
  const sectionLabels = config.__sectionLabels || {};
  const sectionDescriptions = config.__sectionDescriptions || {};
  const customSections = config.__customSections || [];
  const deletedFields = new Set(config.__deletedFields || []);
  const fieldSections = config.__fieldSections || {};
  const fieldOrder = config.__fieldOrder || {};

  const baseSections = sectionDefinitions.map((section) => ({
    key: section.title,
    ...section,
    title: sectionLabels[section.title] || section.title,
    description: sectionDescriptions[section.title] || section.description,
    fields: [],
  }));

  const sectionMap = baseSections.reduce((acc, section) => {
    acc[section.key] = { ...section, fields: [] };
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

  sectionDefinitions.forEach((section) => {
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

  let sections = applyOrder(Object.values(sectionMap), config.__sectionOrder || defaultSectionOrder);

  if (formType === FORM_TYPES.ASSET) {
    sections = sections.filter((section) => !ASSET_EXCLUDED_SECTION_KEYS.has(section.key));
  }

  return sections;
};

export const getAssetFormSections = (config = {}) => buildFormSections(FORM_TYPES.ASSET, config);

export const getRequestFormSections = (config = {}) => buildFormSections(FORM_TYPES.REQUEST, config);

export const getDefaultAssetFormConfig = () => ({ ...defaultAssetConfig });

export const getDefaultRequestFormConfig = () => ({ ...defaultRequestConfig });

const loadConfigForType = (formType) => {
  const defaultConfig =
    formType === FORM_TYPES.REQUEST ? defaultRequestConfig : defaultAssetConfig;

  if (typeof window === "undefined") return { ...defaultConfig };

  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEYS[formType]) || "{}");
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
    return { ...defaultConfig };
  }
};

export const loadAssetFormConfig = () => loadConfigForType(FORM_TYPES.ASSET);

export const loadRequestFormConfig = () => loadConfigForType(FORM_TYPES.REQUEST);

export const saveAssetFormConfig = (config) => {
  window.localStorage.setItem(STORAGE_KEYS[FORM_TYPES.ASSET], JSON.stringify(config));
  window.dispatchEvent(new CustomEvent("form-builder-updated", { detail: { formType: FORM_TYPES.ASSET } }));
};

export const saveRequestFormConfig = (config) => {
  window.localStorage.setItem(STORAGE_KEYS[FORM_TYPES.REQUEST], JSON.stringify(config));
  window.dispatchEvent(new CustomEvent("form-builder-updated", { detail: { formType: FORM_TYPES.REQUEST } }));
};

export const resetAssetFormConfig = () => {
  window.localStorage.removeItem(STORAGE_KEYS[FORM_TYPES.ASSET]);
  window.dispatchEvent(new CustomEvent("form-builder-updated", { detail: { formType: FORM_TYPES.ASSET } }));
};

export const resetRequestFormConfig = () => {
  window.localStorage.removeItem(STORAGE_KEYS[FORM_TYPES.REQUEST]);
  window.dispatchEvent(new CustomEvent("form-builder-updated", { detail: { formType: FORM_TYPES.REQUEST } }));
};

export const saveFormConfig = (formType, config) => {
  if (formType === FORM_TYPES.REQUEST) return saveRequestFormConfig(config);
  return saveAssetFormConfig(config);
};

export const loadFormConfig = (formType) => {
  if (formType === FORM_TYPES.REQUEST) return loadRequestFormConfig();
  return loadAssetFormConfig();
};

export const resetFormConfig = (formType) => {
  if (formType === FORM_TYPES.REQUEST) return resetRequestFormConfig();
  return resetAssetFormConfig();
};

export const getDefaultFormConfig = (formType) => {
  if (formType === FORM_TYPES.REQUEST) return getDefaultRequestFormConfig();
  return getDefaultAssetFormConfig();
};

export const getFormSections = (formType, config = {}) => {
  if (formType === FORM_TYPES.REQUEST) return getRequestFormSections(config);
  return getAssetFormSections(config);
};
