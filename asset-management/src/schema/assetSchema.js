import * as yup from "yup";

const isComputerAsset = (category) =>
  ["laptop", "pc", "desktop", "computer"].includes(String(category || "").trim().toLowerCase());

export const assetSchema = yup.object().shape({
  assetName: yup.string().required("Asset Name is required"),

  category: yup.string().required("Category is required"),

  subCategory: yup.string(),

  assetStatus: yup.string().required("Asset Status is required"),

  assignedTo: yup.string().when("assetStatus", {
    is: "ASSIGNED",
    then: (schema) => schema.required("Assigned To is required"),
    otherwise: (schema) => schema.notRequired(),
  }),

  serialNumber: yup.string(),

  assetCode: yup.string(),

  purchaseDate: yup.string(),

  vendor: yup.string(),

  location: yup.string(),

  assetType: yup.string(),

  brand: yup.string(),

  model: yup.string(),

  ipAddress: yup.string().when("category", {
    is: isComputerAsset,
    then: (schema) => schema.matches(/^$|^((25[0-5]|2[0-4]\d|1?\d?\d)(\.|$)){4}$/, "Enter a valid IP address"),
    otherwise: (schema) => schema.notRequired(),
  }),

  macAddress: yup.string().when("category", {
    is: isComputerAsset,
    then: (schema) => schema.matches(/^$|^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, "Enter a valid MAC address"),
    otherwise: (schema) => schema.notRequired(),
  }),

  hostName: yup.string(),
  networkType: yup.string(),
  subnet: yup.string(),
  gateway: yup.string(),
  operatingSystem: yup.string(),
  processor: yup.string(),
  ram: yup.string(),
  storage: yup.string(),
  antivirus: yup.string(),
  domainName: yup.string(),

  warrantyPeriod: yup.string().matches(/^\d*$/, "Only numbers allowed"),

  maintenancePeriod: yup.string().matches(/^\d*$/, "Only numbers allowed"),

  price: yup.string().matches(/^\d*$/, "Only numbers allowed"),

  warrantyReminderDays: yup.string().matches(/^\d*$/, "Only numbers allowed"),

  invoiceNumber: yup.string(),

  warrantyStart: yup.string(),

  warrantyEnd: yup.string(),

  officeName: yup.string(),

  branchCode: yup.string(),

  floor: yup.string(),

  department: yup.string(),

  room: yup.string(),

  city: yup.string(),

  state: yup.string(),

  officeContactPerson: yup.string(),

  officePhone: yup
    .string()
    .matches(/^[6-9]\d{9}$/, {
      message: "Mobile number must start with 6, 7, 8, or 9 and be exactly 10 digits",
      excludeEmptyString: true,
    }),

  requestId: yup.string(),

  requestType: yup.string(),

  requestDate: yup.string(),

  requestedBy: yup.string(),

  requestPriority: yup.string(),

  requestReason: yup.string(),

  requestStatus: yup.string(),

  managerApproval: yup.string(),

  adminApproval: yup.string(),

  assignedDate: yup.string(),

  employeeId: yup.string(),

  employeeEmail: yup.string().email("Enter a valid employee email"),

  expectedReturn: yup.string(),

  assignedBy: yup.string(),

  purchaseStatus: yup.string(),

  retirementStatus: yup.string(),

  retirementApproval: yup.string(),

  disposalMethod: yup.string(),

  retirementDate: yup.string(),

  assetDescription: yup.string(),

  deviceOwnedBy: yup.string().required("Device owner is required"),

  ownerName: yup.string().when("deviceOwnedBy", {
    is: "Other",
    then: (schema) => schema.required("Owner Name is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
});
