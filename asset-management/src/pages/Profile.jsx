import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import apiInstance from "../apis/apiConfig";
import { useToast } from "../components/toast/toastStore";
import { updateUserSession } from "../store/slices/authSlice";
import { ROLE_LABELS } from "../utils/permissions";
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
    <div className="profile-page-wrapper">
      <div className="profile-header-section">
        <h2>My Profile</h2>
        <p className="profile-subtitle">Manage your personal information and security preferences</p>
      </div>

      <div className="profile-content-grid">
        <form onSubmit={handleSave} className="profile-card main-info-card">
          <div className="profile-avatar-banner">
            <div className="profile-large-avatar">
              {formData.profilePhoto ? (
                <img src={formData.profilePhoto} alt="Profile" />
              ) : (
                getInitials(formData.name || user?.name)
              )}
            </div>
            <div className="profile-avatar-details">
              <h3>{formData.name || user?.name || "User Name"}</h3>
              <p className="profile-role-badge">{ROLE_LABELS[user?.role] || user?.role}</p>
              <span className="profile-status-dot active">Active Account</span>
              <div className="profile-photo-actions">
                <label className="profile-photo-button" htmlFor="profilePhoto">
                  Add Photo
                  <input
                    id="profilePhoto"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                </label>
                {formData.profilePhoto && (
                  <button type="button" className="profile-photo-remove" onClick={removePhoto}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="profile-fields-grid">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="employeeId">Employee ID</label>
              <input
                type="text"
                id="employeeId"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleInputChange}
                placeholder="e.g. EMP-1048"
              />
            </div>

            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="e.g. IT Operations"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="e.g. +91 98765 43210"
              />
            </div>

            <div className="form-group readonly">
              <label>System Access Level</label>
              <div className="readonly-value">
                {ROLE_LABELS[user?.role] || user?.role}
              </div>
            </div>
          </div>

          <div className="profile-divider"></div>

          {/* Change Password Collapsible Section */}
          <div className="profile-security-accordion">
            <button
              type="button"
              className={`accordion-trigger ${showPasswordSection ? "active" : ""}`}
              onClick={() => setShowPasswordSection(!showPasswordSection)}
            >
              <span className="security-icon">🔒</span>
              <span>Change Account Password</span>
              <span className="accordion-caret">{showPasswordSection ? "▲" : "▼"}</span>
            </button>

            {showPasswordSection && (
              <div className="accordion-content">
                <div className="password-fields-grid">
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      placeholder="Enter new password"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="profile-actions-bar">
            <button type="submit" disabled={isSaving} className="primary-action save-profile-btn">
              {isSaving ? "Saving..." : "Save Profile Details"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Profile;
