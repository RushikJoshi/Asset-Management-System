import { useNavigate } from "react-router-dom";
import "./ModuleComponents.css";

export function PageTitle({ eyebrow, title, description, action }) {
  return (
    <div className="module-title">
      <div>
        <p>{eyebrow}</p>
        <h2>{title}</h2>
        {description && <span>{description}</span>}
      </div>
      {action}
    </div>
  );
}

export function KpiGrid({ items }) {
  return (
    <div className="module-kpi-grid">
      {items.map((item) => (
        <div className="module-kpi" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
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
