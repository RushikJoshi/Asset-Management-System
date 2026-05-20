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
  FaChevronDown,
  FaUser,
  FaTags,
} from "react-icons/fa";
import logoImage from "../../images/logo.jpeg";
import { logout } from "../../store/slices/authSlice";
import { fetchAssetList } from "../../store/slices/assetSlice";
import { roleHasMenuAccess } from "../../utils/permissions";
import { fetchRoles } from "../../utils/roleApi";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  subscribeNotifications,
  syncAssetNotifications,
} from "../../utils/notificationStore";
import "./AppLayout.css";

const navItems = [
  {
    to: "/",
    label: "Dashboard",
    icon: <FaHome />,
    menuRoles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    to: "/assets",
    label: "Assets",
    icon: <FaLaptop />,
    menuRoles: ["SUPER_ADMIN", "ADMIN", "IT_STAFF"],
  },
  {
    key: "masters",
    label: "Masters",
    icon: <FaEdit />,
    menuRoles: ["SUPER_ADMIN", "ADMIN", "IT_STAFF"],
    children: [
      { to: "/masters/asset-form", label: "Asset Form", icon: <FaLaptop /> },
      {
        to: "/masters/request-form",
        label: "Request Form",
        icon: <FaClipboardCheck />,
      },
      { to: "/masters/categories", label: "Categories", icon: <FaTags /> },
    ],
  },
  {
    to: "/scan-demo",
    label: "QR Console",
    icon: <FaQrcode />,
    menuRoles: ["SUPER_ADMIN", "ADMIN", "IT_STAFF"],
  },
  {
    to: "/requests",
    label: "Requests",
    icon: <FaClipboardCheck />,
    menuRoles: ["SUPER_ADMIN", "ADMIN", "IT_STAFF"],
  },
  { to: "/inventory", label: "Inventory", icon: <FaBoxes />, menuRoles: [] },
  {
    to: "/employees",
    label: "Employee Portal",
    icon: <FaUserFriends />,
    menuRoles: ["SUPER_ADMIN", "EMPLOYEE"],
  },
  {
    to: "/assignments",
    label: "Assignments",
    icon: <FaExchangeAlt />,
    menuRoles: [],
  },
  {
    to: "/maintenance",
    label: "Maintenance",
    icon: <FaTools />,
    menuRoles: [],
  },
  { to: "/warranty", label: "Warranty", icon: <FaBell />, menuRoles: [] },
  { to: "/offices", label: "Offices", icon: <FaBuilding />, menuRoles: [] },
  {
    to: "/audit",
    label: "Audit Session",
    icon: <FaQrcode />,
    menuRoles: ["SUPER_ADMIN", "AUDITOR"],
  },
  {
    to: "/reports",
    label: "Reports",
    icon: <FaChartBar />,
    menuRoles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    to: "/roles",
    label: "Users & Access",
    icon: <FaShieldAlt />,
    menuRoles: ["SUPER_ADMIN"],
  },
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
  if (pathname === "/masters/asset-form") return "Asset Form";
  if (pathname === "/masters/request-form") return "Request Form";
  if (pathname === "/masters/categories") return "Categories";
  if (pathname.startsWith("/masters") || pathname === "/master-editor")
    return "Masters";
  if (pathname === "/scan-demo") return "QR Console";
  if (pathname === "/add-asset") return "Add Asset";
  if (pathname.startsWith("/edit-asset/")) return "Edit Asset";
  if (pathname === "/profile") return "My Profile";
  if (pathname.startsWith("/asset-details/")) return "Asset Details";
  if (pathname === "/add-request") return "New Asset Request";
  if (pathname.startsWith("/edit-request/")) return "Edit Request";
  return "AssetPro";
};

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { assetListData } = useSelector((state) => state.assetList);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => getNotifications());
  const [unreadCount, setUnreadCount] = useState(() =>
    getUnreadNotificationCount(),
  );
  const [roles, setRoles] = useState([]);
  const [mastersOpen, setMastersOpen] = useState(
    () =>
      location.pathname.startsWith("/masters") ||
      location.pathname === "/master-editor",
  );
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    return subscribeNotifications(() => {
      setNotifications(getNotifications());
      setUnreadCount(getUnreadNotificationCount());
    });
  }, []);

  useEffect(() => {
    fetchRoles()
      .then(setRoles)
      .catch(() => setRoles([]));
    dispatch(fetchAssetList());
  }, [dispatch]);

  useEffect(() => {
    if (user?.role && assetListData.length) {
      syncAssetNotifications(assetListData, user.role);
    }
  }, [assetListData, user?.role]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleNotifications = () => {
    setIsNotifOpen((open) => {
      const next = !open;
      if (next) {
        markAllNotificationsRead();
        setUnreadCount(0);
        setNotifications(getNotifications());
      }
      return next;
    });
    setIsDropdownOpen(false);
  };

  const role = roles.find((item) => item.key === user?.role);
  const roleAccess = role?.sidebarAccess?.length
    ? role.sidebarAccess
    : role?.access || "";
  const visibleNavItems = navItems.filter((item) => {
    if (roleHasMenuAccess(user?.role, item.label, roleAccess)) return true;
    return !roleAccess && item.menuRoles.includes(user?.role);
  });

  const logoutUser = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <div className={`shell ${isCollapsed ? "collapsed" : ""}`}>
      {isSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <aside
        className={`sidebar ${isSidebarOpen ? "open" : ""} ${isCollapsed ? "collapsed" : ""}`}
      >
        <div className="brand-block">
          <div className="brand-mark">
            <img src={logoImage} alt="AssetPro logo" className="brand-logo" />
          </div>
          <div className="brand-text">
            <h2>AssetPro</h2>
            <p>Lifecycle ERP</p>
          </div>
          <button
            className="sidebar-collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
          <button
            className="sidebar-close"
            onClick={() => setIsSidebarOpen(false)}
          >
            <FaTimes />
          </button>
        </div>

        <nav className="side-nav">
          {visibleNavItems.map((item) => {
            if (item.children?.length) {
              const mastersActive =
                location.pathname.startsWith("/masters") ||
                location.pathname === "/master-editor";
              return (
                <div className="nav-group" key={item.key || item.label}>
                  <button
                    type="button"
                    className={`nav-link nav-group-toggle ${mastersActive ? "active" : ""}`}
                    onClick={() => setMastersOpen((open) => !open)}
                    aria-expanded={mastersOpen}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    <FaChevronDown
                      className={`nav-chevron ${mastersOpen ? "open" : ""}`}
                    />
                  </button>
                  {mastersOpen && (
                    <div className="nav-sub-list">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          className={({ isActive }) =>
                            isActive ? "nav-sublink active" : "nav-sublink"
                          }
                          onClick={() => setIsSidebarOpen(false)}
                        >
                          {child.icon}
                          <span>{child.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
                onClick={() => setIsSidebarOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="main-container">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="sidebar-toggle"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <FaBars />
            </button>
            <h1 className="topbar-page-title">
              {getPageTitle(location.pathname)}
            </h1>
          </div>
          <div className="topbar-actions">
            <div className="notification-dropdown-container" ref={notifRef}>
              <button
                type="button"
                className="notification-btn"
                aria-expanded={isNotifOpen}
                onClick={toggleNotifications}
              >
                <FaBell />
                <span>Notifications</span>
                {unreadCount > 0 ? (
                  <em className="notification-badge">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </em>
                ) : null}
              </button>
              {isNotifOpen && (
                <div className="notification-dropdown-menu">
                  <div className="notification-dropdown-head">
                    <strong>Notifications</strong>
                    <span>{notifications.length} total</span>
                  </div>
                  {notifications.length ? (
                    <ul className="notification-list">
                      {notifications.slice(0, 12).map((item) => (
                        <li
                          key={item.id}
                          className={`notification-item notification-item--${item.type || "info"}`}
                        >
                          <strong>{item.title}</strong>
                          <p>{item.message}</p>
                          <time>
                            {new Date(item.createdAt).toLocaleString("en-IN")}
                          </time>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="notification-empty">No notifications yet.</p>
                  )}
                </div>
              )}
            </div>

            <div className="profile-dropdown-container" ref={dropdownRef}>
              <button
                className="profile-trigger-btn"
                aria-label="Profile menu"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <FaUser className="profile-avatar-icon" />
              </button>

              {isDropdownOpen && (
                <div className="profile-dropdown-menu">
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate("/profile");
                    }}
                  >
                    My Profile
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={logoutUser}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main
          className={`main-panel ${location.pathname === "/assets" ? "main-panel-assets" : ""}`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
