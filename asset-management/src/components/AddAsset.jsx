import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import { createAssetSchema } from "../schema/assetSchema";
import { createRequestSchema } from "../schema/requestSchema";
import {
  addAsset,
  fetchSingleAsset,
  updateAsset,
} from "../store/slices/assetSlice";
import FormUsersInputText from "./common/FormUsersInputText";
import { useToast } from "./toast/toastStore";
import {
  FORM_TYPES,
  getAssetFormSections,
  getRequestFormSections,
  loadAssetFormConfig,
  loadRequestFormConfig,
} from "../utils/assetFormBuilder";
import "./AddAsset.css";

const computerCategories = ["laptop", "pc", "desktop", "computer"];
const isComputerCategory = (category) =>
  computerCategories.includes(String(category || "").trim().toLowerCase());

const selectOptions = {
  requestType: ["Procurement", "Maintenance", "Transfer", "Return"],
  requestPriority: ["Low", "Medium", "High", "Urgent"],
  requestStatus: ["Pending", "Approved", "Purchased", "Rejected"],
  approval: ["Pending", "Approved", "Rejected"],
  purchaseStatus: ["Pending", "Purchased", "Rejected"],
};

const requestSelectFields = new Set([
  "requestType",
  "requestPriority",
  "requestStatus",
  "managerApproval",
  "adminApproval",
  "purchaseStatus",
]);

function AddAsset() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const isRequestMode = location.pathname.includes("request");
  const formType = isRequestMode ? FORM_TYPES.REQUEST : FORM_TYPES.ASSET;
  const { loading, singleAssetData } = useSelector((state) => state.assetList);
  const [formConfig, setFormConfig] = useState(() =>
    isRequestMode ? loadRequestFormConfig() : loadAssetFormConfig(),
  );

  const formatDate = (value) => value?.split("T")[0] || "";

  const activeSchema = useMemo(
    () => (isRequestMode ? createRequestSchema(formConfig) : createAssetSchema(formConfig)),
    [formConfig, isRequestMode],
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors },
  } = useForm({
    mode: "all",
    resolver: yupResolver(activeSchema),
    defaultValues: {
      assetStatus: "AVAILABLE",
      deviceOwnedBy: "Me",
      warrantyReminderDays: 10,
      requestType: "Procurement",
      requestStatus: "Pending",
      managerApproval: "Pending",
      adminApproval: "Pending",
      purchaseStatus: "Pending",
      requestPriority: "Medium",
    },
  });

  const deviceOwnedBy = useWatch({ control, name: "deviceOwnedBy" });
  const category = useWatch({ control, name: "category" });
  const showComputerFields = isComputerCategory(category);
  const isFieldVisible = (name) => formConfig[name]?.visible !== false;
  const isFieldRequired = (name) => formConfig[name]?.required === true;
  const formSections = isRequestMode
    ? getRequestFormSections(formConfig)
    : getAssetFormSections(formConfig);

  const allCustomFields = formSections.flatMap((section) =>
    section.fields.filter((field) => field.custom).map((field) => ({
      ...field,
      sectionKey: section.key,
      sectionTitle: section.title,
    })),
  );

  const fieldLabelMap = formSections
    .flatMap((section) => section.fields)
    .reduce((acc, field) => ({ ...acc, [field.name]: field.label }), {});

  useEffect(() => {
    if (id) dispatch(fetchSingleAsset(id));
  }, [dispatch, id]);

  useEffect(() => {
    const syncBuilderConfig = (event) => {
      const updatedType = event?.detail?.formType;
      if (updatedType && updatedType !== formType) return;
      setFormConfig(isRequestMode ? loadRequestFormConfig() : loadAssetFormConfig());
    };
    window.addEventListener("form-builder-updated", syncBuilderConfig);
    window.addEventListener("asset-form-builder-updated", syncBuilderConfig);
    return () => {
      window.removeEventListener("form-builder-updated", syncBuilderConfig);
      window.removeEventListener("asset-form-builder-updated", syncBuilderConfig);
    };
  }, [formType, isRequestMode]);

  useEffect(() => {
    if (id && singleAssetData) {
      reset({
        ...singleAssetData,
        purchaseDate: formatDate(singleAssetData.purchaseDate),
        warrantyStart: formatDate(singleAssetData.warrantyStart),
        warrantyEnd: formatDate(singleAssetData.warrantyEnd),
        requestDate: formatDate(singleAssetData.requestDate),
        assignedDate: formatDate(singleAssetData.assignedDate),
        expectedReturn: formatDate(singleAssetData.expectedReturn),
        retirementDate: formatDate(singleAssetData.retirementDate),
      });
    }
  }, [singleAssetData, reset, id]);

  const onSubmit = async (data) => {
    const missingField = Object.entries(formConfig).find(
      ([name, field]) =>
        !name.startsWith("__") &&
        field?.visible &&
        field?.required &&
        !String(data[name] || "").trim(),
    );

    if (missingField) {
      const [name] = missingField;
      setError(name, {
        type: "manual",
        message: `${fieldLabelMap[name] || "This field"} is required`,
      });
      return;
    }

    const payload = {
      ...data,
      warrantyPeriod: Number(data.warrantyPeriod || 0),
      maintenancePeriod: Number(data.maintenancePeriod || 0),
      price: Number(data.price || 0),
      warrantyReminderDays: Number(data.warrantyReminderDays || 10),
    };

    if (allCustomFields.length) {
      payload.customFields = allCustomFields.reduce((acc, field) => {
        if (isFieldVisible(field.name)) {
          acc[`${field.sectionTitle}.${field.label}`] = data[field.name] || "";
        }
        delete payload[field.name];
        return acc;
      }, {});
    }

    if (isRequestMode) {
      payload.recordType = "REQUEST";
      payload.requestId = data.requestId?.trim() || `REQ-${Date.now()}`;
      payload.requestStatus = data.requestStatus || "Pending";
      payload.managerApproval = data.managerApproval || "Pending";
      payload.adminApproval = data.adminApproval || "Pending";
      payload.purchaseStatus = data.purchaseStatus || "Pending";
      payload.requestType = data.requestType || "Procurement";
      if (!payload.requestDate) {
        payload.requestDate = new Date().toISOString().split("T")[0];
      }
    } else {
      payload.recordType = "ASSET";
    }

    if (!isRequestMode && !isComputerCategory(payload.category)) {
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
        delete payload[key];
      });
    }

    if (payload.deviceOwnedBy === "Me") {
      delete payload.ownerName;
    }

    if (payload.deviceOwnedBy === "Other") {
      payload.ownerName = data.ownerName;
    }

    try {
      if (isEditMode) {
        await dispatch(updateAsset({ id, payload })).unwrap();
        showToast({
          title: isRequestMode ? "Request updated" : "Asset updated",
          message: `${payload.assetName || "Record"} saved successfully.`,
        });
      } else {
        await dispatch(addAsset(payload)).unwrap();
        showToast({
          title: isRequestMode ? "Request submitted" : "Asset added",
          message: `${payload.assetName || "Record"} created successfully.`,
        });
      }

      reset();
      navigate(isRequestMode ? "/requests" : "/assets");
    } catch (error) {
      showToast({
        title: isEditMode ? "Update failed" : "Submit failed",
        message: error || "Something went wrong. Please try again.",
        type: "error",
      });
    }
  };

  const renderTextField = (inputLabel, inputname, extraProps = {}) =>
    isFieldVisible(inputname) ? (
      <FormUsersInputText
        inputLabel={fieldLabelMap[inputname] || inputLabel}
        inputname={inputname}
        register={register}
        errors={errors}
        mandatory={isFieldRequired(inputname)}
        {...extraProps}
      />
    ) : null;

  const renderDateField = (inputLabel, inputname) =>
    isFieldVisible(inputname) ? (
      <div className="input-wrapper">
        <label className="input-label">
          {fieldLabelMap[inputname] || inputLabel}
          {isFieldRequired(inputname) && <span className="required">*</span>}
        </label>
        <input type="date" {...register(inputname)} className="custom-input" />
        {errors[inputname] && <span className="field-error">{errors[inputname].message}</span>}
      </div>
    ) : null;

  const renderSelectField = (field, options) =>
    isFieldVisible(field.name) ? (
      <div className="input-wrapper" key={field.name}>
        <label className="input-label">
          {fieldLabelMap[field.name] || field.label}
          {isFieldRequired(field.name) && <span className="required">*</span>}
        </label>
        <select {...register(field.name)} className="custom-input">
          {options.map((option) => (
            <option value={option} key={option}>
              {option}
            </option>
          ))}
        </select>
        {errors[field.name] && <span className="field-error">{errors[field.name].message}</span>}
      </div>
    ) : null;

  const dateFields = new Set([
    "purchaseDate",
    "warrantyStart",
    "warrantyEnd",
    "assignedDate",
    "expectedReturn",
    "retirementDate",
    "requestDate",
  ]);

  const renderConfiguredField = (field) => {
    if (!isFieldVisible(field.name) || field.name === "ownerName") return null;

    if (requestSelectFields.has(field.name)) {
      const options =
        field.name === "requestType"
          ? selectOptions.requestType
          : field.name === "requestPriority"
            ? selectOptions.requestPriority
            : field.name === "requestStatus"
              ? selectOptions.requestStatus
              : field.name === "purchaseStatus"
                ? selectOptions.purchaseStatus
                : selectOptions.approval;
      return renderSelectField(field, options);
    }

    if (field.name === "assetStatus") {
      return (
        <div className="input-wrapper" key={field.name}>
          <label className="input-label">
            {fieldLabelMap.assetStatus || "Asset Status"}
            {isFieldRequired("assetStatus") && <span className="required">*</span>}
          </label>
          <select {...register("assetStatus")} className="custom-input">
            <option value="AVAILABLE">Available</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="UNDER_REPAIR">Under Repair</option>
            <option value="RETURNED">Returned</option>
            <option value="DAMAGED">Damaged</option>
            <option value="LOST">Lost</option>
            <option value="RETIRED">Retired</option>
            <option value="DISPOSED">Disposed</option>
            <option value="RECYCLED">Recycled</option>
          </select>
        </div>
      );
    }

    if (field.name === "assetDescription" || field.name === "requestReason") {
      return (
        <div className="full-width" key={field.name}>
          <label className="input-label">
            {fieldLabelMap[field.name] || field.label}
            {isFieldRequired(field.name) && <span className="required">*</span>}
          </label>
          <textarea
            placeholder={`Enter ${fieldLabelMap[field.name] || field.label}`}
            {...register(field.name)}
            className="custom-textarea"
          />
          {errors[field.name] && <span className="field-error">{errors[field.name].message}</span>}
        </div>
      );
    }

    if (field.name === "deviceOwnedBy") {
      return (
        <div className="ownership-row" key={field.name}>
          <span className="input-label">
            {fieldLabelMap.deviceOwnedBy || "Device Owned By"}:
            {isFieldRequired("deviceOwnedBy") && <span className="required">*</span>}
          </span>
          <label className="radio-label">
            <input type="radio" value="Me" {...register("deviceOwnedBy")} /> Me
          </label>
          <label className="radio-label">
            <input type="radio" value="Other" {...register("deviceOwnedBy")} /> Other
          </label>
          {deviceOwnedBy === "Other" && isFieldVisible("ownerName") && (
            <div style={{ marginLeft: "20px", flex: 1 }}>
              <FormUsersInputText
                inputLabel={fieldLabelMap.ownerName || "Owner Name"}
                inputname="ownerName"
                register={register}
                errors={errors}
                mandatory={isFieldRequired("ownerName")}
              />
            </div>
          )}
        </div>
      );
    }

    if (dateFields.has(field.name)) {
      return <div key={field.name}>{renderDateField(field.label, field.name)}</div>;
    }

    const extraProps = {};
    if (field.name === "officePhone") {
      extraProps.inputType = "tel";
      extraProps.inputMode = "numeric";
      extraProps.maxLength = 10;
    }
    if (field.name === "employeeEmail") {
      extraProps.inputType = "email";
    }

    const renderedField = renderTextField(field.label, field.name, extraProps);

    return field.name === "assetName" ? (
      <div className="grid-col-span-2" key={field.name}>
        {renderedField}
      </div>
    ) : (
      <div key={field.name}>{renderedField}</div>
    );
  };

  const renderConfiguredSection = (section) => {
    if (
      !isRequestMode &&
      ["IP Configuration", "Computer Specifications"].includes(section.key) &&
      !showComputerFields
    ) {
      return null;
    }

    const visibleFields = section.fields.filter((field) => {
      if (field.name === "ownerName") return false;
      return isFieldVisible(field.name);
    });

    if (!visibleFields.length) return null;

    return (
      <section className="form-section" key={section.key}>
        <h3>{section.title}</h3>
        {section.description && <p className="section-desc">{section.description}</p>}
        <div className="form-grid">
          {visibleFields.map((field) => renderConfiguredField(field))}
        </div>
      </section>
    );
  };

  return (
    <div className="page-wrapper">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-header">
          <h1>
            {isEditMode
              ? `Edit ${isRequestMode ? "Request" : "Asset"}`
              : isRequestMode
                ? "New Asset Request"
                : "Add Asset"}
          </h1>
          <div className="header-buttons">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate(isRequestMode ? "/requests" : "/assets")}
            >
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Saving..." : isEditMode ? "Update" : "Submit"}
            </button>
          </div>
        </div>

        <div className="form-content">
          {formSections.map((section) => renderConfiguredSection(section))}
        </div>
      </form>
    </div>
  );
}

export default AddAsset;
