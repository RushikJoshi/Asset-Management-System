import * as yup from "yup";
import { getAssetFormSections } from "../utils/assetFormBuilder";

const isComputerAsset = (category) =>
  ["laptop", "pc", "desktop", "computer"].includes(String(category || "").trim().toLowerCase());

const isVisible = (config, name) => config[name]?.visible !== false;
const isRequired = (config, name) => config[name]?.required === true;
const applyRequiredWhenConfigured = (schema, config, name, label) =>
  isVisible(config, name) && isRequired(config, name)
    ? schema.required(`${label} is required`)
    : schema;
const requiredWhenConfigured = (config, name, label) =>
  applyRequiredWhenConfigured(yup.string(), config, name, label);
const labelMapFromConfig = (config) =>
  getAssetFormSections(config)
    .flatMap((section) => section.fields)
    .reduce((acc, field) => ({ ...acc, [field.name]: field.label }), {});

export const createAssetSchema = (formConfig = {}) => {
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

  serialNumber: stringField("serialNumber", "Serial Number"),

  assetCode: stringField("assetCode", "Asset Code"),

  purchaseDate: stringField("purchaseDate", "Purchase Date"),

  vendor: stringField("vendor", "Vendor"),

  location: stringField("location", "Location"),

  assetType: stringField("assetType", "Asset Type"),

  brand: stringField("brand", "Brand"),

  model: stringField("model", "Model"),

  ipAddress: yup.string().when("category", {
    is: isComputerAsset,
    then: (schema) =>
      applyRequiredWhenConfigured(
        schema.matches(/^$|^((25[0-5]|2[0-4]\d|1?\d?\d)(\.|$)){4}$/, "Enter a valid IP address"),
        formConfig,
        "ipAddress",
        labelFor("ipAddress", "IP Address"),
      ),
    otherwise: (schema) => schema.notRequired(),
  }),

  macAddress: yup.string().when("category", {
    is: isComputerAsset,
    then: (schema) =>
      applyRequiredWhenConfigured(
        schema.matches(/^$|^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, "Enter a valid MAC address"),
        formConfig,
        "macAddress",
        labelFor("macAddress", "MAC Address"),
      ),
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

  officeName: stringField("officeName", "Office Name"),

  branchCode: stringField("branchCode", "Branch Code"),

  floor: stringField("floor", "Floor"),

  department: stringField("department", "Department"),

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

  assetDescription: stringField("assetDescription", "Asset Description"),

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
