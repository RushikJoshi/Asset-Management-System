import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
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
} from "react-icons/fa";
import logoImage from "../../images/logo.jpeg";
import { logout } from "../../store/slices/authSlice";
import { ROLE_LABELS, ROUTE_ROLES } from "../../utils/permissions";
import "./AppLayout.css";

const navItems = [
  { to: "/", label: "Dashboard", icon: <FaHome />, menuRoles: ["SUPER_ADMIN", "ADMIN"] },
  { to: "/assets", label: "Assets", icon: <FaLaptop />, menuRoles: ["SUPER_ADMIN", "ADMIN", "IT_STAFF"] },
  { to: "/master-editor", label: "Master Editor", icon: <FaEdit />, menuRoles: ["SUPER_ADMIN", "ADMIN", "IT_STAFF"] },
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

function AppLayout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const visibleNavItems = navItems.filter((item) =>
    item.menuRoles.includes(user?.role),
  );

  const logoutUser = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <div className="shell">
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="brand-block">
          <div className="brand-mark">
            <img src={logoImage} alt="AssetPro logo" className="brand-logo" />
          </div>
          <div>
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
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <FaBars />
            </button>
            <div>
              <p className="topbar-kicker">Enterprise Asset Management</p>
              <h1>Company Asset Control Center</h1>
              <p className="role-line">{user?.name} | {ROLE_LABELS[user?.role] || user?.role}</p>
            </div>
          </div>
          <div className="topbar-actions">
            {ROUTE_ROLES["/scan-demo"]?.includes(user?.role) && (
              <button onClick={() => navigate("/scan-demo")} className="ghost-action">QR Console</button>
            )}
            {ROUTE_ROLES["/add-asset"]?.includes(user?.role) && (
              <button onClick={() => navigate("/add-asset")} className="primary-action">Add Asset</button>
            )}
            <button onClick={logoutUser} className="ghost-action">Logout</button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
