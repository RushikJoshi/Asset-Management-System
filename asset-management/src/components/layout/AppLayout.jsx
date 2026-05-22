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
  FaShoppingCart,
  FaCheckSquare,
  FaWrench,
} from "react-icons/fa";
import { logout } from "../../store/slices/authSlice";
import { fetchAssetList } from "../../store/slices/assetSlice";
import { roleHasMenuAccess } from "../../utils/permissions";
import { fetchRoles } from "../../utils/roleApi";
import {
  getNotifications,
  getUnreadNotificationCount,
  getUnreadNotificationCountsByMenu,
  isNotificationUnread,
  markUserNotificationRead,
  markUserNotificationsReadByMenu,
  markUserNotificationsRead,
  subscribeNotifications,
  syncAssetNotifications,
} from "../../utils/notificationStore";
import { TopbarActionsProvider, useTopbarActions } from "./topbarActionsContext";
import brandLogo from "../../images/logo.jpeg";
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
  {
    to: "/approvals",
    label: "Approvals",
    icon: <FaCheckSquare />,
    menuRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
  },
  {
    to: "/procurements",
    label: "Procurements",
    icon: <FaShoppingCart />,
    menuRoles: ["SUPER_ADMIN", "ADMIN", "IT_STAFF"],
  },
  { to: "/inventory", label: "Inventory", icon: <FaBoxes />, menuRoles: [] },
  {
    to: "/work-orders",
    label: "Work Orders",
    icon: <FaWrench />,
    menuRoles: ["SUPER_ADMIN", "ADMIN", "IT_STAFF"],
  },
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
  {
    key: "setup",
    label: "Setup",
    icon: <FaTools />,
    menuRoles: ["SUPER_ADMIN", "ADMIN", "IT_STAFF", "MANAGER", "AUDITOR"],
    children: [
      { to: "/setup/users", label: "Users", icon: <FaUser />, menuRoles: ["SUPER_ADMIN", "ADMIN"] },
      { to: "/setup/vendors", label: "Vendors", icon: <FaBuilding />, menuRoles: ["SUPER_ADMIN", "ADMIN", "IT_STAFF"] },
      { to: "/setup/products", label: "Products", icon: <FaBoxes />, menuRoles: ["SUPER_ADMIN", "ADMIN", "IT_STAFF", "MANAGER", "AUDITOR"] },
      { to: "/setup/preferences", label: "Preferences", icon: <FaWrench />, menuRoles: ["SUPER_ADMIN", "ADMIN"] },
    ],
  },
];

const getPageTitle = (pathname) => {
  if (pathname === "/add-asset") return "Add Asset";
  if (pathname.startsWith("/edit-asset/")) return "Edit Asset";
  if (pathname === "/profile") return "My Profile";
  if (pathname.startsWith("/asset-details/")) return "Asset Details";
  if (pathname === "/add-request") return "New Asset Request";
  if (pathname.startsWith("/edit-request/")) return "Edit Request";

  const matches = navItems
    .flatMap((item) => [
      item.to ? { path: item.to, label: item.label } : null,
      ...(item.children || []).map((child) => ({ path: child.to, label: child.label })),
    ])
    .filter(Boolean)
    .filter(({ path }) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)))
    .sort((a, b) => b.path.length - a.path.length);

  return matches[0]?.label || "Asset Management System";
};

const getNotificationMenuForPath = (pathname) => {
  const matches = navItems
    .flatMap((item) => [
      item.to ? { path: item.to, label: item.label } : null,
      ...(item.children || []).map((child) => ({ path: child.to, label: item.label })),
    ])
    .filter(Boolean)
    .filter(({ path }) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)))
    .sort((a, b) => b.path.length - a.path.length);

  return matches[0]?.label || "";
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
  const [notifications, setNotifications] = useState(() => getNotifications(user));
  const [unreadCount, setUnreadCount] = useState(() =>
    getUnreadNotificationCount(user),
  );
  const [sidebarNotificationCounts, setSidebarNotificationCounts] = useState(() =>
    getUnreadNotificationCountsByMenu(user),
  );
  const [roles, setRoles] = useState([]);
  const [mastersOpen, setMastersOpen] = useState(
    () =>
      location.pathname.startsWith("/masters") ||
      location.pathname === "/master-editor",
  );
  const [setupOpen, setSetupOpen] = useState(
    () => location.pathname.startsWith("/setup"),
  );
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    return subscribeNotifications(() => {
      setNotifications(getNotifications(user));
      setUnreadCount(getUnreadNotificationCount(user));
      setSidebarNotificationCounts(getUnreadNotificationCountsByMenu(user));
    });
  }, [user]);

  useEffect(() => {
    fetchRoles()
      .then(setRoles)
      .catch(() => setRoles([]));
    dispatch(fetchAssetList());
  }, [dispatch]);

  useEffect(() => {
    if (user?.role && assetListData.length) {
      syncAssetNotifications(assetListData, user);
    }
  }, [assetListData, user]);

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
      return !open;
    });
    setIsDropdownOpen(false);
  };

  const refreshNotificationState = () => {
    setNotifications(getNotifications(user));
    setUnreadCount(getUnreadNotificationCount(user));
    setSidebarNotificationCounts(getUnreadNotificationCountsByMenu(user));
  };

  const markAllCurrentNotificationsRead = () => {
    markUserNotificationsRead(user);
    refreshNotificationState();
  };

  const openNotification = (item) => {
    markUserNotificationRead(item.id, user);
    setIsNotifOpen(false);
    refreshNotificationState();
    if (item.meta?.route) {
      navigate(item.meta.route);
    }
  };

  const getMenuNotificationCount = (label) => sidebarNotificationCounts[label] || 0;

  useEffect(() => {
    refreshNotificationState();
  }, [user]);

  useEffect(() => {
    const menuLabel = getNotificationMenuForPath(location.pathname);
    if (!menuLabel) return;

    markUserNotificationsReadByMenu(menuLabel, user);
    refreshNotificationState();
  }, [location.pathname, user]);

  const role = roles.find((item) => item.key === user?.role);
  const roleAccess = role?.sidebarAccess?.length
    ? role.sidebarAccess
    : role?.access || "";

  const visibleNavItems = navItems.map((item) => {
    if (item.children) {
      const filteredChildren = item.children.filter((child) => {
        if (roleHasMenuAccess(user?.role, child.label, roleAccess)) return true;
        return !roleAccess && child.menuRoles?.includes(user?.role);
      });
      return { ...item, children: filteredChildren };
    }
    return item;
  }).filter((item) => {
    if (item.children?.length === 0) return false;
    if (roleHasMenuAccess(user?.role, item.label, roleAccess)) return true;
    return !roleAccess && item.menuRoles?.includes(user?.role);
  });

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

  const { actions: topbarActions } = useTopbarActions();

  const renderSidebarBadge = (label) => {
    const count = getMenuNotificationCount(label);
    if (!count) return null;
    return <em className="nav-notification-badge">{count > 99 ? "99+" : count}</em>;
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
          <div className="brand-mark-svg" style={{
            background: "#eff6ff",
            border: "1px solid #dbeafe",
            padding: "5px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px"
          }}>
            <img 
              src={brandLogo} 
              alt="Asset Management Logo" 
              style={{ 
                width: "100%", 
                height: "100%", 
                objectFit: "contain", 
                mixBlendMode: "multiply" 
              }} 
            />
          </div>
          <div className="brand-text" style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-main)", lineHeight: "1.2", letterSpacing: "-0.01em" }}>
              Asset Management
            </span>
            <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              System
            </span>
          </div>
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
          <button
            type="button"
            className="sidebar-close"
            onClick={() => setIsSidebarOpen(false)}
          >
            <FaTimes />
          </button>
        </div>

        <nav className="side-nav">
          {visibleNavItems.map((item) => {
            if (item.children?.length) {
              const isMasters = item.key === "masters";
              const isSetup = item.key === "setup";
              const isOpen = isMasters ? mastersOpen : (isSetup ? setupOpen : false);
              const setOpen = isMasters ? setMastersOpen : (isSetup ? setSetupOpen : () => {});
              const isActive = isMasters
                ? (location.pathname.startsWith("/masters") || location.pathname === "/master-editor")
                : (isSetup ? location.pathname.startsWith("/setup") : false);
              return (
                <div className="nav-group" key={item.key || item.label}>
                  <button
                    type="button"
                    className={`nav-link nav-group-toggle ${isActive ? "active" : ""}`}
                    onClick={() => setOpen((open) => !open)}
                    aria-expanded={isOpen}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {renderSidebarBadge(item.label)}
                    <FaChevronDown
                      className={`nav-chevron ${isOpen ? "open" : ""}`}
                    />
                  </button>
                  {isOpen && (
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
                {renderSidebarBadge(item.label)}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="main-container">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
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
            {topbarActions && (
              <div className="topbar-master-actions">
                <button type="button" className="reset-master-btn" onClick={topbarActions.onReset}>Reset Defaults</button>
                <button type="button" className="save-master-btn" onClick={topbarActions.onSave}>Save</button>
              </div>
            )}
            <div className="notification-dropdown-container" ref={notifRef}>
              <button
                type="button"
                className={`notification-btn ${isNotifOpen ? "active" : ""}`}
                aria-label={`Notifications (${unreadCount} unread)`}
                aria-expanded={isNotifOpen}
                onClick={toggleNotifications}
              >
                <FaBell />
                {unreadCount > 0 ? (
                  <em className="notification-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </em>
                ) : null}
              </button>
              {isNotifOpen && (
                <div className="notification-dropdown-menu">
                  <div className="notification-dropdown-head">
                    <div>
                      <strong>Notifications</strong>
                      <span>{unreadCount} unread / {notifications.length} total</span>
                    </div>
                    {unreadCount > 0 ? (
                      <button
                        type="button"
                        className="notification-mark-read-btn"
                        onClick={markAllCurrentNotificationsRead}
                      >
                        Mark all read
                      </button>
                    ) : null}
                  </div>
                  {notifications.length ? (
                    <ul className="notification-list">
                      {notifications.slice(0, 12).map((item) => (
                        <li
                          key={item.id}
                          className={`notification-item notification-item--${item.type || "info"} ${isNotificationUnread(item, user) ? "unread" : ""}`}
                          onClick={() => openNotification(item)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              openNotification(item);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="notification-item-title-row">
                            <strong>{item.title}</strong>
                            {item.meta?.menuLabel ? (
                              <span>{item.meta.menuLabel}</span>
                            ) : null}
                          </div>
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
                type="button"
                className="profile-trigger-btn"
                aria-label="Profile menu"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {user?.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt="Profile"
                    className="profile-trigger-photo"
                  />
                ) : (
                  <FaUser className="profile-avatar-icon" />
                )}
              </button>

              {isDropdownOpen && (
                <div className="profile-dropdown-menu">
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate("/profile");
                    }}
                  >
                    My Profile
                  </button>
                  <div className="dropdown-divider"></div>
                  <button type="button" className="dropdown-item logout" onClick={logoutUser}>
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

function AppLayoutWithProvider() {
  return (
    <TopbarActionsProvider>
      <AppLayout />
    </TopbarActionsProvider>
  );
}

export default AppLayoutWithProvider;
