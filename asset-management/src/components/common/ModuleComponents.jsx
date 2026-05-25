import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ModuleComponents.css";

export function TablePagination({ totalItems, currentPage, pageSize, onPageChange, displayedCount }) {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }
      
      if (start > 2) {
        pages.push("...");
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push("...");
      }
      
      pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="module-pagination-bar">
      <div className="module-pagination-left">
        <span className="pagination-info-text">
          Showing {displayedCount || 0} Of {totalItems}
        </span>
      </div>
      
      <div className="module-pagination-right">
        <button 
          className="pagination-btn arrow-btn" 
          onClick={() => onPageChange(1)} 
          disabled={currentPage === 1}
          title="First Page"
          type="button"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="12" r="2.5" fill="currentColor"></circle>
            <circle cx="13" cy="12" r="2.5" fill="currentColor"></circle>
            <line x1="20" y1="5" x2="20" y2="19"></line>
          </svg>
        </button>
        <button 
          className="pagination-btn arrow-btn" 
          onClick={() => onPageChange(Math.max(1, currentPage - 1))} 
          disabled={currentPage === 1}
          title="Previous Page"
          type="button"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="12" r="2.5" fill="currentColor"></circle>
            <line x1="16" y1="5" x2="16" y2="19"></line>
          </svg>
        </button>
        
        {pages.map((p, idx) => {
          if (p === "...") {
            return <span key={`dots-${idx}`} className="pagination-dots">...</span>;
          }
          const isActive = currentPage === p;
          return (
            <button 
              key={`page-${p}`} 
              className={`pagination-btn num-btn ${isActive ? "active" : ""}`}
              onClick={() => onPageChange(p)}
              type="button"
            >
              {p}
            </button>
          );
        })}
        
        <button 
          className="pagination-btn arrow-btn" 
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} 
          disabled={currentPage === totalPages}
          title="Next Page"
          type="button"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="5" x2="8" y2="19"></line>
            <circle cx="16" cy="12" r="2.5" fill="currentColor"></circle>
          </svg>
        </button>
        <button 
          className="pagination-btn arrow-btn" 
          onClick={() => onPageChange(totalPages)} 
          disabled={currentPage === totalPages}
          title="Last Page"
          type="button"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="5" x2="4" y2="19"></line>
            <circle cx="11" cy="12" r="2.5" fill="currentColor"></circle>
            <circle cx="18" cy="12" r="2.5" fill="currentColor"></circle>
          </svg>
        </button>
      </div>
    </div>
  );
}

export function TablePageSizeSelector({ pageSize, onPageSizeChange }) {
  return (
    <div className="module-table-top-bar">
      <select 
        value={pageSize} 
        onChange={(e) => onPageSizeChange(Number(e.target.value))} 
        className="pagination-select compact-select"
      >
        <option value="20">20</option>
        <option value="30">30</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </select>
    </div>
  );
}

export function PageTitle({ action }) {
  if (!action) return null;
  return (
    <div className="module-title" style={{ justifyContent: "flex-end", minHeight: "auto", marginBottom: "8px", padding: 0 }}>
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
              gap: "4px", 
              height: "64px", 
              minHeight: "64px",
              maxHeight: "64px",
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    setCurrentPage(1);
  }, [rows.length]);

  const totalRows = rows.length;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRows);
  const slicedRows = rows.slice(startIndex, endIndex);

  return (
    <div className="module-table-card">
      <div className="module-table-scroll-area">
        <table className="module-table">
          <thead>
            <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
          </thead>
          <tbody>
            {slicedRows.length ? slicedRows.map((row, index) => (
              <tr key={row._id || row.id || index}>
                {columns.map((column) => (
                  <td key={column.key}>{column.render ? column.render(row, startIndex + index) : row[column.key] || "-"}</td>
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
      
      {totalRows > 0 && (
        <TablePagination
          totalItems={totalRows}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          displayedCount={slicedRows.length}
        />
      )}
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
