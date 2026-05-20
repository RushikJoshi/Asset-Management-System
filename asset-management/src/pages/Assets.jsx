import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchAssetList } from "../store/slices/assetSlice";
import { buildStats } from "../utils/assetUtils";
import { FaLaptop, FaTv, FaKeyboard, FaChair, FaBoxOpen, FaEllipsisV } from "react-icons/fa";
import { motion } from "framer-motion";
import "./Assets.css";

function getAssetIcon(category) {
  const cat = String(category).toLowerCase();
  if (cat.includes("laptop")) return <FaLaptop />;
  if (cat.includes("monitor") || cat.includes("display") || cat.includes("electronics")) return <FaTv />;
  if (cat.includes("keyboard") || cat.includes("accessories")) return <FaKeyboard />;
  if (cat.includes("chair") || cat.includes("furniture")) return <FaChair />;
  return <FaBoxOpen />;
}

function Assets() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { assetListData } = useSelector((state) => state.assetList);
  const stats = buildStats(assetListData);

  useEffect(() => {
    dispatch(fetchAssetList());
  }, [dispatch]);

  // Prepare recent assets (limit to 3 rows)
  const recentAssets = assetListData.slice(0, 3).map((a) => ({
    assetName: a.assetName,
    serialNumber: a.serialNumber || "-",
    category: a.category || "IT Equipment",
    assetStatus: a.assetStatus || "AVAILABLE",
    assignedTo: a.assignedTo || "-",
    purchaseDate: a.purchaseDate ? new Date(a.purchaseDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
  }));

  return (
    <div className="assets-container">
      {/* KPI Cards */}
      <div className="kpi-cards-grid">
        {[{ label: "Total Assets", value: stats.total },
          { label: "Available", value: stats.available },
          { label: "Assigned", value: stats.assigned },
          { label: "Under Repair", value: stats.repair },
          { label: "Warranty Alerts", value: stats.warranty }].map((kpi, idx) => (
          <motion.div key={kpi.label} className="kpi-card-new" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
            <div className="kpi-card-content">
              <span className="kpi-card-label">{kpi.label}</span>
              <strong className="kpi-card-value">{kpi.value}</strong>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Assets Table */}
      <div className="assets-table">
        <h3>Recent Assets</h3>
        <table className="table-new">
          <thead>
            <tr>
              <th>Asset Name</th>
              <th>Serial No</th>
              <th>Category</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Added On</th>
            </tr>
          </thead>
          <tbody>
            {recentAssets.map((row, idx) => (
              <tr key={idx}>
                <td>
                  <div className="table-asset-name-block">
                    <div className="table-asset-icon-box">{getAssetIcon(row.assetName)}</div>
                    <span>{row.assetName}</span>
                  </div>
                </td>
                <td>{row.serialNumber}</td>
                <td>{row.category}</td>
                <td><span className={`status-pill-new ${row.assetStatus.toLowerCase().replace(/_/g, "-")}`}>{row.assetStatus.replace(/_/g, " ").toLowerCase()}</span></td>
                <td>{row.assignedTo}</td>
                <td>{new Date(row.purchaseDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="assets-footer-link">
          <span onClick={() => navigate("/assets")}>View all assets →</span>
        </div>
      </div>
    </div>
  );
}

export default Assets;
