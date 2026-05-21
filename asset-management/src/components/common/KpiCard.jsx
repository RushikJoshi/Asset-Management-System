// src/components/common/KpiCard.jsx
import React from "react";
import { motion } from "framer-motion";
import "./KpiCard.css";

export function KpiCard({ label, value, trend, trendSub, icon, color }) {
  return (
    <motion.div
      className="kpi-card glass-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="kpi-card-content">
        <span className="kpi-card-label">{label}</span>
        <div className="kpi-card-value-row">
          <strong className="kpi-card-value">{value}</strong>
          {trend && <span className="kpi-card-trend-badge">{trend}</span>}
        </div>
        <span className="kpi-card-subtext">{trendSub}</span>
      </div>
      <div
        className="kpi-card-icon-container"
        style={{ color, backgroundColor: `${color}15` }}
      >
        {icon}
      </div>
    </motion.div>
  );
}
