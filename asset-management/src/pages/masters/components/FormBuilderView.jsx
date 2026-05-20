import { useCallback, useRef } from "react";
import ConfirmDeleteModal from "../../../components/common/ConfirmDeleteModal";

function FormBuilderView({ builder }) {
  const builderRef = useRef(null);
  const fieldLabelRef = useRef(null);
  const {
    config,
    sections,
    sectionOptions,
    newFieldLabel,
    setNewFieldLabel,
    selectedSection,
    setSelectedSection,
    newSectionTitle,
    setNewSectionTitle,
    newSectionDescription,
    setNewSectionDescription,
    editingField,
    setEditingField,
    editingLabel,
    setEditingLabel,
    editingSection,
    editingSectionTitle,
    setEditingSectionTitle,
    editingSectionDescription,
    setEditingSectionDescription,
    dragItem,
    setDragItem,
    sectionDeleteTarget,
    setSectionDeleteTarget,
    updateField,
    handleSectionDragStart,
    handleFieldDragStart,
    handleSectionDrop,
    handleFieldDrop,
    editFieldName,
    saveFieldName,
    startSectionEdit,
    saveSectionName,
    deleteField,
    confirmDeleteSection,
    addCustomField,
    addFieldToSection,
    setEditingSection,
  } = builder;

  const handleAddFieldHere = useCallback(
    (section) => {
      addFieldToSection(section);
      window.setTimeout(() => {
        builderRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        builderRef.current?.classList.add("is-highlight");
        fieldLabelRef.current?.focus({ preventScroll: true });
        window.setTimeout(() => builderRef.current?.classList.remove("is-highlight"), 2200);
      }, 80);
    },
    [addFieldToSection],
  );

  return (
    <>
      <div className="custom-field-builder" ref={builderRef} id="custom-field-builder">
        <div className="cfb-top-row">
          <h3>Add Custom Field</h3>
          <select value={selectedSection} onChange={(event) => setSelectedSection(event.target.value)}>
          {sectionOptions.map((section) => (
            <option value={section.key} key={section.key}>
              {section.title}
            </option>
          ))}
          <option value="__new__">Create New Header</option>
          </select>
        </div>

        {selectedSection === "__new__" && (
          <div className="new-header-card">
            <p className="new-header-card-title">New header</p>
            <div className="new-header-card-grid">
              <label className="cfb-label">
                <span>Header name</span>
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(event) => setNewSectionTitle(event.target.value)}
                  placeholder="e.g. Warranty Details"
                />
              </label>
              <label className="cfb-label">
                <span>Description (optional)</span>
                <input
                  type="text"
                  value={newSectionDescription}
                  onChange={(event) => setNewSectionDescription(event.target.value)}
                  placeholder="Short note for this section"
                />
              </label>
            </div>
          </div>
        )}

        <div className="cfb-field-row">
          <label className="cfb-label cfb-field-label-grow">
            <span>Field label</span>
            <input
              ref={fieldLabelRef}
              type="text"
              value={newFieldLabel}
              onChange={(event) => setNewFieldLabel(event.target.value)}
              placeholder="Enter field label"
            />
          </label>
          <button type="button" className="save-master-btn cfb-add-btn" onClick={addCustomField}>
            Add Field
          </button>
        </div>
      </div>

      <div className="master-section-list">
        {sections.map((section) => (
          <section
            className={`master-section ${dragItem?.sectionKey === section.key ? "is-dragging" : ""}`}
            draggable={editingSection !== section.key}
            key={section.key}
            onDragStart={(event) => handleSectionDragStart(event, section)}
            onDragEnd={() => setDragItem(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleSectionDrop(event, section)}
          >
            <div className="master-section-heading">
              {editingSection === section.key ? (
                <div className="section-edit-fields">
                  <input
                    className="section-name-input"
                    type="text"
                    value={editingSectionTitle}
                    onChange={(event) => setEditingSectionTitle(event.target.value)}
                    placeholder="Header name"
                  />
                  <input
                    className="section-description-input"
                    type="text"
                    value={editingSectionDescription}
                    onChange={(event) => setEditingSectionDescription(event.target.value)}
                    placeholder="Header description"
                  />
                </div>
              ) : (
                <div className="section-title-block">
                  <div className="section-title-row">
                    <span className="drag-handle" title="Drag header">
                      Drag
                    </span>
                    <h3>{section.title}</h3>
                  </div>
                  {section.description && <p>{section.description}</p>}
                </div>
              )}
              <div className="section-actions">
                {editingSection === section.key ? (
                  <>
                    <button type="button" className="field-edit-btn" onClick={() => saveSectionName(section)}>
                      Save
                    </button>
                    <button
                      type="button"
                      className="field-cancel-btn"
                      onClick={() => {
                        setEditingSection(null);
                        setEditingSectionDescription("");
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="field-edit-btn" onClick={() => startSectionEdit(section)}>
                      Edit Header
                    </button>
                    <button
                      type="button"
                      className="field-delete-btn"
                      onClick={() => setSectionDeleteTarget(section)}
                    >
                      Delete Header
                    </button>
                  </>
                )}
                <button type="button" className="save-master-btn" onClick={() => handleAddFieldHere(section)}>
                  Add Field Here
                </button>
              </div>
            </div>
            <div className="master-field-grid">
              {section.fields.map((field) => {
                const fieldConfig = config[field.name] || {};
                return (
                  <div
                    className={`master-field-card ${dragItem?.fieldName === field.name ? "is-dragging" : ""}`}
                    draggable={editingField !== field.name}
                    key={field.name}
                    onDragStart={(event) => handleFieldDragStart(event, section, field)}
                    onDragEnd={() => setDragItem(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleFieldDrop(event, section, field)}
                  >
                    <div>
                      {editingField === field.name ? (
                        <input
                          className="field-name-input"
                          type="text"
                          value={editingLabel}
                          onChange={(event) => setEditingLabel(event.target.value)}
                        />
                      ) : (
                        <div className="field-title-row">
                          <span className="drag-handle" title="Drag field">
                            Drag
                          </span>
                          <strong>{field.label}</strong>
                        </div>
                      )}
                      <span>{field.name}</span>
                    </div>
                    <div className="master-field-controls">
                      <label className="master-toggle">
                        <input
                          type="checkbox"
                          checked={fieldConfig.visible}
                          disabled={fieldConfig.locked}
                          onChange={(event) => updateField(field.name, "visible", event.target.checked)}
                        />
                        Visible
                      </label>
                      <label className="master-toggle">
                        <input
                          type="checkbox"
                          checked={fieldConfig.required}
                          disabled={!fieldConfig.visible || fieldConfig.locked}
                          onChange={(event) => updateField(field.name, "required", event.target.checked)}
                        />
                        Required
                      </label>
                      {editingField === field.name ? (
                        <>
                          <button type="button" className="field-edit-btn" onClick={() => saveFieldName(field)}>
                            Save
                          </button>
                          <button type="button" className="field-cancel-btn" onClick={() => setEditingField(null)}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button type="button" className="field-edit-btn" onClick={() => editFieldName(field)}>
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        className="field-delete-btn"
                        disabled={fieldConfig.locked}
                        onClick={() => deleteField({ ...field, locked: fieldConfig.locked })}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <ConfirmDeleteModal
        open={Boolean(sectionDeleteTarget)}
        title="DELETE HEADER PERMANENTLY?"
        message={
          sectionDeleteTarget
            ? `If you delete "${sectionDeleteTarget.title}", its header and fields will be removed. Continue?`
            : ""
        }
        onCancel={() => setSectionDeleteTarget(null)}
        onConfirm={confirmDeleteSection}
      />
    </>
  );
}

export default FormBuilderView;
