import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchAssetList } from "../store/slices/assetSlice";
import { buildStats, getInventoryAssets, warrantyDays } from "../utils/assetUtils";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaWrench,
  FaShieldAlt,
  FaBoxOpen,
  FaSyncAlt,
  FaLaptop,
  FaTv,
  FaKeyboard,
  FaChair,
  FaEllipsisV,
} from "react-icons/fa";
import "./Dashboard.css";

const STATUS_COLORS = {
  AVAILABLE: "#0D9488",
  ASSIGNED: "#2563EB",
  UNDER_REPAIR: "#F59E0B",
  RETIRED: "#EF4444",
};

const RETIRED_STATUSES = ["RETIRED", "DISPOSED", "RECYCLED"];

const formatStatus = (status = "") =>
  String(status || "AVAILABLE").replace(/_/g, " ").toLowerCase();

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatShortDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const percentOf = (value, total, precision = 1) =>
  total > 0 ? ((value / total) * 100).toFixed(precision) : "0.0";

const toStatusChartData = (stats) => [
  { name: "Available", value: stats.available, color: STATUS_COLORS.AVAILABLE },
  { name: "Assigned", value: stats.assigned, color: STATUS_COLORS.ASSIGNED },
  { name: "Under Repair", value: stats.repair, color: STATUS_COLORS.UNDER_REPAIR },
  {
    name: "Retired",
    value: stats.retired,
    color: STATUS_COLORS.RETIRED,
  },
];

function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { assetListData, loading } = useSelector((state) => state.assetList);
  const dbAssets = getInventoryAssets(assetListData);
  const stats = {
    ...buildStats(assetListData),
    retired: dbAssets.filter((asset) =>
      RETIRED_STATUSES.includes(asset.assetStatus),
    ).length,
  };

  useEffect(() => {
    dispatch(fetchAssetList());
  }, [dispatch]);

  const statusChartData = toStatusChartData(stats);

  const categories = Object.entries(
    dbAssets.reduce((acc, asset) => {
      const category = asset.category || "Unassigned";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, count], index) => ({
      label,
      count,
      pct: Math.round((count / Math.max(stats.total, 1)) * 100),
      color: ["#0D9488", "#2563EB", "#F59E0B", "#EF4444"][index],
    }));

  const finalEvents = dbAssets
    .flatMap((asset) => {
      const timeline = asset.lifecycleTimeline?.length
        ? asset.lifecycleTimeline
        : [
            {
              title: "Asset Registered",
              detail: `${asset.assetName || "Asset"} was registered in inventory.`,
              date: asset.createdAt || asset.purchaseDate,
            },
          ];

      return timeline.map((event) => ({
        assetName: asset.assetName || asset.assetCode || "Asset",
        detail: event.detail || event.title || "Activity recorded.",
        time: formatShortDate(event.date || asset.updatedAt || asset.createdAt),
        sortDate: event.date || asset.updatedAt || asset.createdAt,
        status: asset.assetStatus,
        category: asset.category,
      }));
    })
    .sort((a, b) => new Date(b.sortDate || 0) - new Date(a.sortDate || 0));

  const recentAssetsList = [...dbAssets]
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.purchaseDate || 0) -
        new Date(a.createdAt || a.purchaseDate || 0),
    )
    .map((asset) => ({
      assetName: asset.assetName || asset.assetCode || "Unnamed Asset",
      serialNumber: asset.serialNumber || "-",
      category: asset.category || "Unassigned",
      assetStatus: asset.assetStatus || "AVAILABLE",
      assignedTo: asset.assignedTo || "-",
      addedOn: asset.createdAt || asset.purchaseDate,
    }));

  const finalAlerts = dbAssets
    .filter((asset) => {
      const days = warrantyDays(asset);
      return days !== null && days >= 0 && days <= Number(asset.warrantyReminderDays || 10);
    })
    .map((asset) => ({
      assetName: asset.assetName || asset.assetCode || "Unnamed Asset",
      expiration: formatDate(asset.warrantyEnd),
      daysLeft: warrantyDays(asset),
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const getAssetIcon = (categoryOrName) => {
    const value = String(categoryOrName || "").toLowerCase();
    if (value.includes("laptop") || value.includes("desktop") || value.includes("pc")) {
      return <FaLaptop />;
    }
    if (value.includes("monitor") || value.includes("display") || value.includes("electronics")) {
      return <FaTv />;
    }
    if (value.includes("keyboard") || value.includes("accessor")) return <FaKeyboard />;
    if (value.includes("chair") || value.includes("furniture") || value.includes("table")) {
      return <FaChair />;
    }
    return <FaBoxOpen />;
  };

  const getStatusIconColor = (status) => {
    if (status === "AVAILABLE") return { bg: "#E6F7F0", color: "#0D9488" };
    if (status === "ASSIGNED") return { bg: "#EBF5FF", color: "#2563EB" };
    if (status === "UNDER_REPAIR") return { bg: "#FFF3E0", color: "#F59E0B" };
    return { bg: "#FEE2E2", color: "#EF4444" };
  };

  const emptyText = loading ? "Loading data..." : "No data available";

  return (
    <div className="dashboard-container">
      <div className="kpi-cards-grid">
        {[
          {
            label: "Total Assets",
            value: stats.total.toLocaleString(),
            trend: null,
            trendSub: `${stats.total.toLocaleString()} in inventory`,
            icon: <FaBoxOpen />,
            color: "#0EA5E9",
          },
          {
            label: "Available",
            value: stats.available.toLocaleString(),
            trend: null,
            trendSub: `${percentOf(stats.available, stats.total)}% of total`,
            icon: <FaCheckCircle />,
            color: "#10B981",
          },
          {
            label: "Under Repair",
            value: stats.repair.toLocaleString(),
            trend: null,
            trendSub: `${percentOf(stats.repair, stats.total)}% of total`,
            icon: <FaWrench />,
            color: "#F59E0B",
          },
          {
            label: "Warranty Alerts",
            value: stats.warranty.toLocaleString(),
            trend: null,
            trendSub: stats.warranty ? "Expiring soon" : "No active alerts",
            icon: <FaShieldAlt />,
            color: "#EF4444",
          },
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="kpi-card-new"
          >
            <div className="kpi-card-content">
              <span className="kpi-card-label">{kpi.label}</span>
              <div className="kpi-card-value-row">
                <strong className="kpi-card-value">{kpi.value}</strong>
                {kpi.trend && <span className="kpi-card-trend-badge">{kpi.trend}</span>}
              </div>
              <span className="kpi-card-subtext">{kpi.trendSub}</span>
            </div>
            <div
              className="kpi-card-icon-container"
              style={{ color: kpi.color, backgroundColor: `${kpi.color}15` }}
            >
              {kpi.icon}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="dashboard-middle-grid">
        <div className="dashboard-card-middle">
          <div className="middle-card-header">
            <h3>Asset Overview</h3>
            <button className="card-action-btn-ghost" onClick={() => navigate("/reports")}>
              View Report
            </button>
          </div>

          <div className="donut-chart-flex">
            <div className="donut-chart-wrapper-new">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={48}
                    paddingAngle={stats.total ? 3 : 0}
                    dataKey="value"
                  >
                    {statusChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center-label">
                <span className="donut-center-value">{stats.total.toLocaleString()}</span>
                <span className="donut-center-text">TOTAL</span>
              </div>
            </div>

            <div className="donut-legend-list">
              {statusChartData.map((item) => (
                <div className="donut-legend-item" key={item.name}>
                  <div className="donut-legend-left">
                    <span
                      className="donut-legend-dot"
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <span>{item.name}</span>
                  </div>
                  <div className="donut-legend-right">
                    <span className="donut-legend-value">
                      {item.value.toLocaleString()}
                    </span>
                    <span className="donut-legend-pct">
                      {percentOf(item.value, stats.total)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-card-middle">
          <div className="middle-card-header">
            <h3>Assets by Category</h3>
            <button className="card-action-btn-ghost" onClick={() => navigate("/reports")}>
              View Report
            </button>
          </div>

          <div className="category-bars-list">
            {categories.length ? (
              categories.map((cat) => (
                <div className="category-bar-row" key={cat.label}>
                  <div className="category-bar-label-row">
                    <span className="category-bar-name">{cat.label}</span>
                    <span className="category-bar-stats">
                      {cat.count.toLocaleString()} ({cat.pct}%)
                    </span>
                  </div>
                  <div className="category-bar-track">
                    <div
                      className="category-bar-fill"
                      style={{ width: `${cat.pct}%`, backgroundColor: cat.color }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="dashboard-empty-state">{emptyText}</div>
            )}
          </div>
        </div>

        <div className="dashboard-card-middle">
          <div className="middle-card-header">
            <h3>Recent Activity</h3>
            <button
              className="card-refresh-btn"
              onClick={() => dispatch(fetchAssetList())}
              aria-label="Refresh activity"
            >
              <FaSyncAlt />
            </button>
          </div>

          <div className="activity-list-new">
            {finalEvents.length ? (
              finalEvents.slice(0, 3).map((item, idx) => {
                const styles = getStatusIconColor(item.status);
                return (
                  <div className="activity-item-new" key={`${item.assetName}-${idx}`}>
                    <div
                      className="activity-item-icon-box"
                      style={{ backgroundColor: styles.bg, color: styles.color }}
                    >
                      {getAssetIcon(item.category || item.assetName)}
                    </div>
                    <div className="activity-item-details">
                      <div className="activity-item-title-row">
                        <span className="activity-item-name">{item.assetName}</span>
                        <span className="activity-item-time">{item.time}</span>
                      </div>
                      <span className="activity-item-action">{item.detail}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="dashboard-empty-state">{emptyText}</div>
            )}
          </div>

          <div className="middle-card-footer-link">
            <span onClick={() => navigate("/assets")}>View all activity &rarr;</span>
          </div>
        </div>
      </div>

      <div className="dashboard-bottom-grid">
        <div className="bottom-card-large">
          <div className="middle-card-header">
            <h3>Recent Assets</h3>
          </div>

          <div className="table-responsive-new">
            <table className="table-new">
              <thead>
                <tr>
                  <th>Asset Name</th>
                  <th>Serial No</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Added On</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentAssetsList.length ? (
                  recentAssetsList.slice(0, 3).map((row, idx) => (
                    <tr key={`${row.assetName}-${idx}`}>
                      <td>
                        <div className="table-asset-name-block">
                          <div className="table-asset-icon-box">
                            {getAssetIcon(row.category || row.assetName)}
                          </div>
                          <span>{row.assetName}</span>
                        </div>
                      </td>
                      <td>{row.serialNumber}</td>
                      <td>{row.category}</td>
                      <td>
                        <span
                          className={`status-pill-new ${row.assetStatus
                            .toLowerCase()
                            .replace(/_/g, "-")}`}
                        >
                          {formatStatus(row.assetStatus)}
                        </span>
                      </td>
                      <td>{row.assignedTo}</td>
                      <td>{formatDate(row.addedOn)}</td>
                      <td>
                        <button
                          className="row-action-btn-three-dots"
                          onClick={() => navigate("/assets")}
                          aria-label="Asset Actions"
                        >
                          <FaEllipsisV />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">
                      <div className="dashboard-empty-state">{emptyText}</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="middle-card-footer-link recent-assets-footer">
            <span onClick={() => navigate("/assets")}>View all assets &rarr;</span>
          </div>
        </div>

        <div className="bottom-card-large">
          <div className="middle-card-header">
            <h3>Warranty Alerts</h3>
            <button className="card-action-btn-ghost" onClick={() => navigate("/warranty")}>
              View All
            </button>
          </div>

          <div className="warranty-alerts-list-new">
            {finalAlerts.length ? (
              finalAlerts.slice(0, 3).map((item, idx) => (
                <div className="warranty-alert-row-new" key={`${item.assetName}-${idx}`}>
                  <div className="warranty-alert-left">
                    <div className="warranty-alert-icon-box">
                      <FaShieldAlt />
                    </div>
                    <div className="warranty-alert-text">
                      <span className="warranty-alert-name">{item.assetName}</span>
                      <span className="warranty-alert-exp">
                        Warranty expires on {item.expiration}
                      </span>
                    </div>
                  </div>
                  <span className="warranty-alert-days-badge">
                    {item.daysLeft} days left
                  </span>
                </div>
              ))
            ) : (
              <div className="dashboard-empty-state">{emptyText}</div>
            )}
          </div>

          <div className="middle-card-footer-link warranty-alerts-footer">
            <span onClick={() => navigate("/warranty")}>View all alerts &rarr;</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
