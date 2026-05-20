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
            <button type="button" className="field-delete-btn" onClick={() => onRemove(row.id)}>
              Remove
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="save-master-btn category-add-btn" onClick={onAdd}>
        Add category
      </button>
    </div>
  );
}

export default CategoryCatalogPanel;
