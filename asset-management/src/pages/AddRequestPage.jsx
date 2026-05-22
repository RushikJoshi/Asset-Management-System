import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { addAsset, updateAsset, fetchAssetList } from "../store/slices/assetSlice";
import { useToast } from "../components/toast/toastStore";
import { getRequestFormSections, loadRequestFormConfig } from "../utils/assetFormBuilder";
import "./AddRequestPage.css";

export default function AddRequestPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { showToast } = useToast();
  const { user } = useSelector((state) => state.auth);
  const { assetListData } = useSelector((state) => state.assetList);
  
  const [formConfig] = useState(() => loadRequestFormConfig());
  const formSections = getRequestFormSections(formConfig);
  
  const [formData, setFormData] = useState({
    requestType: "Procurement",
    requestStatus: "Pending",
    managerApproval: "Pending",
    adminApproval: "Pending",
    purchaseStatus: "Pending"
  });

  useEffect(() => {
    dispatch(fetchAssetList());
  }, [dispatch]);

  useEffect(() => {
    if (isEditMode && assetListData.length > 0) {
      const existingItems = assetListData.filter(
        (item) => item.recordType === "REQUEST" && item.requestId === id
      );
      if (existingItems.length > 0) {
        const item = existingItems[0];
        
        let customFieldData = {};
        if (item.customFields) {
          Object.keys(item.customFields).forEach(key => {
            const fieldName = key.split('.')[1];
            if (fieldName) {
              const matchedField = formSections.flatMap(s => s.fields).find(f => f.label === fieldName);
              if (matchedField) {
                customFieldData[matchedField.name] = item.customFields[key];
              }
            }
          });
        }

        setFormData({
          ...item,
          ...customFieldData
        });
      }
    } else if (!isEditMode && user) {
      setFormData(prev => ({
        ...prev,
        requestedBy: user.name || user.username || "",
        employeeEmail: user.email || "",
      }));
    }
  }, [isEditMode, assetListData, id, user, formSections]);

  const handleChange = (e, field) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFieldVisible = (name) => formConfig[name]?.visible !== false;
  const isFieldRequired = (name) => formConfig[name]?.required === true;

  const generateReqId = () => {
    let maxNum = 100;
    assetListData.forEach((item) => {
      if (item.requestId) {
        const match = item.requestId.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (num > maxNum) maxNum = num;
        }
      }
    });
    return `Req-${maxNum + 1}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const missingRequired = [];
    formSections.forEach(section => {
      section.fields.forEach(field => {
        if (isFieldVisible(field.name) && isFieldRequired(field.name) && !formData[field.name]) {
          missingRequired.push(field.label);
        }
      });
    });

    if (missingRequired.length > 0) {
      showToast({
        title: "Missing Fields",
        message: `Please fill in required fields: ${missingRequired.join(", ")}`,
        type: "error"
      });
      return;
    }

    try {
      const customFields = {};
      formSections.forEach(section => {
        section.fields.forEach(field => {
          if (field.custom) {
            customFields[`${section.title}.${field.label}`] = formData[field.name] || "";
          }
        });
      });

      const payload = {
        ...formData,
        recordType: "REQUEST",
        customFields
      };

      if (!isEditMode) {
        payload.requestId = generateReqId();
        payload.requestDate = formData.requestDate || new Date().toISOString().split("T")[0];
        await dispatch(addAsset(payload)).unwrap();
        showToast({
          title: "Success",
          message: `Request created successfully.`,
          type: "success"
        });
      } else {
        await dispatch(updateAsset({ id: formData._id, payload })).unwrap();
        showToast({
          title: "Success",
          message: `Request updated successfully.`,
          type: "success"
        });
      }
      navigate("/requests");
    } catch (err) {
      showToast({
        title: "Error",
        message: err || "Unable to save request.",
        type: "error"
      });
    }
  };

  const renderField = (field) => {
    if (!isFieldVisible(field.name)) return null;

    const isSelect = ["requestPriority", "requestStatus", "managerApproval", "adminApproval", "purchaseStatus"].includes(field.name);
    const isTextArea = ["requestReason"].includes(field.name);
    const isDate = ["requestDate", "expectedReturn"].includes(field.name);

    return (
      <div className={`field-group ${isTextArea ? "full-width" : ""}`} key={field.name}>
        <label>
          {field.label} {isFieldRequired(field.name) && <span className="req-star">*</span>}
        </label>
        
        {isSelect ? (
          <select
            name={field.name}
            value={formData[field.name] || ""}
            onChange={(e) => handleChange(e, field)}
            required={isFieldRequired(field.name)}
          >
            <option value="">Select...</option>
            {field.name === "requestPriority" && (
              <>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </>
            )}
            {["requestStatus", "managerApproval", "adminApproval"].includes(field.name) && (
              <>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </>
            )}
            {field.name === "purchaseStatus" && (
              <>
                <option value="Pending">Pending</option>
                <option value="Ordered">Ordered</option>
                <option value="Received">Received</option>
                <option value="Completed">Completed</option>
              </>
            )}
          </select>
        ) : isTextArea ? (
          <textarea
            name={field.name}
            value={formData[field.name] || ""}
            onChange={(e) => handleChange(e, field)}
            placeholder={`Enter ${field.label}`}
            rows={3}
            required={isFieldRequired(field.name)}
          />
        ) : (
          <input
            type={isDate ? "date" : "text"}
            name={field.name}
            value={formData[field.name] || ""}
            onChange={(e) => handleChange(e, field)}
            placeholder={`e.g., ${field.label}`}
            required={isFieldRequired(field.name)}
          />
        )}
      </div>
    );
  };

  return (
    <div className="add-request-container">
      <div className="catalog-header-bar">
        <div className="catalog-title">
          <h2>{isEditMode ? "Edit Request" : "New Asset Request"}</h2>
        </div>
        <div className="header-actions">
          <button type="button" className="cancel-btn" onClick={() => navigate("/requests")}>
            Cancel
          </button>
          <button type="button" className="submit-btn" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {formSections.map((section, index) => {
          const visibleFields = section.fields.filter(f => isFieldVisible(f.name));
          if (visibleFields.length === 0) return null;

          return (
            <div className="dynamic-form-section" key={index}>
              <div className="section-header">
                <h3>{section.title}</h3>
                {section.description && <p>{section.description}</p>}
              </div>
              <div className="section-fields-grid">
                {section.fields.map(field => renderField(field))}
              </div>
            </div>
          );
        })}
      </form>
    </div>
  );
}
