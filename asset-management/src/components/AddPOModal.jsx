import React, { useEffect, useState } from "react";
import { FaTimes, FaPlus, FaTrash, FaCalculator, FaShippingFast } from "react-icons/fa";
import "./AddPOModal.css";
import { useToast } from "../components/toast/toastStore";
import apiInstance from "../apis/apiConfig";

function AddPOModal({ isOpen, onClose, onSuccess, vendor }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [shippingAddress, setShippingAddress] = useState({
    addressLine1: "Suite 404, Tech Park",
    addressLine2: "Gota",
    city: "Ahmedabad",
    state: "Gujarat",
  });

  const [products, setProducts] = useState([
    { productName: "", requestId: "", requiredQuantity: 1, unitCost: 0, cost: 0 },
  ]);

  const [subTotal, setSubTotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [netTotal, setNetTotal] = useState(0);

  // Fetch approved requests to populate dropdown or autocomplete
  useEffect(() => {
    const fetchApprovedRequests = async () => {
      try {
        const response = await apiInstance.get("/assets");
        if (response.data.success) {
          // Filter records where recordType === "REQUEST" and status is "Approved" or similar
          // In the system, requested assets are recordType: "REQUEST" and assetStatus can be checked
          const requests = (response.data.assets || []).filter(
            (asset) =>
              asset.recordType === "REQUEST" &&
              ["APPROVED", "APPROVED_BY_ADMIN"].includes(asset.assetStatus)
          );
          setApprovedRequests(requests);
        }
      } catch (err) {
        console.error("Error loading approved requests:", err);
      }
    };

    fetchApprovedRequests();
  }, []);

  // Update costs and totals whenever products array changes
  useEffect(() => {
    let sub = 0;
    const updated = products.map((item) => {
      const qty = Math.max(1, Number(item.requiredQuantity || 1));
      const price = Math.max(0, Number(item.unitCost || 0));
      const cost = qty * price;
      sub += cost;
      return { ...item, cost };
    });

    const calculatedTax = Math.round(sub * 0.18 * 100) / 100;
    const calculatedNet = sub + calculatedTax;

    setSubTotal(sub);
    setTax(calculatedTax);
    setNetTotal(calculatedNet);
  }, [products]);

  const handleAddRow = () => {
    setProducts([
      ...products,
      { productName: "", requestId: "", requiredQuantity: 1, unitCost: 0, cost: 0 },
    ]);
  };

  const handleRemoveRow = (index) => {
    if (products.length === 1) {
      showToast({
        title: "Row removal failed",
        message: "You must specify at least one product line item.",
        type: "warning",
      });
      return;
    }
    const updated = products.filter((_, idx) => idx !== index);
    setProducts(updated);
  };

  const handleRowChange = (index, field, value) => {
    const updated = [...products];
    
    if (field === "requestId" && value !== "") {
      // If a request is selected, auto-fill the product name
      const req = approvedRequests.find((r) => r.assetCode === value || r._id === value);
      if (req) {
        updated[index].productName = req.assetName;
        updated[index].requestId = req.assetCode || req._id;
        updated[index].unitCost = req.price || 0;
      } else {
        updated[index][field] = value;
      }
    } else {
      updated[index][field] = value;
    }
    
    setProducts(updated);
  };

  const handleAddressChange = (field, value) => {
    setShippingAddress({
      ...shippingAddress,
      [field]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.state) {
      showToast({
        title: "Validation error",
        message: "Shipping Address details are required.",
        type: "error",
      });
      return;
    }

    for (let index = 0; index < products.length; index++) {
      const item = products[index];
      if (!item.productName.trim()) {
        showToast({
          title: "Validation error",
          message: `Product name is missing in row ${index + 1}.`,
          type: "error",
        });
        return;
      }
      if (Number(item.unitCost) <= 0) {
        showToast({
          title: "Validation error",
          message: `Unit cost must be greater than zero in row ${index + 1}.`,
          type: "error",
        });
        return;
      }
    }

    setLoading(true);

    try {
      const response = await apiInstance.post("/purchase-orders", {
        vendor: {
          orgName: vendor.orgName,
          contactPerson: vendor.contactPerson,
          email: vendor.email,
          phone: vendor.phone,
        },
        shippingAddress,
        products,
        taxPercent: 18,
      });

      if (response.data.success) {
        showToast({
          title: "Purchase Order Raised",
          message: `Successfully created ${response.data.purchaseOrder.poNumber}.`,
          type: "success",
        });
        onSuccess();
      } else {
        showToast({
          title: "Error creating PO",
          message: response.data.message || "Failed to create Purchase Order.",
          type: "error",
        });
      }
    } catch (error) {
      showToast({
        title: "Connection error",
        message: "Failed to connect to the backend server.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="add-po-overlay">
      <div className="add-po-modal-container">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="header-title">
            <span className="kicker-tag">Raising Purchase Order</span>
            <h2>Create PO Request</h2>
          </div>
          <button className="close-x-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="po-form-layout">
          {/* Main Form content */}
          <div className="po-form-main">
            {/* Vendor Profile card */}
            <div className="form-card vendor-profile-info">
              <div className="card-header">
                <h3>Vendor Profile</h3>
              </div>
              <div className="vendor-info-summary">
                <div className="info-badge" style={{ backgroundColor: vendor.logoColor }}>
                  {vendor.logoText}
                </div>
                <div className="info-grid">
                  <div className="item">
                    <span>Company:</span>
                    <strong>{vendor.orgName}</strong>
                  </div>
                  <div className="item">
                    <span>Contact Person:</span>
                    <strong>{vendor.contactPerson}</strong>
                  </div>
                  <div className="item">
                    <span>Email:</span>
                    <strong>{vendor.email}</strong>
                  </div>
                  <div className="item">
                    <span>Phone:</span>
                    <strong>{vendor.phone}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Destination */}
            <div className="form-card shipping-info-card">
              <div className="card-header">
                <h3><FaShippingFast className="header-icon" /> Shipping Location</h3>
              </div>
              <div className="address-inputs-grid">
                <div className="form-group span-2">
                  <label>Address Line 1 *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter main building, office name, suite, etc."
                    value={shippingAddress.addressLine1}
                    onChange={(e) => handleAddressChange("addressLine1", e.target.value)}
                  />
                </div>
                <div className="form-group span-2">
                  <label>Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    placeholder="Area, block, lane description..."
                    value={shippingAddress.addressLine2}
                    onChange={(e) => handleAddressChange("addressLine2", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>City / District *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ahmedabad"
                    value={shippingAddress.city}
                    onChange={(e) => handleAddressChange("city", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>State / Province *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gujarat"
                    value={shippingAddress.state}
                    onChange={(e) => handleAddressChange("state", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Products Line Items */}
            <div className="form-card line-items-card">
              <div className="card-header items-header">
                <h3>Product Specifications</h3>
                <button
                  type="button"
                  className="add-row-btn"
                  onClick={handleAddRow}
                >
                  <FaPlus /> Add Line Item
                </button>
              </div>

              <div className="line-items-table-wrapper">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th style={{ width: "30%" }}>Product Name *</th>
                      <th style={{ width: "25%" }}>Link Request ID</th>
                      <th style={{ width: "15%" }}>Quantity *</th>
                      <th style={{ width: "15%" }}>Unit Cost (₹) *</th>
                      <th style={{ width: "15%" }}>Total (₹)</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((item, index) => (
                      <tr key={index} className="item-row">
                        <td>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Apple iMac 24"
                            className="table-input"
                            value={item.productName}
                            onChange={(e) => handleRowChange(index, "productName", e.target.value)}
                          />
                        </td>
                        <td>
                          <select
                            className="table-input select-input"
                            value={item.requestId}
                            onChange={(e) => handleRowChange(index, "requestId", e.target.value)}
                          >
                            <option value="">-- Direct Buy --</option>
                            {approvedRequests.map((req) => (
                              <option key={req._id} value={req.assetCode || req._id}>
                                {req.assetName} ({req.assetCode || "Req"})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="1"
                            className="table-input center-align"
                            value={item.requiredQuantity}
                            onChange={(e) => handleRowChange(index, "requiredQuantity", e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            required
                            min="0"
                            placeholder="0"
                            className="table-input"
                            value={item.unitCost}
                            onChange={(e) => handleRowChange(index, "unitCost", e.target.value)}
                          />
                        </td>
                        <td>
                          <span className="row-total-label">
                            ₹{(item.cost || 0).toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="remove-row-btn"
                            onClick={() => handleRemoveRow(index)}
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pricing Summary Sidebar */}
          <div className="po-form-sidebar">
            <div className="form-card summary-card">
              <div className="card-header">
                <h3><FaCalculator /> Cost Summary</h3>
              </div>
              <div className="summary-list">
                <div className="summary-row">
                  <span>Sub Total:</span>
                  <strong>₹{subTotal.toLocaleString("en-IN")}</strong>
                </div>
                <div className="summary-row">
                  <span>Tax GST (18%):</span>
                  <strong>₹{tax.toLocaleString("en-IN")}</strong>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row net-total-row">
                  <span>Net Total:</span>
                  <strong>₹{netTotal.toLocaleString("en-IN")}</strong>
                </div>
              </div>

              <div className="sidebar-buttons">
                <button
                  type="submit"
                  disabled={loading}
                  className={`confirm-submit-btn ${loading ? "btn-loading" : ""}`}
                >
                  {loading ? "Raising PO..." : "Raise Purchase Order"}
                </button>
                <button
                  type="button"
                  className="cancel-form-btn"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddPOModal;
