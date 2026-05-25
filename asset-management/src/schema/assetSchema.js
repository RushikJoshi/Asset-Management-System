import * as yup from "yup";
import { getAssetFormSections } from "../utils/assetFormBuilder";
import { isNetworkAssetCategory } from "../utils/categoryCatalog";

const isComputerAsset = (category, formConfig) =>
  isNetworkAssetCategory(category, formConfig?.__categoryCatalog);

const getActiveSections = (config) =>
  getAssetFormSections(config).filter((section) =>
    ["Asset Information", "IP Configuration", "Computer Specifications", "Remarks"].includes(section.key)
  );

const labelMapFromConfig = (config) =>
  getActiveSections(config)
    .flatMap((section) => section.fields)
    .reduce((acc, field) => ({ ...acc, [field.name]: field.label }), {});

const isRequired = (config, name) => config[name]?.required === true;

export const createAssetSchema = (formConfig = {}) => {
  const activeSections = getActiveSections(formConfig);
  const activeFieldNames = new Set(activeSections.flatMap((section) => section.fields.map((f) => f.name)));

  const isVisible = (config, name) => config[name]?.visible !== false && activeFieldNames.has(name);

  const applyRequiredWhenConfigured = (schema, config, name, label) =>
    isVisible(config, name) && isRequired(config, name)
      ? schema.required(`${label} is required`)
      : schema;

  const requiredWhenConfigured = (config, name, label) =>
    applyRequiredWhenConfigured(yup.string(), config, name, label);

  const labels = labelMapFromConfig(formConfig);
  const labelFor = (name, fallback) => labels[name] || fallback;
  const stringField = (name, fallback) => requiredWhenConfigured(formConfig, name, labelFor(name, fallback));
  const numberField = (name, fallback) =>
    applyRequiredWhenConfigured(
      yup.string().matches(/^\d*$/, "Only numbers allowed"),
      formConfig,
      name,
      labelFor(name, fallback),
    );

  const conditionalRequired = (name, message, fallbackSchema = yup.string()) =>
    isVisible(formConfig, name) ? fallbackSchema.required(message) : fallbackSchema.notRequired();

  const schemaShape = {
  assetName: requiredWhenConfigured(formConfig, "assetName", "Asset Name"),

  category: requiredWhenConfigured(formConfig, "category", "Category"),

  subCategory: stringField("subCategory", "Sub Category"),

  assetStatus: requiredWhenConfigured(formConfig, "assetStatus", "Asset Status"),

  assignedTo: yup.string().when("assetStatus", {
    is: (value) =>
      isVisible(formConfig, "assignedTo") &&
      (value === "ASSIGNED" || isRequired(formConfig, "assignedTo")),
    then: (schema) => schema.required(`${labelFor("assignedTo", "Assigned To")} is required`),
    otherwise: (schema) => schema.notRequired(),
  }),

  serialNumber: conditionalRequired("serialNumber", "Serial Number is required for tracking"),

  assetCode: conditionalRequired("assetCode", "Asset Code is required for tracking"),

  purchaseDate: stringField("purchaseDate", "Purchase Date"),

  vendor: stringField("vendor", "Vendor"),

  location: stringField("location", "Location"),

  assetType: stringField("assetType", "Asset Type"),

  brand: stringField("brand", "Brand"),

  model: stringField("model", "Model"),

  ipAddress: yup.string().when("category", {
    is: (cat) => isComputerAsset(cat, formConfig),
    then: (schema) =>
      schema
        .required("IP Address is required for network assets")
        .matches(/^((25[0-5]|2[0-4]\d|1?\d?\d)(\.|$)){4}$/, "Enter a valid IP address"),
    otherwise: (schema) => schema.notRequired(),
  }),

  macAddress: yup.string().when("category", {
    is: (cat) => isComputerAsset(cat, formConfig),
    then: (schema) =>
      schema
        .required("MAC Address is required for network assets")
        .matches(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, "Enter a valid MAC address"),
    otherwise: (schema) => schema.notRequired(),
  }),

  hostName: stringField("hostName", "Host / Device Name"),
  networkType: stringField("networkType", "Network Type"),
  subnet: stringField("subnet", "Subnet"),
  gateway: stringField("gateway", "Gateway"),
  operatingSystem: stringField("operatingSystem", "Operating System"),
  processor: stringField("processor", "Processor"),
  ram: stringField("ram", "RAM"),
  storage: stringField("storage", "Storage"),
  antivirus: stringField("antivirus", "Antivirus"),
  domainName: stringField("domainName", "Domain"),

  warrantyPeriod: numberField("warrantyPeriod", "Warranty Period (Months)"),

  maintenancePeriod: numberField("maintenancePeriod", "Maintenance Period (Months)"),

  price: numberField("price", "Purchase Cost"),

  warrantyReminderDays: numberField("warrantyReminderDays", "Reminder Days"),

  invoiceNumber: stringField("invoiceNumber", "Invoice Number"),

  warrantyStart: stringField("warrantyStart", "Warranty Start"),

  warrantyEnd: stringField("warrantyEnd", "Warranty End"),

  officeName: conditionalRequired("officeName", "Office Name is required for tracking"),

  branchCode: stringField("branchCode", "Branch Code"),

  floor: stringField("floor", "Floor"),

  department: conditionalRequired("department", "Department is required for tracking"),

  room: stringField("room", "Room/Cabin"),

  city: stringField("city", "City"),

  state: stringField("state", "State"),

  officeContactPerson: stringField("officeContactPerson", "Office Contact Person"),

  officePhone: applyRequiredWhenConfigured(
    yup.string().matches(/^[6-9]\d{9}$/, {
      message: "Mobile number must start with 6, 7, 8, or 9 and be exactly 10 digits",
      excludeEmptyString: true,
    }),
    formConfig,
    "officePhone",
    labelFor("officePhone", "Office Phone"),
  ),

  requestId: stringField("requestId", "Request ID"),

  requestType: stringField("requestType", "Request Type"),

  requestDate: stringField("requestDate", "Request Date"),

  requestedBy: stringField("requestedBy", "Requested By"),

  requestPriority: stringField("requestPriority", "Priority"),

  requestReason: stringField("requestReason", "Reason"),

  requestStatus: stringField("requestStatus", "Request Status"),

  managerApproval: stringField("managerApproval", "Manager Approval"),

  adminApproval: stringField("adminApproval", "IT/Admin Approval"),

  assignedDate: stringField("assignedDate", "Assigned Date"),

  employeeId: stringField("employeeId", "Employee ID"),

  employeeEmail: applyRequiredWhenConfigured(
    yup.string().email("Enter a valid employee email"),
    formConfig,
    "employeeEmail",
    labelFor("employeeEmail", "Employee Email"),
  ),

  expectedReturn: stringField("expectedReturn", "Expected Return"),

  assignedBy: stringField("assignedBy", "Assigned By"),

  purchaseStatus: stringField("purchaseStatus", "Purchase Status"),

  retirementStatus: stringField("retirementStatus", "Retirement Status"),

  retirementApproval: stringField("retirementApproval", "Retirement Approval"),

  disposalMethod: stringField("disposalMethod", "Disposal Method"),

  retirementDate: stringField("retirementDate", "Retirement Date"),

  assetDescription: yup.string().when("category", {
    is: (cat) => !isComputerAsset(cat, formConfig),
    then: (schema) => requiredWhenConfigured(formConfig, "assetDescription", labelFor("assetDescription", "Remarks")),
    otherwise: (schema) => schema.notRequired(),
  }),

  deviceOwnedBy: requiredWhenConfigured(formConfig, "deviceOwnedBy", "Device owner"),

  ownerName: yup.string().when("deviceOwnedBy", {
    is: (value) => value === "Other" && isVisible(formConfig, "ownerName") && isRequired(formConfig, "ownerName"),
    then: (schema) => schema.required(`${labelFor("ownerName", "Owner Name")} is required`),
    otherwise: (schema) => schema.notRequired(),
  }),
  };

  Object.entries(formConfig).forEach(([name, field]) => {
    if (name.startsWith("__") || schemaShape[name] || !field?.visible || !field?.required) return;
    schemaShape[name] = yup.string().required(`${labelFor(name, "This field")} is required`);
  });

  return yup.object().shape(schemaShape);
};

export const assetSchema = createAssetSchema();
