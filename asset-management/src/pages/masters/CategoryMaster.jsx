import MasterPageHeader from "./components/MasterPageHeader";
import CategoryCatalogPanel from "./components/CategoryCatalogPanel";
import { useCategoryCatalog } from "./useCategoryCatalog";
import "../MasterEditor.css";

function CategoryMaster() {
  const catalog = useCategoryCatalog();

  return (
    <div className="master-editor-page">
      <MasterPageHeader
        kicker="Masters"
        title="Categories"
        subtitle="Manage category and sub-category dropdowns for assets and requests."
        onReset={catalog.resetDefaults}
        onSave={catalog.saveChanges}
      />
      <CategoryCatalogPanel
        rows={catalog.categoryRows}
        onAdd={catalog.addCategoryRow}
        onUpdate={catalog.updateCategoryRow}
        onRemove={catalog.removeCategoryRow}
      />
    </div>
  );
}

export default CategoryMaster;
