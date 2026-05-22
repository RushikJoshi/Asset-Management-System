import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaChevronLeft, FaPrint, FaFilePdf, FaShoppingCart, FaTruck, FaFileInvoiceDollar, FaCalendarAlt, FaUser } from "react-icons/fa";
import moment from "moment";
import "./POSummary.css";
import { useToast } from "../components/toast/toastStore";
import apiInstance from "../apis/apiConfig";

function POSummary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPoDetails = async () => {
      try {
        const response = await apiInstance.get(`/purchase-orders/${id}`);
        if (response.data.success) {
          setPo(response.data.purchaseOrder);
        } else {
          showToast({
            title: "Data error",
            message: response.data.message || "Failed to load Purchase Order details.",
            type: "error",
          });
        }
      } catch (error) {
        showToast({
          title: "Connection error",
          message: error.response?.data?.message || "Failed to connect to the backend server.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPoDetails();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // Elegant native print trigger as a reliable PDF export option
    showToast({
      title: "PDF Exporter",
      message: "Please choose 'Save as PDF' in the destination options.",
      type: "info",
    });
    window.print();
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

  if (loading) {
    return (
      <div className="po-summary-loading">
        <div className="spinner"></div>
        <p>Loading Purchase Order Details...</p>
      </div>
    );
  }

  if (!po) {
    return (
      <div className="po-summary-error">
        <h2>Purchase Order Not Found</h2>
        <p>We couldn't retrieve details for this PO record. It may have been deleted or moved.</p>
        <button className="add-btn mt-3" onClick={() => navigate("/procurements")}>
          <FaChevronLeft /> Back to Procurements
        </button>
      </div>
    );
  }

  return (
    <div className="app-container po-summary-page">
      {/* Top Header Actions (Hidden in Print) */}
      <div className="summary-actions-bar">
        <button className="back-breadcrumb-btn" onClick={() => navigate("/procurements")}>
          <FaChevronLeft /> Back to Procurements
        </button>
        <div className="action-buttons-group">
          <button className="action-print-btn" onClick={handlePrint}>
            <FaPrint /> Print PO
          </button>
          <button className="action-pdf-btn" onClick={handleExportPDF}>
            <FaFilePdf /> Save as PDF
          </button>
        </div>
      </div>

      {/* Main Printable Purchase Order Document */}
      <div className="po-document-sheet" id="printable-po-document">
        {/* Document Header */}
        <div className="doc-header-row">
          <div className="brand-logo-section">
            <div className="brand-badge">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="#0D9488"/>
                <path d="M16 7C11.0294 7 7 11.0294 7 16C7 20.9706 11.0294 25 16 25C20.9706 25 25 20.9706 25 16C25 13.5 24 11.2 22 9.7M16 11C13.2386 11 11 13.2386 11 16C11 18.7614 13.2386 21 16 21C18.7614 21 21 18.7614 21 16" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="brand-text">
              <h2>AssetPro</h2>
              <span>Lifecycle ERP Procurement</span>
            </div>
          </div>
          <div className="doc-meta-section">
            <h1>PURCHASE ORDER</h1>
            <div className="po-badge-number">{po.poNumber}</div>
          </div>
        </div>

        {/* Timeline & Creator Stats */}
        <div className="po-info-bar">
          <div className="info-stat">
            <FaCalendarAlt className="icon" />
            <div className="details">
              <span>Order Date</span>
              <strong>{moment(po.purchaseOrderDate).format("MMMM DD, YYYY")}</strong>
            </div>
          </div>
          <div className="info-stat">
            <FaUser className="icon" />
            <div className="details">
              <span>Raised By</span>
              <strong>{po.raisedBy}</strong>
            </div>
          </div>
          <div className="info-stat">
            <FaShoppingCart className="icon" />
            <div className="details">
              <span>Order Status</span>
              <strong className={`asset-status-pill ${getStatusClass(po.status)}`}>
                {po.status}
              </strong>
            </div>
          </div>
        </div>

        {/* Shipping & Vendor Dual grid */}
        <div className="doc-details-grid">
          {/* Vendor Panel */}
          <div className="details-card-box">
            <div className="card-title-header">
              <h3><FaFileInvoiceDollar className="icon" /> Vendor profile Details</h3>
            </div>
            <div className="card-info-content">
              <div className="info-item">
                <span className="label">Company Name:</span>
                <span className="value bold-val">{po.vendor.orgName}</span>
              </div>
              {po.vendor.contactPerson && (
                <div className="info-item">
                  <span className="label">Contact Person:</span>
                  <span className="value">{po.vendor.contactPerson}</span>
                </div>
              )}
              {po.vendor.email && (
                <div className="info-item">
                  <span className="label">Email Address:</span>
                  <span className="value">{po.vendor.email}</span>
                </div>
              )}
              {po.vendor.phone && (
                <div className="info-item">
                  <span className="label">Phone Number:</span>
                  <span className="value">{po.vendor.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Panel */}
          <div className="details-card-box">
            <div className="card-title-header">
              <h3><FaTruck className="icon" /> Shipping Location</h3>
            </div>
            <div className="card-info-content">
              <div className="info-item">
                <span className="label">Address Line 1:</span>
                <span className="value">{po.shippingAddress.addressLine1}</span>
              </div>
              {po.shippingAddress.addressLine2 && (
                <div className="info-item">
                  <span className="label">Address Line 2:</span>
                  <span className="value">{po.shippingAddress.addressLine2}</span>
                </div>
              )}
              <div className="info-item">
                <span className="label">City / District:</span>
                <span className="value">{po.shippingAddress.city}</span>
              </div>
              <div className="info-item">
                <span className="label">State / Province:</span>
                <span className="value">{po.shippingAddress.state}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Items Table */}
        <div className="doc-items-table-wrapper">
          <table className="doc-items-table">
            <thead>
              <tr>
                <th style={{ width: "8%" }}>S.No</th>
                <th style={{ width: "37%" }}>Product Description</th>
                <th style={{ width: "20%" }}>Request ID</th>
                <th style={{ width: "10%", textAlign: "center" }}>Qty</th>
                <th style={{ width: "12%", textAlign: "right" }}>Unit Cost (₹)</th>
                <th style={{ width: "13%", textAlign: "right" }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {po.products.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="table-product-name">{item.productName}</div>
                  </td>
                  <td>
                    {item.requestId ? (
                      <span className="table-req-badge">{item.requestId}</span>
                    ) : (
                      <span className="table-direct-label">Direct Procurement</span>
                    )}
                  </td>
                  <td style={{ textAlign: "center" }}>{item.requiredQuantity}</td>
                  <td style={{ textAlign: "right" }}>₹{item.unitCost.toLocaleString("en-IN")}</td>
                  <td style={{ textAlign: "right", fontWeight: "700" }}>
                    ₹{(item.cost || item.requiredQuantity * item.unitCost).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial calculations */}
        <div className="doc-totals-section">
          <div className="totals-box-panel">
            <div className="totals-row">
              <span>Sub Total:</span>
              <strong>₹{po.subTotal.toLocaleString("en-IN")}</strong>
            </div>
            <div className="totals-row">
              <span>GST Tax (18%):</span>
              <strong>₹{po.tax.toLocaleString("en-IN")}</strong>
            </div>
            <div className="totals-divider"></div>
            <div className="totals-row net-total-highlight">
              <span>Net Total Amount:</span>
              <strong>₹{po.netTotal.toLocaleString("en-IN")}</strong>
            </div>
          </div>
        </div>

        {/* Document Footer */}
        <div className="doc-footer-legal">
          <div className="signature-area">
            <div className="sig-line"></div>
            <span>Authorized Signature</span>
          </div>
          <div className="legal-notes">
            <p><strong>Notes:</strong> This is a computer-generated Purchase Order and does not require a physical stamp. Please include the PO Number in all corresponding shipping boxes and invoice sheets.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default POSummary;
