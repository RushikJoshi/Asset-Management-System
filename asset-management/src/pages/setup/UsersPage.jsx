import { useState } from "react";
import { PageTitle, KpiGrid, DataTable } from "../../components/common/ModuleComponents";
import { FaUserPlus, FaSearch, FaUserShield, FaEnvelope, FaCheckCircle, FaTimesCircle, FaCalendarAlt } from "react-icons/fa";

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  // Mock list of initial users
  const [users, setUsers] = useState([
    { id: 1, name: "Lucas Samuel", email: "lucas.samuel@assetpro.com", role: "ADMIN", status: "Active", lastActive: "May 22, 2026", department: "IT & Infrastructure" },
    { id: 2, name: "Amit Patel", email: "amit.patel@assetpro.com", role: "IT_STAFF", status: "Active", lastActive: "May 21, 2026", department: "IT Helpdesk" },
    { id: 3, name: "Jessica Wong", email: "jessica.w@assetpro.com", role: "MANAGER", status: "Active", lastActive: "May 20, 2026", department: "Operations" },
    { id: 4, name: "Rajesh Kumar", email: "rajesh.k@assetpro.com", role: "AUDITOR", status: "Active", lastActive: "May 18, 2026", department: "Finance & Audit" },
    { id: 5, name: "Priya Sharma", email: "priya.s@assetpro.com", role: "EMPLOYEE", status: "Active", lastActive: "May 22, 2026", department: "Human Resources" },
    { id: 6, name: "Devendra Singh", email: "devendra.s@assetpro.com", role: "EMPLOYEE", status: "Inactive", lastActive: "April 15, 2026", department: "Engineering" },
  ]);

  // Form State for Adding New User
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "EMPLOYEE",
    status: "Active",
    department: ""
  });
  const [formError, setFormError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.department.trim()) {
      setFormError("Please fill in all fields.");
      return;
    }

    if (!formData.email.includes("@")) {
      setFormError("Please enter a valid email address.");
      return;
    }

    const newUser = {
      id: users.length + 1,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      status: formData.status,
      lastActive: "Just now",
      department: formData.department
    };

    setUsers((prev) => [newUser, ...prev]);
    setShowAddModal(false);
    setFormData({ name: "", email: "", role: "EMPLOYEE", status: "Active", department: "" });
    setFormError("");
    
    // Show toast message
    setToastMessage(`User ${newUser.name} created successfully!`);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // KPI items
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "Active").length;
  const admins = users.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length;
  const staff = users.filter((u) => u.role === "IT_STAFF").length;

  const kpis = [
    { label: "Total Users", value: totalUsers },
    { label: "Active Users", value: activeUsers },
    { label: "Administrators", value: admins },
    { label: "IT Staff", value: staff },
  ];

  // Filtering Logic
  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" ? true : u.role === roleFilter;
    const matchesStatus = statusFilter === "ALL" ? true : u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getRoleLabel = (role) => {
    if (role === "SUPER_ADMIN") return "Super Admin";
    if (role === "ADMIN") return "Admin";
    if (role === "IT_STAFF") return "IT Staff";
    if (role === "MANAGER") return "Manager";
    if (role === "AUDITOR") return "Auditor";
    return "Employee";
  };

  // Toggle user status
  const toggleStatus = (id) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" } : u
      )
    );
  };

  const columns = [
    {
      key: "name",
      label: "User Details",
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0d9488, #0f766e)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "700",
            fontSize: "13px"
          }}>
            {getInitials(row.name)}
          </div>
          <div>
            <div style={{ fontWeight: "600", color: "var(--text-main)" }}>{row.name}</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
              <FaEnvelope style={{ fontSize: "10px" }} /> {row.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: "department",
      label: "Department",
      render: (row) => <span style={{ color: "#475569" }}>{row.department}</span>
    },
    {
      key: "role",
      label: "System Role",
      render: (row) => (
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 8px",
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: "600",
          backgroundColor: row.role === "ADMIN" ? "#FEF3C7" : row.role === "IT_STAFF" ? "#E0F2FE" : "#F1F5F9",
          color: row.role === "ADMIN" ? "#92400E" : row.role === "IT_STAFF" ? "#0369A1" : "#475569"
        }}>
          <FaUserShield style={{ fontSize: "11px" }} /> {getRoleLabel(row.role)}
        </span>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "4px 8px",
          borderRadius: "4px",
          fontSize: "12px",
          fontWeight: "600",
          backgroundColor: row.status === "Active" ? "#ECFDF5" : "#FEF2F2",
          color: row.status === "Active" ? "#047857" : "#B91C1C"
        }}>
          {row.status === "Active" ? <FaCheckCircle /> : <FaTimesCircle />} {row.status}
        </span>
      )
    },
    {
      key: "lastActive",
      label: "Last Active",
      render: (row) => (
        <span style={{ color: "var(--text-muted)", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
          <FaCalendarAlt style={{ fontSize: "11px" }} /> {row.lastActive}
        </span>
      )
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <button
          onClick={() => toggleStatus(row.id)}
          className="secondary-button"
          style={{ height: "26px", fontSize: "11px", minWidth: "80px" }}
        >
          {row.status === "Active" ? "Deactivate" : "Activate"}
        </button>
      )
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "32px" }}>
      <PageTitle 
        action={
          <button 
            className="module-button"
            onClick={() => setShowAddModal(true)}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <FaUserPlus /> Add User
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
          fontSize: "14px",
          animation: "fadeIn 0.3s ease",
          boxShadow: "var(--shadow-sm)"
        }}>
          {toastMessage}
        </div>
      )}

      <KpiGrid items={kpis} />

      {/* Modern Filter Interface */}
      <div className="action-panel" style={{
        display: "grid",
        gridTemplateColumns: "1fr auto auto",
        gap: "12px",
        padding: "16px",
        borderRadius: "var(--radius-lg)"
      }}>
        <h3 style={{ gridColumn: "1 / -1", margin: 0, fontSize: "14px", color: "var(--text-muted)" }}>Search & Filters</h3>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Search by name, email or department..."
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
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="IT_STAFF">IT Staff</option>
          <option value="MANAGER">Manager</option>
          <option value="AUDITOR">Auditor</option>
          <option value="EMPLOYEE">Employee</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Data Table */}
      <DataTable columns={columns} rows={filteredUsers} emptyText="No users match the search filters." />

      {/* Add User Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.3)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          animation: "fadeIn 0.2s ease"
        }}>
          <div style={{
            background: "var(--bg-surface)",
            borderRadius: "14px",
            width: "500px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 1px rgba(0, 0, 0, 0.15)",
            border: "1px solid var(--border-color)",
            overflow: "hidden",
            transition: "all 0.3s ease"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "18px 24px",
              borderBottom: "1px solid var(--border-color)",
              background: "linear-gradient(135deg, #eff6ff, #f8fafc)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--text-main)", letterSpacing: "-0.01em" }}>
                Add New System User
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(100, 116, 139, 0.1)";
                  e.currentTarget.style.color = "var(--text-main)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddUser} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {formError && (
                <div style={{
                  color: "#ef4444",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  <span>⚠</span> {formError}
                </div>
              )}

              {/* Full Name Field */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. John Doe"
                  required
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField("")}
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 14px",
                    fontSize: "13px",
                    borderRadius: "8px",
                    border: focusedField === "name" ? "1px solid var(--color-primary)" : "1px solid var(--border-color)",
                    boxShadow: focusedField === "name" ? "0 0 0 3px rgba(33, 133, 243, 0.15)" : "var(--shadow-sm)",
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-main)",
                    transition: "all 0.2s ease",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              {/* Email Address Field */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g. john.doe@assetpro.com"
                  required
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField("")}
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 14px",
                    fontSize: "13px",
                    borderRadius: "8px",
                    border: focusedField === "email" ? "1px solid var(--color-primary)" : "1px solid var(--border-color)",
                    boxShadow: focusedField === "email" ? "0 0 0 3px rgba(33, 133, 243, 0.15)" : "var(--shadow-sm)",
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-main)",
                    transition: "all 0.2s ease",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              {/* Department / Cost Center Field */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Department / Cost Center
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="e.g. Finance, Tech Operations"
                  required
                  onFocus={() => setFocusedField("department")}
                  onBlur={() => setFocusedField("")}
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 14px",
                    fontSize: "13px",
                    borderRadius: "8px",
                    border: focusedField === "department" ? "1px solid var(--color-primary)" : "1px solid var(--border-color)",
                    boxShadow: focusedField === "department" ? "0 0 0 3px rgba(33, 133, 243, 0.15)" : "var(--shadow-sm)",
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-main)",
                    transition: "all 0.2s ease",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              {/* System Role & Status Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    System Role
                  </label>
                  <select 
                    name="role" 
                    value={formData.role} 
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField("role")}
                    onBlur={() => setFocusedField("")}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 14px",
                      fontSize: "13px",
                      borderRadius: "8px",
                      border: focusedField === "role" ? "1px solid var(--color-primary)" : "1px solid var(--border-color)",
                      boxShadow: focusedField === "role" ? "0 0 0 3px rgba(33, 133, 243, 0.15)" : "var(--shadow-sm)",
                      backgroundColor: "var(--bg-surface)",
                      color: "var(--text-main)",
                      transition: "all 0.2s ease",
                      outline: "none",
                      cursor: "pointer",
                      boxSizing: "border-box"
                    }}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="IT_STAFF">IT Staff</option>
                    <option value="MANAGER">Manager</option>
                    <option value="AUDITOR">Auditor</option>
                    <option value="EMPLOYEE">Employee</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Status
                  </label>
                  <select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField("status")}
                    onBlur={() => setFocusedField("")}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 14px",
                      fontSize: "13px",
                      borderRadius: "8px",
                      border: focusedField === "status" ? "1px solid var(--color-primary)" : "1px solid var(--border-color)",
                      boxShadow: focusedField === "status" ? "0 0 0 3px rgba(33, 133, 243, 0.15)" : "var(--shadow-sm)",
                      backgroundColor: "var(--bg-surface)",
                      color: "var(--text-main)",
                      transition: "all 0.2s ease",
                      outline: "none",
                      cursor: "pointer",
                      boxSizing: "border-box"
                    }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
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
                  style={{
                    height: "40px",
                    padding: "0 20px",
                    fontSize: "13px",
                    fontWeight: "600",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "#ffffff",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-subtle)";
                    e.currentTarget.style.color = "var(--text-main)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                    e.currentTarget.style.color = "var(--text-muted)";
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{
                    height: "40px",
                    padding: "0 20px",
                    fontSize: "13px",
                    fontWeight: "600",
                    borderRadius: "8px",
                    border: "none",
                    background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
                    color: "#ffffff",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(33, 133, 243, 0.2)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 6px 16px rgba(33, 133, 243, 0.3)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(33, 133, 243, 0.2)";
                  }}
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
