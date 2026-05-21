import { RotateCcw, Save } from "lucide-react";

function MasterPageHeader({ kicker, title, subtitle, onReset, onSave }) {
  // kicker, title, subtitle are intentionally not rendered here to avoid duplicate headings.
  return (
    <div className="master-editor-header">
      <div className="master-editor-actions">
        <button type="button" className="reset-master-btn" onClick={onReset}>
          <RotateCcw size={15} />
          Reset Defaults
        </button>
        <button type="button" className="save-master-btn" onClick={onSave}>
          <Save size={15} />
          Save
        </button>
      </div>
    </div>
  );
}

export default MasterPageHeader;
