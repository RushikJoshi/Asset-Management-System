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

import { isNetworkAssetCategory, getSubcategoriesForCategory } from "../utils/categoryCatalog";

const generateReqId = () => `REQ-${Date.now()}`;

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
  const [createdAsset, setCreatedAsset] = useState(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [selectedCodeType, setSelectedCodeType] = useState("qr");
  const [barcodeUrl, setBarcodeUrl] = useState("");
  const [barcodeError, setBarcodeError] = useState("");
  const [isSavingCodeType, setIsSavingCodeType] = useState(false);

  const formatDate = (value) => value?.split("T")[0] || "";

  const getAssetCodeValue = (asset) =>
    asset?.assetCode || asset?.serialNumber || asset?._id || "ASSET";

  const handleChooseCodeType = async (type) => {
    if (!createdAsset) return;
    if (type === "qr") {
      setSelectedCodeType("qr");
      setBarcodeError("");
      setBarcodeUrl("");
      setShowGenerateDialog(false);
      showToast({
        title: "QR Selected",
        message: "This asset will use QR code scan mode.",
      });
      return;
    }

    const codeValue = getAssetCodeValue(createdAsset);
    const generated = generateCode39Barcode(codeValue);
    if (generated.error) {
      setBarcodeError(generated.error);
      setBarcodeUrl("");
      return;
    }

    setIsSavingCodeType(true);
    try {
      const payload = {
        codeType: "barcode",
        barcodeImage: generated.dataUrl,
        barcodeText: codeValue,
      };
      const response = await dispatch(updateAsset({ id: createdAsset._id, payload })).unwrap();
      const updatedAsset = response?.asset || response;
      setCreatedAsset(updatedAsset);
      setSelectedCodeType("barcode");
      setBarcodeUrl(generated.dataUrl);
      setBarcodeError("");
      setShowGenerateDialog(false);
      showToast({
        title: "Barcode Selected",
        message: "Barcode scan mode has been saved for this asset.",
      });
    } catch (error) {
      setBarcodeError(error || "Failed to save barcode selection.");
    } finally {
      setIsSavingCodeType(false);
    }
  };

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
      category: "",
      subCategory: "",
      assetStatus: "",
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
  const showComputerFields = isNetworkAssetCategory(category, formConfig?.__categoryCatalog);
  const formSections = useMemo(() => {
    if (isRequestMode) {
      return getRequestFormSections(formConfig);
    }

    return getAssetFormSections(formConfig).filter((section) => {
      if (section.key === "Asset Information") return true;
      if (showComputerFields) {
        return ["IP Configuration", "Computer Specifications"].includes(section.key);
      } else {
        return section.key === "Remarks";
      }
    });
  }, [isRequestMode, formConfig, showComputerFields]);

  const renderedFieldNames = useMemo(() => {
    return new Set(formSections.flatMap((section) => section.fields.map((f) => f.name)));
  }, [formSections]);

  const isFieldVisible = (name) =>
    formConfig[name]?.visible !== false && renderedFieldNames.has(name);
  const isFieldRequired = (name) => formConfig[name]?.required === true;

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
        isFieldVisible(name) &&
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
      payload.requestId = data.requestId?.trim() || generateReqId();
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

    if (!isRequestMode && !isNetworkAssetCategory(payload.category, formConfig?.__categoryCatalog)) {
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
        reset();
        navigate(isRequestMode ? "/requests" : "/assets");
        return;
      }

      const response = await dispatch(addAsset(payload)).unwrap();
      const asset = response?.asset || response;
      setCreatedAsset(asset);
      setShowGenerateDialog(true);
      setSelectedCodeType("qr");
      setBarcodeUrl("");
      setBarcodeError("");
      showToast({
        title: isRequestMode ? "Request submitted" : "Asset added",
        message: `${payload.assetName || "Record"} created successfully.`,
      });
      reset();
    } catch (error) {
      showToast({
        title: isEditMode ? "Update failed" : "Submit failed",
        message: error || "Something went wrong. Please try again.",
        type: "error",
      });
    }
  };

  const placeholders = {
    ipAddress: "e.g., 192.168.1.10",
    macAddress: "e.g., 00:1B:44:11:3A:B7",
    serialNumber: "e.g., SN-88392019A",
    assetCode: "e.g., AST-2026-0089",
    brand: "e.g., Apple, Dell, HP",
    model: "e.g., MacBook Pro, Latitude 5420",
    ram: "e.g., 16 GB",
    storage: "e.g., 512 GB SSD",
    processor: "e.g., Apple M3 / Intel Core i7",
    operatingSystem: "e.g., macOS Sequoia, Windows 11",
    officePhone: "e.g., 9876543210",
    employeeEmail: "e.g., username@company.com",
    price: "e.g., 85000",
    warrantyPeriod: "e.g., 36",
    maintenancePeriod: "e.g., 12",
    officeName: "e.g., Corporate Headquarters",
    branchCode: "e.g., BR-DEL-01",
    floor: "e.g., 4th Floor",
    room: "e.g., Room 402",
    department: "e.g., Engineering, HR, Finance",
    city: "e.g., New Delhi",
    state: "e.g., Delhi",
    employeeId: "e.g., EMP-1049",
    assignedTo: "e.g., John Doe",
  };

  const checkMandatory = (name) => {
    if (["serialNumber", "assetCode", "officeName", "department"].includes(name)) {
      return true;
    }
    if (["ipAddress", "macAddress"].includes(name) && showComputerFields) {
      return true;
    }
    return isFieldRequired(name);
  };

  const renderTextField = (inputLabel, inputname, extraProps = {}) =>
    isFieldVisible(inputname) ? (
      <FormUsersInputText
        inputLabel={fieldLabelMap[inputname] || inputLabel}
        inputname={inputname}
        register={register}
        errors={errors}
        mandatory={checkMandatory(inputname)}
        inputPlaceholder={placeholders[inputname]}
        {...extraProps}
      />
    ) : null;

  const renderDateField = (inputLabel, inputname) =>
    isFieldVisible(inputname) ? (
      <div className="input-wrapper">
        <label className="input-label">
          {fieldLabelMap[inputname] || inputLabel}
          {checkMandatory(inputname) && <span className="required">*</span>}
        </label>
        <input
          type="date"
          {...register(inputname)}
          className={`custom-input ${errors[inputname] ? "input-error-border" : ""}`}
        />
        {errors[inputname] && <span className="field-error">{errors[inputname].message}</span>}
      </div>
    ) : null;

  const renderSelectField = (field, options) =>
    isFieldVisible(field.name) ? (
      <div className="input-wrapper" key={field.name}>
        <label className="input-label">
          {fieldLabelMap[field.name] || field.label}
          {checkMandatory(field.name) && <span className="required">*</span>}
        </label>
        <select
          {...register(field.name)}
          className={`custom-input ${errors[field.name] ? "input-error-border" : ""}`}
        >
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

    if (field.name === "category") {
      const catalog = formConfig?.__categoryCatalog || { categories: [] };
      const categories = catalog.categories || [];
      return (
        <div className="input-wrapper" key={field.name}>
          <label className="input-label">
            {fieldLabelMap.category || "Category"}
            {checkMandatory("category") && <span className="required">*</span>}
          </label>
          <select
            {...register("category")}
            className={`custom-input ${errors.category ? "input-error-border" : ""}`}
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option value={cat.name} key={cat.id || cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.category && <span className="field-error">{errors.category.message}</span>}
        </div>
      );
    }

    if (field.name === "subCategory") {
      const subcategories = getSubcategoriesForCategory(category, formConfig?.__categoryCatalog);
      return (
        <div className="input-wrapper" key={field.name}>
          <label className="input-label">
            {fieldLabelMap.subCategory || "Sub Category"}
            {checkMandatory("subCategory") && <span className="required">*</span>}
          </label>
          {subcategories.length > 0 ? (
            <select
              {...register("subCategory")}
              className={`custom-input ${errors.subCategory ? "input-error-border" : ""}`}
            >
              <option value="">Select Sub Category</option>
              {subcategories.map((sub) => (
                <option value={sub} key={sub}>
                  {sub}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="Enter Sub Category"
              {...register("subCategory")}
              className={`custom-input ${errors.subCategory ? "input-error-border" : ""}`}
            />
          )}
          {errors.subCategory && <span className="field-error">{errors.subCategory.message}</span>}
        </div>
      );
    }

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
          <select
            {...register("assetStatus")}
            className={`custom-input ${errors.assetStatus ? "input-error-border" : ""}`}
          >
            <option value="">Select Status</option>
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
          {errors.assetStatus && <span className="field-error">{errors.assetStatus.message}</span>}
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
            className={`custom-textarea ${errors[field.name] ? "input-error-border" : ""}`}
          />
          {errors[field.name] && <span className="field-error">{errors[field.name].message}</span>}
        </div>
      );
    }

    if (field.name === "deviceOwnedBy") {
      return (
        <div key={field.name} style={{ gridColumn: "span 2" }}>
          <div className="ownership-row" style={{ marginTop: 0, gridColumn: "auto" }}>
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
          {errors.deviceOwnedBy && (
            <span className="field-error" style={{ marginTop: "4px" }}>
              {errors.deviceOwnedBy.message}
            </span>
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

  const generateCode39Barcode = (value) => {
    const patternMap = {
      0: "101001101101",
      1: "110100101011",
      2: "101100101011",
      3: "110110010101",
      4: "101001101011",
      5: "110100110101",
      6: "101100110101",
      7: "101001011011",
      8: "110100101101",
      9: "101100101101",
      A: "110101001011",
      B: "101101001011",
      C: "110110100101",
      D: "101011001011",
      E: "110101100101",
      F: "101101100101",
      G: "101010011011",
      H: "110101001101",
      I: "101101001101",
      J: "101011001101",
      K: "110101010011",
      L: "101101010011",
      M: "110110101001",
      N: "101011010011",
      O: "110101101001",
      P: "101101101001",
      Q: "101010110011",
      R: "110101011001",
      S: "101101011001",
      T: "101011011001",
      U: "110010101011",
      V: "100110101011",
      W: "110011010101",
      X: "100101101011",
      Y: "110010110101",
      Z: "100110110101",
      "-": "100101011011",
      ".": "110010101101",
      " ": "100110101101",
      $: "100100100101",
      "/": "100100101001",
      "+": "100101001001",
      "%": "101001001001",
      "*": "100101101101",
    };

    const valueString = String(value || "").toUpperCase().trim();
    if (!valueString) {
      return { error: "No value provided for barcode generation." };
    }

    const invalidChar = valueString.split("").find((char) => !patternMap[char]);
    if (invalidChar) {
      return {
        error: `Unsupported character for barcode: ${invalidChar}. Use letters, numbers, space, -, ., $, /, +, % only.`,
      };
    }

    const encoded = ["*", ...valueString.split(""), "*"].map((char) => patternMap[char]).join("0");
    const moduleWidth = 2;
    const height = 100;
    const width = encoded.length * moduleWidth + 20;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#000000";

    let x = 10;
    for (let index = 0; index < encoded.length; index += 1) {
      const isBar = index % 2 === 0;
      const segmentWidth = encoded[index] === "1" ? moduleWidth * 2 : moduleWidth;
      if (isBar) {
        ctx.fillRect(x, 0, segmentWidth, height);
      }
      x += segmentWidth;
    }

    return { dataUrl: canvas.toDataURL("image/png") };
  };

  const renderConfiguredSection = (section, index) => {
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
        <h3>
          <span>{section.title}</span>
          {index === 0 && (
            <div className="header-buttons" style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="cancel-btn"
                style={{ padding: "4px 12px", height: "28px", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}
                onClick={() => navigate(isRequestMode ? "/requests" : "/assets")}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-btn" 
                style={{ padding: "4px 12px", height: "28px", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}
                disabled={loading}
              >
                {loading ? "Saving..." : isEditMode ? "Update" : "Submit"}
              </button>
            </div>
          )}
        </h3>
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
        <div className="form-content">
          {formSections.map((section, index) => renderConfiguredSection(section, index))}
        </div>
      </form>

      {showGenerateDialog && createdAsset && (
        <div className="code-gen-modal-backdrop">
          <div className="code-gen-modal">
            <div className="code-gen-header">
              <div>
                <h2>Generate a code for this asset</h2>
                <p>Choose whether you want a QR code or a barcode for the newly created asset.</p>
              </div>
              <button className="close-modal-btn" type="button" onClick={() => setShowGenerateDialog(false)}>
                ×
              </button>
            </div>

            <div className="code-gen-type-row">
              <button
                type="button"
                className={`code-gen-type ${selectedCodeType === "qr" ? "active" : ""}`}
                onClick={() => setSelectedCodeType("qr")}
              >
                QR Code
              </button>
              <button
                type="button"
                className={`code-gen-type ${selectedCodeType === "barcode" ? "active" : ""}`}
                onClick={() => {
                  setSelectedCodeType("barcode");
                  setBarcodeError("");
                  if (!barcodeUrl) {
                    const codeValue =
                      createdAsset.assetCode || createdAsset.serialNumber || createdAsset._id || "ASSET";
                    const generated = generateCode39Barcode(codeValue);
                    if (generated.error) {
                      setBarcodeError(generated.error);
                      setBarcodeUrl("");
                    } else {
                      setBarcodeUrl(generated.dataUrl);
                    }
                  }
                }}
              >
                Barcode
              </button>
            </div>

            <div className="code-gen-preview">
              {selectedCodeType === "qr" ? (
                createdAsset.qrCode ? (
                  <img src={createdAsset.qrCode} alt="Asset QR" className="code-preview-image" />
                ) : (
                  <div className="code-error-message">QR code is not available for this asset.</div>
                )
              ) : barcodeError ? (
                <div className="code-error-message">{barcodeError}</div>
              ) : barcodeUrl ? (
                <img src={barcodeUrl} alt="Asset Barcode" className="code-preview-image" />
              ) : (
                <div className="code-error-message">Barcode could not be generated.</div>
              )}
            </div>

            <div className="code-gen-meta">
              <p>
                <strong>Asset:</strong> {createdAsset.assetName || createdAsset.assetCode || createdAsset.serialNumber || "New Asset"}
              </p>
              <p>
                <strong>Code value:</strong> {createdAsset.assetCode || createdAsset.serialNumber || createdAsset._id}
              </p>
            </div>

            <div className="code-gen-actions">
              <button
                type="button"
                className="submit-btn"
                onClick={() => handleChooseCodeType("qr")}
                disabled={isSavingCodeType}
              >
                Use QR Code
              </button>
              <button
                type="button"
                className="submit-btn"
                onClick={() => handleChooseCodeType("barcode")}
                disabled={isSavingCodeType}
              >
                Use Barcode
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowGenerateDialog(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate("/assets")}
              >
                Back to Assets
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddAsset;
