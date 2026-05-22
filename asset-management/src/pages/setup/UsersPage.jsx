import { useState } from "react";
import { PageTitle, KpiGrid, DataTable } from "../../components/common/ModuleComponents";
import { FaUserPlus, FaSearch, FaUserShield, FaEnvelope, FaCheckCircle, FaTimesCircle, FaCalendarAlt } from "react-icons/fa";

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

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
          backgroundColor: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          animation: "fadeIn 0.2s ease"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "480px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
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
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "var(--text-main)" }}>Add New System User</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-muted)" }}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddUser} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {formError && (
                <div style={{ color: "#B91C1C", backgroundColor: "#FEF2F2", padding: "10px", borderRadius: "6px", fontSize: "13px", fontWeight: "600" }}>
                  {formError}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g. john.doe@assetpro.com"
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Department / Cost Center</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="e.g. Finance, Tech Operations"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>System Role</label>
                  <select name="role" value={formData.role} onChange={handleInputChange} style={{ width: "100%" }}>
                    <option value="ADMIN">Admin</option>
                    <option value="IT_STAFF">IT Staff</option>
                    <option value="MANAGER">Manager</option>
                    <option value="AUDITOR">Auditor</option>
                    <option value="EMPLOYEE">Employee</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} style={{ width: "100%" }}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
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
