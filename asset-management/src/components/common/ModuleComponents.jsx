import { useNavigate } from "react-router-dom";
import "./ModuleComponents.css";

export function PageTitle({ action }) {
  if (!action) return null;
  return (
    <div className="module-title" style={{ justifyContent: "flex-end", minHeight: "auto", marginBottom: "16px", padding: 0 }}>
      <div className="module-title-action">{action}</div>
    </div>
  );
}

export function KpiGrid({ items, action }) {
  return (
    <div className="module-kpi-grid-container">
      <div className="module-kpi-grid">
        {items.map((item) => (
          <div 
            className="module-kpi" 
            key={item.label}
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "flex-start", 
              justifyContent: "center", 
              gap: "6px", 
              height: "76px", 
              minHeight: "76px",
              maxHeight: "76px",
              width: "228px",
              boxSizing: "border-box"
            }}
          >
            <span style={{ color: "var(--text-muted)", fontSize: "10.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", lineHeight: 1.2 }}>
              {item.label}
            </span>
            <strong style={{ color: "var(--text-main)", fontSize: "20px", fontWeight: 700, lineHeight: 1 }}>
              {item.value}
            </strong>
          </div>
        ))}
      </div>
      {action && (
        <div className="module-kpi-action" style={{ display: "flex", alignItems: "center" }}>
          {action}
        </div>
      )}
    </div>
  );
}

export function DataTable({ columns, rows, emptyText = "No records found" }) {
  return (
    <div className="module-table-wrap">
      <table className="module-table">
        <thead>
          <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, index) => (
            <tr key={row._id || row.id || index}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row, index) : row[column.key] || "-"}</td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={columns.length} className="module-empty">{emptyText}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function MiniBars({ title, data }) {
  const entries = Object.entries(data || {});
  const max = Math.max(...entries.map(([, value]) => Number(value)), 1);

  return (
    <section className="chart-panel">
      <h3>{title}</h3>
      <div className="mini-bars">
        {entries.length ? entries.map(([label, value]) => (
          <div className="mini-bar-row" key={label}>
            <span>{label}</span>
            <div><i style={{ width: `${(Number(value) / max) * 100}%` }} /></div>
            <strong>{value}</strong>
          </div>
        )) : <p className="muted">No data yet</p>}
      </div>
    </section>
  );
}

export function AssetLink({ asset }) {
  const navigate = useNavigate();
  return (
    <button className="text-action" onClick={() => navigate(`/asset-details/${asset._id}`)}>
      {asset.assetName}
    </button>
  );
}
