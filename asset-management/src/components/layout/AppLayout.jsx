import { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FaBell,
  FaBoxes,
  FaBuilding,
  FaChartBar,
  FaClipboardCheck,
  FaExchangeAlt,
  FaEdit,
  FaHome,
  FaLaptop,
  FaQrcode,
  FaShieldAlt,
  FaTools,
  FaUserFriends,
  FaBars,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaUser,
  FaSearch,
  FaChevronDown
} from "react-icons/fa";
import { logout } from "../../store/slices/authSlice";
import { useToast } from "../toast/toastStore";
import "./AppLayout.css";

const navItems = [
  { to: "/", label: "Dashboard", icon: <FaHome />, menuRoles: ["SUPER_ADMIN", "ADMIN"] },
  { to: "/assets", label: "Assets", icon: <FaLaptop />, menuRoles: ["SUPER_ADMIN", "ADMIN", "IT_STAFF"] },
  { to: "/master-editor", label: "Master Editor", icon: <FaEdit />, menuRoles: ["SUPER_ADMIN", "ADMIN", "IT_STAFF"] },
  { to: "/scan-demo", label: "QR Console", icon: <FaQrcode />, menuRoles: ["SUPER_ADMIN", "ADMIN", "IT_STAFF"] },
  { to: "/requests", label: "Requests", icon: <FaClipboardCheck />, menuRoles: ["SUPER_ADMIN", "ADMIN", "IT_STAFF"] },
  { to: "/employees", label: "Employee Portal", icon: <FaUserFriends />, menuRoles: ["SUPER_ADMIN", "EMPLOYEE"] },
  { to: "/audit", label: "Audit Session", icon: <FaQrcode />, menuRoles: ["SUPER_ADMIN", "AUDITOR"] },
  { to: "/reports", label: "Reports", icon: <FaChartBar />, menuRoles: ["SUPER_ADMIN", "ADMIN"] },
  { to: "/warranty", label: "Alerts", icon: <FaBell />, menuRoles: ["SUPER_ADMIN", "ADMIN", "IT_STAFF", "EMPLOYEE"] },
  { to: "/roles", label: "Users & Access", icon: <FaShieldAlt />, menuRoles: ["SUPER_ADMIN"] },
  { to: "/profile", label: "Settings", icon: <FaTools />, menuRoles: ["SUPER_ADMIN", "ADMIN", "IT_STAFF", "EMPLOYEE", "AUDITOR"] }
];

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { user } = useSelector((state) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const visibleNavItems = navItems.filter((item) =>
    item.menuRoles.includes(user?.role),
  );

  const logoutUser = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const getInitials = (name) => {
    if (!name) return "A";
    const parts = name.split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  // Convert role to clean label
  const getRoleLabel = (role) => {
    if (role === "SUPER_ADMIN") return "Admin";
    if (role === "ADMIN") return "Admin";
    if (role === "IT_STAFF") return "IT Staff";
    if (role === "AUDITOR") return "Auditor";
    return "Employee";
  };

  return (
    <div className={`shell ${isCollapsed ? "collapsed" : ""}`}>
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <aside className={`sidebar ${isSidebarOpen ? "open" : ""} ${isCollapsed ? "collapsed" : ""}`}>
        <div className="brand-block">
          <div className="brand-mark-svg">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#0D9488"/>
              <path d="M16 7C11.0294 7 7 11.0294 7 16C7 20.9706 11.0294 25 16 25C20.9706 25 25 20.9706 25 16C25 13.5 24 11.2 22 9.7M16 11C13.2386 11 11 13.2386 11 16C11 18.7614 13.2386 21 16 21C18.7614 21 21 18.7614 21 16" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="brand-text">
            <h2>AssetPro</h2>
            <p>Lifecycle ERP</p>
          </div>
          <button className="sidebar-close" onClick={() => setIsSidebarOpen(false)}>
            <FaTimes />
          </button>
        </div>

        <nav className="side-nav">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              onClick={() => setIsSidebarOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Dynamic collapse trigger placed at the bottom exactly as mockup */}
        <div className="sidebar-footer">
          <button className="sidebar-collapse-btn-new" onClick={() => setIsCollapsed(!isCollapsed)} aria-label="Toggle Sidebar">
            {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
            <span>Collapse</span>
          </button>
        </div>
      </aside>

      <div className="main-container">
        <header className="topbar">
          <div className="topbar-left-search">
            <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <FaBars />
            </button>
            <div className="search-bar-wrapper">
              <FaSearch className="topbar-search-icon" />
              <input 
                type="text" 
                placeholder="Search assets, employees, serial no..." 
                className="topbar-search-input"
              />
            </div>
          </div>
          
          <div className="topbar-actions">
            <button className="notification-btn" onClick={() => showToast({ title: "Notifications", message: "You have no new notifications.", type: "info" })}>
              <div className="bell-badge-container">
                <FaBell />
                <span className="bell-badge-count">5</span>
              </div>
            </button>

            <div className="profile-dropdown-container" ref={dropdownRef}>
              <button className="profile-trigger-btn-new" aria-label="Profile menu" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <div className="profile-avatar-fallback">
                  {getInitials(user?.name || "Madhu")}
                </div>
                <div className="profile-info-block">
                  <span className="profile-info-name">{user?.name || "Madhu"}</span>
                  <span className="profile-info-role">{getRoleLabel(user?.role)}</span>
                </div>
                <FaChevronDown className="profile-caret-down" />
              </button>

              {isDropdownOpen && (
                <div className="profile-dropdown-menu">
                  <button className="dropdown-item" onClick={() => { setIsDropdownOpen(false); navigate("/profile"); }}>My Profile</button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={logoutUser}>Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>
        
        <main className={`main-panel ${location.pathname === "/assets" ? "main-panel-assets" : ""}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
