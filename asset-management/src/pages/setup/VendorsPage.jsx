import { useState } from "react";
import { PageTitle, KpiGrid, DataTable } from "../../components/common/ModuleComponents";
import { FaBuilding, FaUser, FaPhone, FaMapMarkerAlt, FaPlus, FaArrowLeft, FaBoxes, FaEnvelope, FaLaptop, FaExternalLinkAlt, FaTrash, FaSearch } from "react-icons/fa";

export default function VendorsPage() {
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Seeded mock vendors list
  const [vendors, setVendors] = useState([
    {
      id: "VND001",
      name: "Zylker Technologies",
      contact: "Lucas Samuel",
      email: "lucas.s@zylker.com",
      phone: "+1 (555) 234-5678",
      address: "102 Silicon Valley Blvd, San Jose, CA",
      reliability: "High",
      totalOrders: 15,
      suppliedAssets: [
        { id: "AST-CAN-3003", name: "Demo Canon Printer", category: "Printer", serialNo: "DEMO-CAN-3003", status: "Available", addedOn: "Dec 2, 2023" },
        { id: "AST-HP-2002", name: "Demo HP Monitor", category: "Monitor", serialNo: "DEMO-HP-2002", status: "Under Repair", addedOn: "Sep 7, 2024" },
        { id: "AST-APL-8001", name: "Apple MacBook Pro M3", category: "Laptop", serialNo: "APL-MBP-M3-99", status: "Assigned", addedOn: "Jan 12, 2026" },
      ]
    },
    {
      id: "VND002",
      name: "Luna Enterprises",
      contact: "Sarah Jenkins",
      email: "sarah.j@lunaent.com",
      phone: "+1 (555) 876-5432",
      address: "74 Broadway Ave, New York, NY",
      reliability: "Premium",
      totalOrders: 28,
      suppliedAssets: [
        { id: "AST-SAM-24", name: "Samsung S24 Ultra", category: "Mobile Phone", serialNo: "SAM-S24U-777", status: "Available", addedOn: "Mar 10, 2026" },
        { id: "AST-APL-16", name: "iPhone 16 Pro Max", category: "Mobile Phone", serialNo: "APL-IP16P-44", status: "Assigned", addedOn: "May 2, 2026" },
      ]
    },
    {
      id: "VND003",
      name: "Apex Office Supplies",
      contact: "Michael Chang",
      email: "m.chang@apexoffice.com",
      phone: "+1 (555) 456-7890",
      address: "442 industrial Parkway, Austin, TX",
      reliability: "Medium",
      totalOrders: 8,
      suppliedAssets: [
        { id: "AST-FUR-50", name: "Ergonomic Office Chair", category: "Furniture", serialNo: "ERG-CHR-501", status: "Available", addedOn: "Feb 18, 2025" },
        { id: "AST-FUR-88", name: "Executive Standing Desk", category: "Furniture", serialNo: "EXE-DSK-881", status: "Available", addedOn: "Apr 5, 2025" },
      ]
    }
  ]);

  // Form State for Adding New Vendor
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    email: "",
    phone: "",
    address: "",
    reliability: "High"
  });
  const [formError, setFormError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddVendor = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.contact.trim() || !formData.email.trim()) {
      setFormError("Please fill in the vendor name, contact person, and email.");
      return;
    }

    const newVendor = {
      id: `VND00${vendors.length + 1}`,
      name: formData.name,
      contact: formData.contact,
      email: formData.email,
      phone: formData.phone || "N/A",
      address: formData.address || "N/A",
      reliability: formData.reliability,
      totalOrders: 0,
      suppliedAssets: []
    };

    setVendors((prev) => [...prev, newVendor]);
    setShowAddModal(false);
    setFormData({ name: "", contact: "", email: "", phone: "", address: "", reliability: "High" });
    setFormError("");

    setToastMessage(`Vendor ${newVendor.name} added successfully!`);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // Filter vendors by search
  const filteredVendors = vendors.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Kpis
  const kpis = [
    { label: "Active Vendors", value: vendors.length },
    { label: "Total Asset Supplies", value: vendors.reduce((acc, curr) => acc + curr.suppliedAssets.length, 0) },
    { label: "Top Supplier", value: vendors.length ? vendors.reduce((prev, current) => (prev.totalOrders > current.totalOrders) ? prev : current).name.split(" ")[0] : "None" },
    { label: "Premium Tier", value: vendors.filter(v => v.reliability === "Premium").length }
  ];

  const vendorColumns = [
    {
      key: "name",
      label: "Vendor Name",
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "6px",
            backgroundColor: "#F0FDFA",
            border: "1px solid #CCFBF1",
            color: "#0D9488",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <FaBuilding style={{ fontSize: "14px" }} />
          </div>
          <div>
            <strong style={{ color: "var(--text-main)", fontSize: "14px" }}>{row.name}</strong>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>ID: {row.id}</div>
          </div>
        </div>
      )
    },
    {
      key: "contact",
      label: "Contact Person",
      render: (row) => (
        <div>
          <div style={{ fontWeight: "550", color: "#334155" }}>{row.contact}</div>
          <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>{row.email}</div>
        </div>
      )
    },
    {
      key: "phone",
      label: "Phone",
      render: (row) => <span style={{ color: "#475569" }}>{row.phone}</span>
    },
    {
      key: "reliability",
      label: "Tier / Reliability",
      render: (row) => (
        <span style={{
          display: "inline-flex",
          padding: "3px 8px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: "600",
          backgroundColor: row.reliability === "Premium" ? "#ECEFFE" : row.reliability === "High" ? "#E0F2FE" : "#F1F5F9",
          color: row.reliability === "Premium" ? "#4F46E5" : row.reliability === "High" ? "#0369A1" : "#475569"
        }}>
          {row.reliability}
        </span>
      )
    },
    {
      key: "totalOrders",
      label: "Total Orders",
      render: (row) => <span style={{ fontWeight: "600" }}>{row.totalOrders} items</span>
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <button
          className="module-button"
          onClick={() => setSelectedVendor(row)}
          style={{ height: "26px", fontSize: "11px", padding: "0 10px", display: "inline-flex", alignItems: "center", gap: "4px" }}
        >
          View Portfolio <FaExternalLinkAlt style={{ fontSize: "9px" }} />
        </button>
      )
    }
  ];

  const suppliedAssetColumns = [
    {
      key: "name",
      label: "Asset Name",
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FaLaptop style={{ color: "#0D9488" }} />
          <strong style={{ color: "var(--text-main)" }}>{row.name}</strong>
        </div>
      )
    },
    {
      key: "serialNo",
      label: "Serial No",
      render: (row) => <code style={{ backgroundColor: "#F1F5F9", padding: "2px 6px", borderRadius: "4px", fontSize: "12px" }}>{row.serialNo}</code>
    },
    {
      key: "category",
      label: "Category",
      render: (row) => <span style={{ color: "#475569" }}>{row.category}</span>
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span style={{
          padding: "2px 6px",
          borderRadius: "4px",
          fontSize: "11px",
          fontWeight: "600",
          backgroundColor: row.status === "Available" ? "#ECFDF5" : row.status === "Under Repair" ? "#FEF3C7" : "#EFF6FF",
          color: row.status === "Available" ? "#047857" : row.status === "Under Repair" ? "#B45309" : "#1D4ED8"
        }}>
          {row.status}
        </span>
      )
    },
    {
      key: "addedOn",
      label: "Added On",
      render: (row) => <span style={{ color: "var(--text-muted)" }}>{row.addedOn}</span>
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "32px" }}>
      {/* If a vendor is selected, display the high-fidelity Detail View */}
      {selectedVendor ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => setSelectedVendor(null)}
              className="secondary-button"
              style={{ display: "flex", alignItems: "center", gap: "6px", height: "36px" }}
            >
              <FaArrowLeft /> Back to Vendors List
            </button>
            <h2 style={{ fontSize: "20px", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>
              {selectedVendor.name} Portfolio
            </h2>
          </div>

          {/* High Fidelity Vendor Card */}
          <div className="action-panel" style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "24px",
            padding: "24px",
            borderRadius: "var(--radius-lg)"
          }}>
            <h3 style={{ fontSize: "16px", color: "var(--color-primary)", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
              Vendor Specifications
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", gridColumn: "1 / -1" }}></div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <FaUser style={{ color: "#0D9488", marginTop: "4px" }} />
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Contact Person</span>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-main)" }}>{selectedVendor.contact}</div>
                <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>{selectedVendor.email}</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <FaPhone style={{ color: "#0D9488", marginTop: "4px" }} />
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Contact Number</span>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-main)" }}>{selectedVendor.phone}</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <FaMapMarkerAlt style={{ color: "#0D9488", marginTop: "4px" }} />
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Corporate Address</span>
                <div style={{ fontSize: "13.5px", fontWeight: "600", color: "var(--text-main)" }}>{selectedVendor.address}</div>
              </div>
            </div>
          </div>

          {/* Associated Stock Table */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyBetween: "true", gap: "8px" }}>
              <FaBoxes style={{ color: "#0d9488" }} />
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Assets Supplied by Vendor</h3>
            </div>
            <DataTable
              columns={suppliedAssetColumns}
              rows={selectedVendor.suppliedAssets}
              emptyText="This vendor hasn't supplied any corporate assets yet."
            />
          </div>
        </div>
      ) : (
        <>
          {/* Main Vendor List View */}
          <PageTitle
            action={
              <button
                className="module-button"
                onClick={() => setShowAddModal(true)}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <FaPlus /> Add Vendor
              </button>
            }
          />

          {toastMessage && (
            <div style={{
              backgroundColor: "#ECFDF5",
              border: "1px solid #10B981",
              color: "#047857",
              padding: "12px 16px",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "14px"
            }}>
              {toastMessage}
            </div>
          )}

          <KpiGrid items={kpis} />

          {/* Filter Bar */}
          <div className="action-panel" style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            padding: "16px",
            borderRadius: "var(--radius-lg)"
          }}>
            <h3 style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)" }}>Search Vendors</h3>
            <div style={{ position: "relative", marginTop: "6px" }}>
              <input
                type="text"
                placeholder="Search by vendor name, contact person or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", paddingLeft: "36px" }}
              />
              <FaSearch style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)"
              }} />
            </div>
          </div>

          {/* DataTable */}
          <DataTable
            columns={vendorColumns}
            rows={filteredVendors}
            emptyText="No vendors registered in the directory matching filters."
          />
        </>
      )}

      {/* Add Vendor Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "480px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            border: "1px solid var(--border-color)",
            overflow: "hidden"
          }}>
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--border-color)",
              background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
              display: "flex",
              justifyContent: "between",
              alignItems: "center"
            }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "var(--text-main)" }}>Register Corporate Vendor</h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-muted)" }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddVendor} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {formError && (
                <div style={{ color: "#B91C1C", backgroundColor: "#FEF2F2", padding: "10px", borderRadius: "6px", fontSize: "13px", fontWeight: "600" }}>
                  {formError}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Vendor / Company Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Dell Global, Microsoft India"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Contact Agent Name</label>
                  <input
                    type="text"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    placeholder="e.g. Sarah Connor"
                    required
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Reliability Tier</label>
                  <select name="reliability" value={formData.reliability} onChange={handleInputChange}>
                    <option value="Premium">Premium Tier</option>
                    <option value="High">High Reliability</option>
                    <option value="Medium">Medium Reliability</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g. sales@vendor.com"
                    required
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. +1 (555) 000-0000"
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Corporate Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="e.g. Street City State"
                />
              </div>

              <div style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "12px",
                paddingTop: "16px",
                borderTop: "1px solid var(--border-color)"
              }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="secondary-button"
                  style={{ height: "40px", fontSize: "13px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="module-button"
                  style={{ height: "40px", fontSize: "13px" }}
                >
                  Register Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
