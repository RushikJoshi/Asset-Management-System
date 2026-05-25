function CategoryCatalogPanel({ rows, onAdd, onUpdate, onRemove }) {
  return (
    <div className="category-catalog-panel">
      <h3>Category &amp; sub-category catalog</h3>
      <p className="category-catalog-help">
        These categories appear as <strong>dropdowns</strong> on Add/Edit Asset (and on requests, same list).
        Turn on <strong>Network / computer</strong> for categories that should show <em>IP Configuration</em> and{" "}
        <em>Computer Specifications</em>. Other categories show a <em>Remarks</em> block instead of IP fields.
      </p>
      <div className="category-catalog-head">
        <span>Category name</span>
        <span>Sub-categories (comma-separated)</span>
        <span>Network / computer</span>
        <span />
      </div>
      <div className="category-catalog-rows">
        {rows.map((row) => (
          <div className="category-catalog-row" key={row.id}>
            <input
              type="text"
              value={row.name ?? ""}
              onChange={(event) => onUpdate(row.id, { name: event.target.value })}
              placeholder={String(row.name || "").trim() ? "e.g. Laptop" : "New category"}
            />
            <input
              type="text"
              value={(row.subCategories || []).join(", ")}
              onChange={(event) =>
                onUpdate(row.id, {
                  subCategories: event.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="e.g. Business Laptop, Ultrabook"
            />
            <label className="category-network-toggle">
              <input
                type="checkbox"
                checked={row.network}
                onChange={(event) => onUpdate(row.id, { network: event.target.checked })}
              />
              <span>IP + computer specs</span>
            </label>
            <button 
              type="button" 
              className="field-delete-btn" 
              onClick={() => onRemove(row.id)}
              style={{
                backgroundColor: "#ef4444",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#dc2626"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#ef4444"}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button 
        type="button" 
        className="save-master-btn category-add-btn" 
        onClick={onAdd}
        style={{
          backgroundColor: "#2563eb",
          color: "#ffffff",
          border: "none",
          borderRadius: "6px",
          padding: "8px 16px",
          fontSize: "13px",
          fontWeight: "600",
          cursor: "pointer",
          boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
          transition: "background-color 0.2s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1d4ed8"}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#2563eb"}
      >
        Add category
      </button>
    </div>
  );
}

export default CategoryCatalogPanel;
