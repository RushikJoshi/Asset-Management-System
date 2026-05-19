import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchAssetList } from "../store/slices/assetSlice";
import { buildStats, currency, groupByCount } from "../utils/assetUtils";
import { ROUTE_ROLES } from "../utils/permissions";
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  Legend
} from "recharts";
import { motion } from "framer-motion";
import {
  FaCheckCircle, FaWrench, FaShieldAlt, FaBoxOpen, FaHistory, FaPlus
} from "react-icons/fa";
import "./Dashboard.css";

// Colors for Recharts
const COLORS = ['#2185f3', '#4ea5ff', '#2563EB', '#64748B', '#F59E0B', '#EF4444'];

function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { assetListData } = useSelector((state) => state.assetList);
  const stats = buildStats(assetListData);

  useEffect(() => {
    dispatch(fetchAssetList());
  }, [dispatch]);

  const recent = assetListData
    .flatMap((asset) =>
      (asset.lifecycleTimeline || []).map((event) => ({
        ...event,
        assetName: asset.assetName,
        assetCode: asset.assetCode,
      }))
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  const statusData = Object.entries(groupByCount(assetListData, "assetStatus")).map(([name, value]) => ({ name, value }));
  const categoryData = Object.entries(groupByCount(assetListData, "category")).map(([name, value]) => ({ name, value }));

  return (
    <div className="dashboard-container">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="dashboard-hero"
      >
        <div className="hero-content">
          <h1>Welcome back, {user?.name || "Admin"} 👋</h1>
          <p>Track and manage your company assets efficiently.</p>
        </div>
        {ROUTE_ROLES["/add-asset"]?.includes(user?.role) && (
          <button onClick={() => navigate("/add-asset")} className="primary-action hero-btn">
            <FaPlus style={{ marginRight: '6px' }} /> Quick Add Asset
          </button>
        )}
      </motion.div>

      {/* Compact KPI Cards */}
      <div className="dashboard-kpi-row">
        {[
          { label: "Total Assets", value: stats.total, icon: <FaBoxOpen />, trend: "+12 this month", color: "#2185f3" },
          { label: "Available", value: stats.available, icon: <FaCheckCircle />, trend: "Ready to assign", color: "#10B981" },
          { label: "Under Repair", value: stats.repair, icon: <FaWrench />, trend: "Needs attention", color: "#F59E0B" },
          { label: "Warranty Alerts", value: stats.warranty, icon: <FaShieldAlt />, trend: "Expiring soon", color: "#EF4444" },
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="dashboard-kpi-card"
          >
            <div className="kpi-left">
              <span className="kpi-title-label">{kpi.label}</span>
              <strong className="kpi-value-text">{kpi.value}</strong>
              <span className="kpi-sub-trend">{kpi.trend}</span>
            </div>
            <div className="kpi-right-icon" style={{ color: kpi.color, backgroundColor: `${kpi.color}12` }}>
              {kpi.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main 2-Column Grid */}
      <div className="dashboard-main-grid">
        {/* Left Column: Analytics Charts (8 cols / 2fr) */}
        <div className="dashboard-charts-column">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="dashboard-chart-card"
          >
            <h3 className="dashboard-chart-title">Asset Status</h3>
            <div className="dashboard-chart-wrapper">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={28} outerRadius={42} paddingAngle={4} dataKey="value">
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '6px', border: 'none', fontSize: '11px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
                    <Legend iconSize={6} wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="muted-text">No data available</p>}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="dashboard-chart-card"
          >
            <h3 className="dashboard-chart-title">Assets by Category</h3>
            <div className="dashboard-chart-wrapper">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={28} outerRadius={42} paddingAngle={4} dataKey="value">
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '6px', border: 'none', fontSize: '11px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
                    <Legend iconSize={6} wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="muted-text">No data available</p>}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Compact Activity Timeline (4 cols / 1fr) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="dashboard-activity-panel"
        >
          <div className="activity-panel-header">
            <h3>Recent Activity Timeline</h3>
            <FaHistory className="timeline-header-icon" />
          </div>
          <div className="timeline-scroller">
            {recent.length > 0 ? recent.map((item, index) => (
              <div className="timeline-row-item" key={index}>
                <div className="timeline-indicator-dot"></div>
                <div className="timeline-row-content">
                  <div className="timeline-row-header">
                    <strong>{item.assetName}</strong>
                    <span className="timeline-row-time">{new Date(item.date).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="timeline-row-desc">{item.title} • {item.detail}</div>
                </div>
              </div>
            )) : (
              <div className="timeline-empty-message">No recent activities found.</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Dashboard;
