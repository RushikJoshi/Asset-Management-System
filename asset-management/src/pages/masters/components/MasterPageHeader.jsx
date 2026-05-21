function MasterPageHeader({ kicker, title, onReset, onSave }) {
  return (
    <div className="master-editor-header">
      <div className="master-editor-title-block">
        <h2 className="master-editor-title">{title}</h2>
      </div>
      <div className="master-editor-actions">
        <button type="button" className="reset-master-btn" onClick={onReset}>Reset Defaults</button>
        <button type="button" className="save-master-btn" onClick={onSave}>Save</button>
      </div>
    </div>
  );
}

export default MasterPageHeader;
