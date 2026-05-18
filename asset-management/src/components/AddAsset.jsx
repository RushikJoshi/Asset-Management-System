import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import { createAssetSchema } from "../schema/assetSchema";
import {
  addAsset,
  fetchSingleAsset,
  updateAsset,
} from "../store/slices/assetSlice";
import FormUsersInputText from "./common/FormUsersInputText";
import { useToast } from "./toast/toastStore";
import { getAssetFormSections, loadAssetFormConfig } from "../utils/assetFormBuilder";
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

function AddAsset() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const isRequestMode = location.pathname.includes("request");
  const { loading, singleAssetData } = useSelector((state) => state.assetList);
  const [assetFormConfig, setAssetFormConfig] = useState(() => loadAssetFormConfig());
  const formatDate = (value) => value?.split("T")[0] || "";
  const activeAssetSchema = useMemo(
    () => createAssetSchema(assetFormConfig),
    [assetFormConfig],
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
    resolver: yupResolver(activeAssetSchema),
    defaultValues: {
      assetStatus: "AVAILABLE",
      deviceOwnedBy: "Me",
      warrantyReminderDays: 10,
      requestType: "Procurement",
      requestStatus: "Pending",
      managerApproval: "Pending",
      adminApproval: "Pending",
      purchaseStatus: "Pending",
    },
  });

  const deviceOwnedBy = useWatch({ control, name: "deviceOwnedBy" });
  const category = useWatch({ control, name: "category" });
  const showComputerFields = isComputerCategory(category);
  const isFieldVisible = (name) => assetFormConfig[name]?.visible !== false;
  const isFieldRequired = (name) => assetFormConfig[name]?.required === true;
  const formSections = getAssetFormSections(assetFormConfig);
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
    const syncBuilderConfig = () => setAssetFormConfig(loadAssetFormConfig());
    window.addEventListener("asset-form-builder-updated", syncBuilderConfig);
    return () => window.removeEventListener("asset-form-builder-updated", syncBuilderConfig);
  }, []);

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
    const missingField = Object.entries(assetFormConfig).find(
      ([name, field]) =>
        !isRequestMode &&
        field.visible &&
        field.required &&
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
      payload.assetStatus = data.assetStatus || "AVAILABLE";
      payload.purchaseStatus = data.purchaseStatus || "Pending";
      payload.requestStatus = data.requestStatus || "Pending";
      payload.managerApproval = data.managerApproval || "Pending";
      payload.adminApproval = data.adminApproval || "Pending";
    }

    if (!isComputerCategory(payload.category)) {
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
          message: `${payload.assetName || "Asset"} details saved successfully.`,
        });
      } else {
        await dispatch(addAsset(payload)).unwrap();
        showToast({
          title: isRequestMode ? "Request added" : "Asset added",
          message: `${payload.assetName || "Asset"} created successfully.`,
        });
      }

      reset();
      navigate(isRequestMode ? "/requests" : "/");
    } catch (error) {
      showToast({
        title: isEditMode ? "Update failed" : "Add failed",
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
      </div>
    ) : null;

  const dateFields = new Set([
    "purchaseDate",
    "warrantyStart",
    "warrantyEnd",
    "assignedDate",
    "expectedReturn",
    "retirementDate",
  ]);

  const renderConfiguredField = (field) => {
    if (!isFieldVisible(field.name) || field.name === "ownerName") return null;

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

    if (field.name === "assetDescription") {
      return (
        <div className="full-width" key={field.name}>
          <label className="input-label">
            {fieldLabelMap.assetDescription || "Asset Description"}
            {isFieldRequired("assetDescription") && <span className="required">*</span>}
          </label>
          <textarea
            placeholder="Enter notes, condition, or documentation details"
            {...register("assetDescription")}
            className="custom-textarea"
          />
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
    if (["IP Configuration", "Computer Specifications"].includes(section.key) && !showComputerFields) {
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
          <h1>{isEditMode ? `Edit ${isRequestMode ? "Request" : "Asset"} Workflow` : `Add ${isRequestMode ? "Request" : "Asset"} Workflow`}</h1>
          <div className="header-buttons">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate(isRequestMode ? "/requests" : "/")}
            >
              CANCEL
            </button>
            <button type="submit" className="submit-btn">
              {loading ? "SAVE" : isEditMode ? "UPDATE" : "SUBMIT"}
            </button>
          </div>
        </div>

        <div className="form-content">
          {isRequestMode ? (
            <>
              <section className="form-section">
                <h3>Request Details</h3>
                <p className="section-desc">Create procurement, maintenance, transfer, or return requests from the Requests menu.</p>
                <div className="form-grid">
                  <FormUsersInputText inputLabel="Request ID" inputname="requestId" register={register} errors={errors} />
                  <div className="input-wrapper">
                    <label className="input-label">Request Type</label>
                    <select {...register("requestType")} className="custom-input">
                      {selectOptions.requestType.map((option) => <option value={option} key={option}>{option}</option>)}
                    </select>
                  </div>
                  <div className="input-wrapper">
                    <label className="input-label">Request Date</label>
                    <input type="date" {...register("requestDate")} className="custom-input" />
                  </div>
                  <FormUsersInputText inputLabel="Requested By" inputname="requestedBy" register={register} errors={errors} />
                  <FormUsersInputText inputLabel="Employee ID" inputname="employeeId" register={register} errors={errors} />
                  <FormUsersInputText inputLabel="Employee Email" inputname="employeeEmail" register={register} errors={errors} inputType="email" />
                  <FormUsersInputText inputLabel="Department" inputname="department" register={register} errors={errors} />
                  <FormUsersInputText inputLabel="Office Name" inputname="officeName" register={register} errors={errors} />
                </div>
              </section>

              <section className="form-section">
                <h3>Requested Asset</h3>
                <p className="section-desc">Basic asset information required to convert an approved request into inventory.</p>
                <div className="form-grid">
                  <div className="grid-col-span-2">
                    <FormUsersInputText inputLabel="Requested Asset Name" inputname="assetName" register={register} errors={errors} mandatory={true} />
                  </div>
                  <FormUsersInputText inputLabel="Category" inputname="category" register={register} errors={errors} mandatory={true} />
                  <FormUsersInputText inputLabel="Sub Category" inputname="subCategory" register={register} errors={errors} />
                  <FormUsersInputText inputLabel="Brand" inputname="brand" register={register} errors={errors} />
                  <FormUsersInputText inputLabel="Model" inputname="model" register={register} errors={errors} />
                  <FormUsersInputText inputLabel="Vendor" inputname="vendor" register={register} errors={errors} />
                  <FormUsersInputText inputLabel="Estimated Cost" inputname="price" register={register} errors={errors} />
                </div>
              </section>

              <section className="form-section">
                <h3>Approval & Purchase</h3>
                <p className="section-desc">Track manager review, IT/admin approval, purchase status, and request reason.</p>
                <div className="form-grid">
                  <div className="input-wrapper">
                    <label className="input-label">Priority</label>
                    <select {...register("requestPriority")} className="custom-input">
                      {selectOptions.requestPriority.map((option) => <option value={option} key={option}>{option}</option>)}
                    </select>
                  </div>
                  <div className="input-wrapper">
                    <label className="input-label">Request Status</label>
                    <select {...register("requestStatus")} className="custom-input">
                      {selectOptions.requestStatus.map((option) => <option value={option} key={option}>{option}</option>)}
                    </select>
                  </div>
                  <div className="input-wrapper">
                    <label className="input-label">Manager Approval</label>
                    <select {...register("managerApproval")} className="custom-input">
                      {selectOptions.approval.map((option) => <option value={option} key={option}>{option}</option>)}
                    </select>
                  </div>
                  <div className="input-wrapper">
                    <label className="input-label">IT/Admin Approval</label>
                    <select {...register("adminApproval")} className="custom-input">
                      {selectOptions.approval.map((option) => <option value={option} key={option}>{option}</option>)}
                    </select>
                  </div>
                  <div className="input-wrapper">
                    <label className="input-label">Purchase Status</label>
                    <select {...register("purchaseStatus")} className="custom-input">
                      {selectOptions.purchaseStatus.map((option) => <option value={option} key={option}>{option}</option>)}
                    </select>
                  </div>
                  <div className="input-wrapper">
                    <label className="input-label">Expected Return</label>
                    <input type="date" {...register("expectedReturn")} className="custom-input" />
                  </div>
                </div>
                <div className="full-width">
                  <label className="input-label">Reason / Notes</label>
                  <textarea placeholder="Enter request reason, maintenance issue, transfer notes, or return details" {...register("requestReason")} className="custom-textarea" />
                </div>
              </section>
            </>
          ) : (
            <>
              {formSections.map((section) => renderConfiguredSection(section))}
            </>
          )}
        </div>
      </form>
    </div>
  );
}

export default AddAsset;
