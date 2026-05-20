function MasterPageHeader({ kicker, title, subtitle, onReset, onSave }) {
  return (
    <div className="master-editor-header">
      <div>
        <p>{kicker}</p>
        <h2>{title}</h2>
        {subtitle ? <span>{subtitle}</span> : null}
      </div>
      <div className="master-editor-actions">
        <button type="button" className="reset-master-btn" onClick={onReset}>
          Reset Defaults
        </button>
        <button type="button" className="save-master-btn" onClick={onSave}>
          Save
        </button>
      </div>
    </div>
  );
}

export default MasterPageHeader;
