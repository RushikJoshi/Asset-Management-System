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
} from "react-icons/fa";
import logoImage from "../../images/logo.jpeg";
import { logout } from "../../store/slices/authSlice";
import { ROLE_LABELS, ROUTE_ROLES } from "../../utils/permissions";
import { useToast } from "../toast/toastStore";
import "./AppLayout.css";

const navItems = [
  { to: "/", label: "Dashboard", icon: <FaHome />, menuRoles: ["SUPER_ADMIN", "ADMIN"] },
  { to: "/assets", label: "Assets", icon: <FaLaptop />, menuRoles: ["SUPER_ADMIN", "ADMIN", "IT_STAFF"] },
  { to: "/scan-demo", label: "QR Console", icon: <FaQrcode />, menuRoles: ["SUPER_ADMIN", "ADMIN", "IT_STAFF"] },
  { to: "/requests", label: "Requests", icon: <FaClipboardCheck />, menuRoles: ["SUPER_ADMIN", "ADMIN", "IT_STAFF"] },
  { to: "/inventory", label: "Inventory", icon: <FaBoxes />, menuRoles: [] },
  { to: "/employees", label: "Employee Portal", icon: <FaUserFriends />, menuRoles: ["SUPER_ADMIN", "EMPLOYEE"] },
  { to: "/assignments", label: "Assignments", icon: <FaExchangeAlt />, menuRoles: [] },
  { to: "/maintenance", label: "Maintenance", icon: <FaTools />, menuRoles: [] },
  { to: "/warranty", label: "Warranty", icon: <FaBell />, menuRoles: [] },
  { to: "/offices", label: "Offices", icon: <FaBuilding />, menuRoles: [] },
  { to: "/audit", label: "Audit Session", icon: <FaQrcode />, menuRoles: ["SUPER_ADMIN", "AUDITOR"] },
  { to: "/reports", label: "Reports", icon: <FaChartBar />, menuRoles: ["SUPER_ADMIN", "ADMIN"] },
  { to: "/roles", label: "Users & Access", icon: <FaShieldAlt />, menuRoles: ["SUPER_ADMIN"] },
];

const getPageTitle = (pathname) => {
  if (pathname === "/") return "Dashboard";
  if (pathname === "/assets") return "Assets";
  if (pathname === "/requests") return "Requests";
  if (pathname === "/inventory") return "Inventory";
  if (pathname === "/employees") return "Employee Portal";
  if (pathname === "/assignments") return "Assignments";
  if (pathname === "/maintenance") return "Maintenance";
  if (pathname === "/warranty") return "Warranty";
  if (pathname === "/offices") return "Offices";
  if (pathname === "/audit") return "Audit Session";
  if (pathname === "/reports") return "Reports";
  if (pathname === "/roles") return "Users & Access";
  if (pathname === "/scan-demo") return "QR Console";
  if (pathname === "/add-asset") return "Add Asset";
  if (pathname.startsWith("/edit-asset/")) return "Edit Asset";
  if (pathname === "/profile") return "My Profile";
  if (pathname.startsWith("/asset-details/")) return "Asset Details";
  if (pathname === "/add-request") return "Add Request";
  if (pathname.startsWith("/edit-request/")) return "Edit Request";
  return "AssetPro";
};

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

  return (
    <div className={`shell ${isCollapsed ? "collapsed" : ""}`}>
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <aside className={`sidebar ${isSidebarOpen ? "open" : ""} ${isCollapsed ? "collapsed" : ""}`}>
        <div className="brand-block">
          <div className="brand-mark">
            <img src={logoImage} alt="AssetPro logo" className="brand-logo" />
          </div>
          <div className="brand-text">
            <h2>AssetPro</h2>
            <p>Lifecycle ERP</p>
          </div>
          <button className="sidebar-collapse-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
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
      </aside>

      <div className="main-container">
        <header className="topbar">
          <div className="topbar-left">
            <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <FaBars />
            </button>
            <h1 className="topbar-page-title">{getPageTitle(location.pathname)}</h1>
          </div>
          <div className="topbar-actions">
            <button className="notification-btn" onClick={() => showToast({ title: "Notifications", message: "You have no new notifications.", type: "info" })}>
              <FaBell />
              <span>Notifications</span>
            </button>

            <div className="profile-dropdown-container" ref={dropdownRef}>
              <button className="profile-trigger-btn" aria-label="Profile menu" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <FaUser className="profile-avatar-icon" />
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
        <main className="main-panel">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
