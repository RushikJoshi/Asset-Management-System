import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaShoppingCart, FaPlus, FaSearch, FaClipboardList, FaFileInvoice, FaEye, FaCalendarAlt, FaUser } from "react-icons/fa";
import { motion } from "framer-motion";
import moment from "moment";
import "./Procurements.css";
import AddPOModal from "../components/AddPOModal";
import { useToast } from "../components/toast/toastStore";
import apiInstance from "../apis/apiConfig";

const VENDORS = [
  {
    orgName: "Luna",
    contactPerson: "Luna Lovegood",
    email: "contact@luna-it.com",
    phone: "+91-9988776611",
    logoColor: "#14B8A6",
    logoText: "L",
  },
  {
    orgName: "Zylker",
    contactPerson: "Zack Rider",
    email: "info@zylker.com",
    phone: "+91-9090909090",
    logoColor: "#6366F1",
    logoText: "Z",
  },
  {
    orgName: "NetApp Inc",
    contactPerson: "Nathan Drake",
    email: "support@netapp.com",
    phone: "+91-8888777766",
    logoColor: "#3B82F6",
    logoText: "N",
  },
];

function Procurements() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("purchase-orders"); // Default to show purchase orders
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  // Invoices tab state variables
  const [invoices, setInvoices] = useState([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [searchInvoiceQuery, setSearchInvoiceQuery] = useState("");
  const [invoiceDateFilter, setInvoiceDateFilter] = useState("");

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const response = await apiInstance.get("/purchase-orders", {
        params: {
          status: statusFilter,
          search: searchQuery,
        },
      });
      if (response.data.success) {
        setPurchaseOrders(response.data.purchaseOrders || []);
      } else {
        showToast({
          title: "Error fetching data",
          message: response.data.message || "Something went wrong",
          type: "error",
        });
      }
    } catch (error) {
      showToast({
        title: "Connection error",
        message: error.response?.data?.message || "Failed to connect to backend api",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    setInvoiceLoading(true);
    try {
      const response = await apiInstance.get("/invoices", {
        params: {
          search: searchInvoiceQuery,
          date: invoiceDateFilter,
        },
      });
      if (response.data.success) {
        setInvoices(response.data.invoices || []);
      } else {
        showToast({
          title: "Error fetching invoices",
          message: response.data.message || "Something went wrong",
          type: "error",
        });
      }
    } catch (error) {
      showToast({
        title: "Connection error",
        message: error.response?.data?.message || "Failed to connect to backend api",
        type: "error",
      });
    } finally {
      setInvoiceLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    if (activeTab === "invoices") {
      fetchInvoices();
    }
  }, [activeTab, searchInvoiceQuery, invoiceDateFilter]);

  const handlePoClick = async (poNumber) => {
    try {
      const formattedPo = poNumber.trim();
      const response = await apiInstance.get("/purchase-orders", {
        params: {
          search: formattedPo,
        },
      });
      if (response.data.success && response.data.purchaseOrders && response.data.purchaseOrders.length > 0) {
        const matchedPo = response.data.purchaseOrders.find(
          (po) => po.poNumber.toLowerCase() === formattedPo.toLowerCase()
        ) || response.data.purchaseOrders[0];
        navigate(`/procurements/${matchedPo._id}`);
      } else {
        showToast({
          title: "Not Found",
          message: `Purchase Order ${poNumber} not found`,
          type: "warning",
        });
      }
    } catch (error) {
      showToast({
        title: "Error",
        message: error.response?.data?.message || "Failed to navigate to Purchase Order",
        type: "error",
      });
    }
  };

  const handleOpenAddPO = (vendor) => {
    setSelectedVendor(vendor);
    setIsAddModalOpen(true);
  };

  const handlePOSuccess = () => {
    setIsAddModalOpen(false);
    setSelectedVendor(null);
    setActiveTab("purchase-orders");
    fetchPOs();
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "PO Raised":
        return "po-status-raised";
      case "Partially Received":
        return "po-status-partial";
      case "Received":
        return "po-status-received";
      default:
        return "po-status-unknown";
    }
  };

  return (
    <div className="app-container procurements-page">
      <div className="procurement-header-banner">
        <div className="banner-left">
          <h1>Procurements & Purchase Orders</h1>
          <p>Request assets, raise official purchase orders, and track fulfillment cycles dynamically.</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="procurement-tabs">
        <button
          className={`tab-btn ${activeTab === "purchase-orders" ? "active" : ""}`}
          onClick={() => setActiveTab("purchase-orders")}
        >
          <FaClipboardList /> Purchase Orders
        </button>
        <button
          className={`tab-btn ${activeTab === "raise-po" ? "active" : ""}`}
          onClick={() => setActiveTab("raise-po")}
        >
          <FaPlus /> Raise PO (Vendors)
        </button>
        <button
          className={`tab-btn ${activeTab === "invoices" ? "active" : ""}`}
          onClick={() => setActiveTab("invoices")}
        >
          <FaFileInvoice /> Invoices (Docs)
        </button>
      </div>

      <div className="tab-content-wrapper">
        {/* PURCHASE ORDERS TAB */}
        {activeTab === "purchase-orders" && (
          <div className="tab-pane">
            <div className="procurement-filters-row">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search PO number, vendor, item or creator..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="filter-box">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="po-status-dropdown"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PO Raised">PO Raised</option>
                  <option value="Partially Received">Partially Received</option>
                  <option value="Received">Received</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="procurement-loading">
                <div className="spinner"></div>
                <p>Loading Purchase Orders...</p>
              </div>
            ) : purchaseOrders.length > 0 ? (
              <div className="table-wrapper">
                <table className="asset-table procurement-table">
                  <thead>
                    <tr>
                      <th>PO Number</th>
                      <th>PO Date</th>
                      <th>Raised By</th>
                      <th>Vendor</th>
                      <th>Product Details</th>
                      <th>Net Total</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrders.map((po) => (
                      <tr key={po._id} className="po-table-row">
                        <td>
                          <button
                            className="po-num-link"
                            onClick={() => navigate(`/procurements/${po._id}`)}
                          >
                            {po.poNumber}
                          </button>
                        </td>
                        <td>
                          <div className="date-field">
                            <FaCalendarAlt className="field-icon" />
                            {moment(po.purchaseOrderDate).format("DD-MM-YYYY")}
                          </div>
                        </td>
                        <td>
                          <div className="creator-field">
                            <FaUser className="field-icon" />
                            {po.raisedBy}
                          </div>
                        </td>
                        <td>
                          <span className="po-vendor-tag">{po.vendor.orgName}</span>
                        </td>
                        <td className="product-details-cell">
                          {po.products.map((p, idx) => (
                            <div key={idx} className="product-item-summary">
                              <strong>{p.productName}</strong> x {p.requiredQuantity}{" "}
                              {p.requestId && <span className="req-link-tag">({p.requestId})</span>}
                            </div>
                          ))}
                        </td>
                        <td>
                          <strong className="po-net-total">₹{po.netTotal.toLocaleString("en-IN")}</strong>
                        </td>
                        <td>
                          <span className={`asset-status-pill ${getStatusClass(po.status)}`}>
                            {po.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="view-btn"
                              title="View Summary details"
                              onClick={() => navigate(`/procurements/${po._id}`)}
                            >
                              <FaEye />
                            </button>
                            <button
                              className="create-invoice-disabled-btn"
                              title="Create Invoice (Layout details pending)"
                              disabled
                            >
                              + Invoice
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="procurement-empty-state">
                <h3>No Purchase Orders Found</h3>
                <p>Could not find any PO records matching your query or filters. Click "Raise PO" tab to add a new one.</p>
                <button className="add-btn mt-3" onClick={() => setActiveTab("raise-po")}>
                  Go to Raise PO
                </button>
              </div>
            )}
          </div>
        )}

        {/* RAISE PO TAB */}
        {activeTab === "raise-po" && (
          <div className="tab-pane">
            <h2 className="section-title">Select Vendor to Raise PO</h2>
            <p className="section-subtitle">Choose an authorized merchant below to launch the purchase order creation catalog.</p>

            <div className="vendor-cards-grid">
              {VENDORS.map((vendor, index) => (
                <motion.div
                  className="vendor-card"
                  key={index}
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="vendor-card-header">
                    <div
                      className="vendor-logo-avatar"
                      style={{ backgroundColor: vendor.logoColor }}
                    >
                      {vendor.logoText}
                    </div>
                    <div className="vendor-title-block">
                      <h3>{vendor.orgName}</h3>
                      <span className="vendor-type-tag">Verified Vendor</span>
                    </div>
                  </div>
                  <div className="vendor-card-body">
                    <div className="info-row">
                      <span>Contact Name:</span>
                      <strong>{vendor.contactPerson}</strong>
                    </div>
                    <div className="info-row">
                      <span>Email Address:</span>
                      <strong>{vendor.email}</strong>
                    </div>
                    <div className="info-row">
                      <span>Phone Number:</span>
                      <strong>{vendor.phone}</strong>
                    </div>
                  </div>
                  <div className="vendor-card-footer">
                    <button
                      className="add-btn raise-po-btn"
                      onClick={() => handleOpenAddPO(vendor)}
                      style={{ backgroundColor: "#2563eb", color: "#ffffff", border: "none" }}
                    >
                      Raise Purchase Order
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* INVOICES TAB */}
        {activeTab === "invoices" && (
          <div className="tab-pane">
            <div className="procurement-filters-row invoice-filters-row">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search Invoice No, PO, procurer, or product details..."
                  value={searchInvoiceQuery}
                  onChange={(e) => setSearchInvoiceQuery(e.target.value)}
                />
              </div>
              <div className="invoice-date-filter-wrapper">
                <span className="filter-label">Filter By:</span>
                <div className="date-input-container">
                  <input
                    type="date"
                    className="invoice-date-input"
                    value={invoiceDateFilter}
                    onChange={(e) => setInvoiceDateFilter(e.target.value)}
                  />
                  {invoiceDateFilter && (
                    <button
                      className="clear-date-btn"
                      onClick={() => setInvoiceDateFilter("")}
                      title="Clear Date Filter"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>

            {invoiceLoading ? (
              <div className="procurement-loading">
                <div className="spinner"></div>
                <p>Loading Invoices...</p>
              </div>
            ) : invoices.length > 0 ? (
              <div className="table-wrapper">
                <table className="asset-table procurement-table invoice-table">
                  <thead>
                    <tr>
                      <th>Invoice No</th>
                      <th>Invoice Date</th>
                      <th>Product Details</th>
                      <th>Purchase Order</th>
                      <th>Purchase Order Date</th>
                      <th>Procurer</th>
                      <th>Total Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice._id} className="po-table-row">
                        <td>
                          <strong>{invoice.invoiceNo}</strong>
                        </td>
                        <td>
                          <div className="date-field">
                            <FaCalendarAlt className="field-icon" />
                            {moment(invoice.invoiceDate).format("DD-MMM-YY")}
                          </div>
                        </td>
                        <td className="product-details-cell invoice-product-details-cell">
                          {invoice.products.map((p, idx) => (
                            <div key={idx} className="product-item-summary invoice-product-item">
                              {p.brand} | {p.model} | {p.quantity} | {p.unit}
                            </div>
                          ))}
                        </td>
                        <td>
                          <button
                            className="po-num-link"
                            onClick={() => handlePoClick(invoice.poNumber)}
                          >
                            {invoice.poNumber ? invoice.poNumber.replace("-", " - ") : ""}
                          </button>
                        </td>
                        <td>
                          <div className="date-field">
                            <FaCalendarAlt className="field-icon" />
                            {moment(invoice.purchaseOrderDate).format("DD-MMM-YY")}
                          </div>
                        </td>
                        <td>
                          <div className="creator-field">
                            <FaUser className="field-icon" />
                            {invoice.procurer}
                          </div>
                        </td>
                        <td>
                          <strong className="po-net-total">
                            ₹ {invoice.totalCost.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="procurement-empty-state">
                <h3>No Invoices Found</h3>
                <p>Could not find any invoice records matching your query or date filter.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <AddPOModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setSelectedVendor(null);
          }}
          onSuccess={handlePOSuccess}
          vendor={selectedVendor}
        />
      )}
    </div>
  );
}

export default Procurements;
