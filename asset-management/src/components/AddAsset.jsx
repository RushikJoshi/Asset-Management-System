import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import { assetSchema } from "../schema/assetSchema";
import {
  addAsset,
  fetchSingleAsset,
  updateAsset,
} from "../store/slices/assetSlice";
import FormUsersInputText from "./common/FormUsersInputText";
import { useToast } from "./toast/toastStore";
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
  const formatDate = (value) => value?.split("T")[0] || "";

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    mode: "all",
    resolver: yupResolver(assetSchema),
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

  useEffect(() => {
    if (id) dispatch(fetchSingleAsset(id));
  }, [dispatch, id]);

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
    const payload = {
      ...data,
      warrantyPeriod: Number(data.warrantyPeriod || 0),
      maintenancePeriod: Number(data.maintenancePeriod || 0),
      price: Number(data.price || 0),
      warrantyReminderDays: Number(data.warrantyReminderDays || 10),
    };

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
          <section className="form-section">
            <h3>Asset Information</h3>
            <p className="section-desc">Capture asset identity, QR, and status details.</p>
            <div className="form-grid">
              <div className="grid-col-span-2">
                <FormUsersInputText
                  inputLabel="Asset Name"
                  inputname="assetName"
                  register={register}
                  errors={errors}
                  mandatory={true}
                />
              </div>
              <FormUsersInputText inputLabel="Category" inputname="category" register={register} errors={errors} mandatory={true} />
              <FormUsersInputText inputLabel="Sub Category" inputname="subCategory" register={register} errors={errors} />
              <div className="input-wrapper">
                <label className="input-label">
                  Asset Status<span className="required">*</span>
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
              <FormUsersInputText inputLabel="Assigned To" inputname="assignedTo" register={register} errors={errors} />
              <FormUsersInputText inputLabel="Serial Number" inputname="serialNumber" register={register} errors={errors} />
              <FormUsersInputText inputLabel="Asset Code" inputname="assetCode" register={register} errors={errors} />
              <FormUsersInputText inputLabel="Brand" inputname="brand" register={register} errors={errors} />
              <FormUsersInputText inputLabel="Model" inputname="model" register={register} errors={errors} />
              <FormUsersInputText inputLabel="Asset Type" inputname="assetType" register={register} errors={errors} />
            </div>
          </section>

          {showComputerFields && (
            <>
              <section className="form-section conditional-section">
                <h3>IP Configuration</h3>
                <p className="section-desc">Visible only for Laptop, PC, Desktop, or Computer assets.</p>
                <div className="form-grid">
                  <FormUsersInputText inputLabel="IP Address" inputname="ipAddress" register={register} errors={errors} />
                  <FormUsersInputText inputLabel="MAC Address" inputname="macAddress" register={register} errors={errors} />
                  <FormUsersInputText inputLabel="Host / Device Name" inputname="hostName" register={register} errors={errors} />
                  <FormUsersInputText inputLabel="Network Type" inputname="networkType" register={register} errors={errors} />
                  <FormUsersInputText inputLabel="Subnet" inputname="subnet" register={register} errors={errors} />
                  <FormUsersInputText inputLabel="Gateway" inputname="gateway" register={register} errors={errors} />
                </div>
              </section>

              <section className="form-section conditional-section">
                <h3>Computer Specifications</h3>
                <p className="section-desc">Hardware and software details for computer-style assets.</p>
                <div className="form-grid">
                  <FormUsersInputText inputLabel="Operating System" inputname="operatingSystem" register={register} errors={errors} />
                  <FormUsersInputText inputLabel="Processor" inputname="processor" register={register} errors={errors} />
                  <FormUsersInputText inputLabel="RAM" inputname="ram" register={register} errors={errors} />
                  <FormUsersInputText inputLabel="Storage" inputname="storage" register={register} errors={errors} />
                  <FormUsersInputText inputLabel="Antivirus" inputname="antivirus" register={register} errors={errors} />
                  <FormUsersInputText inputLabel="Domain" inputname="domainName" register={register} errors={errors} />
                </div>
              </section>
            </>
          )}

          <section className="form-section">
            <h3>Request & Purchase Details</h3>
            <p className="section-desc">Track request approvals, vendor purchase, and invoice data.</p>
            <div className="form-grid">
              <FormUsersInputText inputLabel="Request ID" inputname="requestId" register={register} errors={errors} />
              <FormUsersInputText inputLabel="Requested By" inputname="requestedBy" register={register} errors={errors} />
              <FormUsersInputText inputLabel="Priority" inputname="requestPriority" register={register} errors={errors} />
              <FormUsersInputText inputLabel="Reason" inputname="requestReason" register={register} errors={errors} />
              <FormUsersInputText inputLabel="Request Status" inputname="requestStatus" register={register} errors={errors} />
              <FormUsersInputText inputLabel="Manager Approval" inputname="managerApproval" register={register} errors={errors} />
              <FormUsersInputText inputLabel="IT/Admin Approval" inputname="adminApproval" register={register} errors={errors} />
              <div className="input-wrapper">
                <label className="input-label">Purchase Date</label>
                <input type="date" {...register("purchaseDate")} className="custom-input" />
              </div>
              <FormUsersInputText inputLabel="Vendor" inputname="vendor" register={register} errors={errors} />
              <FormUsersInputText inputLabel="Invoice Number" inputname="invoiceNumber" register={register} errors={errors} />
              <FormUsersInputText inputLabel="Purchase Cost" inputname="price" register={register} errors={errors} />
              <FormUsersInputText inputLabel="Purchase Status" inputname="purchaseStatus" register={register} errors={errors} />
            </div>
          </section>

          <section className="form-section">
            <h3>Warranty, Office & Assignment</h3>
            <p className="section-desc">Manage reminders, branch placement, and employee assignment.</p>
            <div className="form-grid">
              <FormUsersInputText inputLabel="Warranty Period (Months)" inputname="warrantyPeriod" register={register} errors={errors} />
              <div className="input-wrapper">
                <label className="input-label">Warranty Start</label>
                <input type="date" {...register("warrantyStart")} className="custom-input" />
              </div>
              <div className="input-wrapper">
                <label className="input-label">Warranty End</label>
                <input type="date" {...register("warrantyEnd")} className="custom-input" />
              </div>
              <FormUsersInputText inputLabel="Reminder Days" inputname="warrantyReminderDays" register={register} errors={errors} />
              <FormUsersInputText inputLabel="Maintenance Period (Months)" inputname="maintenancePeriod" register={register} errors={errors} />
              <FormUsersInputText inputLabel="Office Name" inputname="officeName" register={register} errors={errors} />
              <FormUsersInputText inputLabel="Branch Code" inputname="branchCode" register={register} errors={errors} />
              <FormUsersInputText inputLabel="Floor" inputname="floor" register={register} errors={errors} />
              <FormUsersInputText inputLabel="Department" inputname="department" register={register} errors={errors} />
              <FormUsersInputText inputLabel="Room/Cabin" inputname="room" register={register} errors={errors} />
              <FormUsersInputText inputLabel="City" inputname="city" register={register} errors={errors} />
              <FormUsersInputText inputLabel="State" inputname="state" register={register} errors={errors} />
              <FormUsersInputText inputLabel="Office Contact Person" inputname="officeContactPerson" register={register} errors={errors} />
              <FormUsersInputText
                inputLabel="Office Phone"
                inputname="officePhone"
                register={register}
                errors={errors}
                inputType="tel"
                inputMode="numeric"
                maxLength={10}
              />
              <div className="input-wrapper">
                <label className="input-label">Assigned Date</label>
                <input type="date" {...register("assignedDate")} className="custom-input" />
              </div>
              <FormUsersInputText inputLabel="Employee ID" inputname="employeeId" register={register} errors={errors} />
              <FormUsersInputText inputLabel="Employee Email" inputname="employeeEmail" register={register} errors={errors} inputType="email" />
              <div className="input-wrapper">
                <label className="input-label">Expected Return</label>
                <input type="date" {...register("expectedReturn")} className="custom-input" />
              </div>
              <FormUsersInputText inputLabel="Assigned By" inputname="assignedBy" register={register} errors={errors} />
            </div>
          </section>

          <section className="form-section">
            <h3>Retirement & Documentation</h3>
            <p className="section-desc">Record retirement, disposal, ownership, and supporting notes.</p>
            <div className="form-grid">
              <FormUsersInputText inputLabel="Retirement Status" inputname="retirementStatus" register={register} errors={errors} />
              <FormUsersInputText inputLabel="Retirement Approval" inputname="retirementApproval" register={register} errors={errors} />
              <FormUsersInputText inputLabel="Disposal Method" inputname="disposalMethod" register={register} errors={errors} />
              <div className="input-wrapper">
                <label className="input-label">Retirement Date</label>
                <input type="date" {...register("retirementDate")} className="custom-input" />
              </div>
            </div>

            <div className="full-width">
              <label className="input-label">Asset Description</label>
              <textarea
                placeholder="Enter notes, condition, or documentation details"
                {...register("assetDescription")}
                className="custom-textarea"
              />
            </div>

            <div className="ownership-row">
              <span className="input-label">Device Owned By:</span>
              <label className="radio-label">
                <input type="radio" value="Me" {...register("deviceOwnedBy")} /> Me
              </label>
              <label className="radio-label">
                <input type="radio" value="Other" {...register("deviceOwnedBy")} /> Other
              </label>
              {deviceOwnedBy === "Other" && (
                <div style={{ marginLeft: "20px", flex: 1 }}>
                  <FormUsersInputText
                    inputLabel="Owner Name"
                    inputname="ownerName"
                    register={register}
                    errors={errors}
                  />
                </div>
              )}
            </div>
          </section>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

export default AddAsset;
