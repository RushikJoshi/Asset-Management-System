import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import apiInstance from "../apis/apiConfig";
import { useToast } from "../components/toast/toastStore";
import { updateUserSession } from "../store/slices/authSlice";
import { ROLE_LABELS } from "../utils/permissions";
import { PageTitle } from "../components/common/ModuleComponents";
import "./Profile.css";

function Profile() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    employeeId: user?.employeeId || "",
    department: user?.department || "",
    phoneNumber: user?.phoneNumber || "",
    profilePhoto: user?.profilePhoto || "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast({ title: "Invalid Photo", message: "Please select an image file.", type: "error" });
      event.target.value = "";
      return;
    }

    if (file.size > 1500 * 1024) {
      showToast({ title: "Photo Too Large", message: "Please select an image below 1.5 MB.", type: "error" });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, profilePhoto: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const removePhoto = () => {
    setFormData((prev) => ({ ...prev, profilePhoto: "" }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      showToast({ title: "Validation Error", message: "Name and Email are required.", type: "error" });
      return;
    }

    if (showPasswordSection) {
      if (!formData.newPassword) {
        showToast({ title: "Validation Error", message: "New Password is required when Change Password is open.", type: "error" });
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        showToast({ title: "Validation Error", message: "Passwords do not match.", type: "error" });
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        employeeId: formData.employeeId,
        department: formData.department,
        phoneNumber: formData.phoneNumber,
        profilePhoto: formData.profilePhoto,
      };

      if (showPasswordSection && formData.newPassword) {
        payload.newPassword = formData.newPassword;
      }

      const response = await apiInstance.put("/auth/profile/update", payload);
      
      if (response.data.success) {
        dispatch(updateUserSession(response.data.user));
        showToast({ title: "Profile Saved", message: "Your profile was updated successfully.", type: "success" });
        
        // Reset password fields if updated
        if (showPasswordSection) {
          setFormData((prev) => ({ ...prev, newPassword: "", confirmPassword: "" }));
          setShowPasswordSection(false);
        }
      }
    } catch (error) {
      showToast({
        title: "Update Failed",
        message: error.response?.data?.message || "An error occurred while updating profile.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return "👤";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="profile-page-wrapper" style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box", padding: "8px 12px 40px" }}>
      <PageTitle 
        eyebrow="My Account" 
        title="Personal Settings" 
        description="Manage your personal information, department details, and security credentials." 
      />

      <form onSubmit={handleSave}>
        
        {/* Unified Profile Card */}
        <div 
          className="profile-unified-card"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-lg)",
            padding: "36px",
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            flexDirection: "column",
            gap: "28px"
          }}
        >
          
          {/* Section 1: Avatar Block */}
          <div 
            className="profile-avatar-card-inner"
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "28px",
              alignItems: "start",
              borderBottom: "1px solid var(--border-color)",
              paddingBottom: "28px"
            }}
          >
            {/* Avatar & Controls Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", alignItems: "center" }}>
              <div 
                className="profile-large-avatar"
                style={{
                  width: "100px",
                  height: "100px",
                  background: formData.profilePhoto ? "transparent" : "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                  color: "#ffffff",
                  fontSize: "32px",
                  fontWeight: 700,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 24px rgba(14, 165, 164, 0.25)",
                  flexShrink: 0,
                  overflow: "hidden",
                  border: "4px solid #ffffff",
                  position: "relative"
                }}
              >
                {formData.profilePhoto ? (
                  <img 
                    src={formData.profilePhoto} 
                    alt="Profile" 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  getInitials(user?.name)
                )}
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", maxWidth: "140px" }}>
                <label style={{ position: "relative", cursor: "pointer", width: "100%" }}>
                  <button
                    type="button"
                    className="profile-photo-button-new"
                    onClick={(e) => {
                      e.preventDefault();
                      e.currentTarget.parentElement.querySelector('input[type="file"]').click();
                    }}
                    style={{
                      background: "#03a4aa",
                      border: "1px solid #03a4aa",
                      color: "#ffffff",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      width: "100%",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 8px rgba(3, 164, 170, 0.15)"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#02848a";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#03a4aa";
                    }}
                  >
                    <span>📷</span>
                    <span>Change Photo</span>
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{ display: "none" }}
                  />
                </label>
                
                {formData.profilePhoto && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      removePhoto();
                    }}
                    style={{
                      background: "#fff5f5",
                      border: "1px solid #fecaca",
                      color: "#dc2626",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      width: "100%",
                      transition: "all 0.2s ease"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#fee2e2";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#fff5f5";
                    }}
                  >
                    <span>✕</span>
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* Profile Info Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", justifyContent: "center" }}>
              <div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "22px", fontWeight: "700", color: "var(--text-main)" }}>
                  {user?.name || "User Name"}
                </h3>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <span 
                  className="profile-role-badge"
                  style={{
                    background: "rgba(14, 165, 164, 0.1)",
                    color: "var(--color-primary)",
                    fontSize: "11px",
                    fontWeight: "600",
                    padding: "6px 14px",
                    borderRadius: "20px",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    border: "1px solid rgba(14, 165, 164, 0.2)",
                    display: "inline-block"
                  }}
                >
                  {ROLE_LABELS[user?.role] || user?.role}
                </span>
                <span 
                  className="profile-status-dot"
                  style={{
                    fontSize: "12px",
                    color: "#10B981",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: "600"
                  }}
                >
                  Active Account
                </span>
              </div>

              <div style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                <p style={{ margin: "8px 0 0 0" }}>
                  Employee ID: <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{formData.employeeId || "Not assigned"}</span>
                </p>
                <p style={{ margin: "4px 0 0 0" }}>
                  Department: <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{formData.department || "Not assigned"}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Personal Details Block */}
          <div className="profile-details-section">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Personal Details
              </h3>
              <button 
                type="submit" 
                disabled={isSaving} 
                className="module-button"
                style={{
                  height: "32px",
                  padding: "0 18px",
                  fontSize: "12px",
                  fontWeight: "600",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer"
                }}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label htmlFor="name" style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="custom-input"
                  style={{ height: "36px", padding: "0 12px", fontSize: "13px", boxSizing: "border-box" }}
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label htmlFor="email" style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="custom-input"
                  style={{ height: "36px", padding: "0 12px", fontSize: "13px", boxSizing: "border-box" }}
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your email"
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label htmlFor="employeeId" style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>Employee ID</label>
                <input
                  type="text"
                  id="employeeId"
                  name="employeeId"
                  className="custom-input"
                  style={{ height: "36px", padding: "0 12px", fontSize: "13px", boxSizing: "border-box" }}
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  placeholder="e.g. EMP-1048"
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label htmlFor="department" style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>Department</label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  className="custom-input"
                  style={{ height: "36px", padding: "0 12px", fontSize: "13px", boxSizing: "border-box" }}
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="e.g. IT Operations"
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label htmlFor="phoneNumber" style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>Phone Number</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  className="custom-input"
                  style={{ height: "36px", padding: "0 12px", fontSize: "13px", boxSizing: "border-box" }}
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. +91 98765 43210"
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>System Access Level</label>
                <div 
                  style={{ 
                    height: "36px", 
                    padding: "0 12px", 
                    fontSize: "13px", 
                    background: "var(--bg-subtle)", 
                    border: "1px solid var(--border-color)", 
                    borderRadius: "var(--radius-md)", 
                    color: "var(--text-muted)",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    boxSizing: "border-box"
                  }}
                >
                  {ROLE_LABELS[user?.role] || user?.role}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Collapsible Security Accordion */}
          <div 
            className="profile-security-section"
            style={{
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden"
            }}
          >
            <div 
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between", 
                cursor: "pointer", 
                userSelect: "none",
                padding: "16px 20px",
                background: "var(--bg-subtle)",
                transition: "background 0.2s ease"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "16px" }}>🔒</span>
                <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Security & Password
                </h3>
              </div>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {showPasswordSection ? "▲" : "▼"}
              </span>
            </div>

            {showPasswordSection && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "20px", background: "var(--bg-surface)", borderTop: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label htmlFor="newPassword" style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    className="custom-input"
                    style={{ height: "36px", padding: "0 12px", fontSize: "13px", boxSizing: "border-box" }}
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Enter new password"
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label htmlFor="confirmPassword" style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    className="custom-input"
                    style={{ height: "36px", padding: "0 12px", fontSize: "13px", boxSizing: "border-box" }}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            )}
          </div>

        </div>
      </form>
    </div>
  );
}

export default Profile;
