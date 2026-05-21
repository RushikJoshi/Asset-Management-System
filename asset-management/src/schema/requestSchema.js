import * as yup from "yup";
import { getRequestFormSections } from "../utils/assetFormBuilder";

const isVisible = (config, name) => config[name]?.visible !== false;
const isRequired = (config, name) => config[name]?.required === true;

const applyRequiredWhenConfigured = (schema, config, name, label) =>
  isVisible(config, name) && isRequired(config, name)
    ? schema.required(`${label} is required`)
    : schema;

const requiredWhenConfigured = (config, name, label) =>
  applyRequiredWhenConfigured(yup.string(), config, name, label);

const labelMapFromConfig = (config) =>
  getRequestFormSections(config)
    .flatMap((section) => section.fields)
    .reduce((acc, field) => ({ ...acc, [field.name]: field.label }), {});

export const createRequestSchema = (formConfig = {}) => {
  const labels = labelMapFromConfig(formConfig);
  const labelFor = (name, fallback) => labels[name] || fallback;
  const stringField = (name, fallback) => requiredWhenConfigured(formConfig, name, labelFor(name, fallback));
  const numberField = (name, fallback) =>
    applyRequiredWhenConfigured(
      yup.string().matches(/^\d*\.?\d*$/, "Only numbers allowed"),
      formConfig,
      name,
      labelFor(name, fallback),
    );

  const schemaShape = {
    requestId: stringField("requestId", "Request ID"),
    requestType: requiredWhenConfigured(formConfig, "requestType", labelFor("requestType", "Request Type")),
    requestDate: requiredWhenConfigured(formConfig, "requestDate", labelFor("requestDate", "Request Date")),
    requestedBy: requiredWhenConfigured(formConfig, "requestedBy", labelFor("requestedBy", "Requested By")),
    employeeId: stringField("employeeId", "Employee ID"),
    employeeEmail: applyRequiredWhenConfigured(
      yup.string().email("Enter a valid employee email"),
      formConfig,
      "employeeEmail",
      labelFor("employeeEmail", "Employee Email"),
    ),
    department: stringField("department", "Department"),
    officeName: stringField("officeName", "Office Name"),
    requestPriority: stringField("requestPriority", "Priority"),
    requestReason: stringField("requestReason", "Reason / Notes"),
    assetName: requiredWhenConfigured(formConfig, "assetName", labelFor("assetName", "Requested Asset Name")),
    category: requiredWhenConfigured(formConfig, "category", labelFor("category", "Category")),
    subCategory: stringField("subCategory", "Sub Category"),
    brand: stringField("brand", "Brand"),
    model: stringField("model", "Model"),
    vendor: stringField("vendor", "Preferred Vendor"),
    price: numberField("price", "Estimated Cost"),
    requestStatus: requiredWhenConfigured(formConfig, "requestStatus", labelFor("requestStatus", "Request Status")),
    managerApproval: stringField("managerApproval", "Manager Approval"),
    adminApproval: stringField("adminApproval", "IT/Admin Approval"),
    purchaseStatus: stringField("purchaseStatus", "Purchase Status"),
    expectedReturn: stringField("expectedReturn", "Expected Return"),
  };

  Object.entries(formConfig).forEach(([name, field]) => {
    if (name.startsWith("__") || schemaShape[name] || !field?.visible || !field?.required) return;
    schemaShape[name] = yup.string().required(`${labelFor(name, "This field")} is required`);
  });

  return yup.object().shape(schemaShape);
};