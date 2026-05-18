import { useState } from "react";
import {
  getDefaultAssetFormConfig,
  getAssetFormSections,
  loadAssetFormConfig,
  resetAssetFormConfig,
  saveAssetFormConfig,
} from "../utils/assetFormBuilder";
import { useToast } from "../components/toast/toastStore";
import "./MasterEditor.css";

function MasterEditor() {
  const { showToast } = useToast();
  const [config, setConfig] = useState(() => loadAssetFormConfig());
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [selectedSection, setSelectedSection] = useState("Asset Information");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionDescription, setNewSectionDescription] = useState("");
  const [editingField, setEditingField] = useState(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [editingSection, setEditingSection] = useState(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState("");
  const [editingSectionDescription, setEditingSectionDescription] = useState("");
  const [dragItem, setDragItem] = useState(null);
  const sections = getAssetFormSections(config);
  const sectionOptions = sections.map((section) => ({ key: section.key, title: section.title }));
  const isCustomSection = (sectionKey) =>
    (config.__customSections || []).some((section) => section.key === sectionKey);
  const totalFields = sections.reduce((total, section) => total + section.fields.length, 0);
  const visibleFields = sections.reduce(
    (total, section) =>
      total + section.fields.filter((field) => config[field.name]?.visible).length,
    0,
  );

  const updateField = (name, key, value) => {
    setConfig((current) => ({
      ...current,
      [name]: {
        ...current[name],
        [key]: value,
        ...(key === "visible" && !value ? { required: false } : {}),
      },
    }));
  };

  const createFieldOrder = (orderedSections) =>
    orderedSections.reduce(
      (acc, section) => ({
        ...acc,
        [section.key]: section.fields.map((field) => field.name),
      }),
      {},
    );

  const reorderItems = (items, sourceKey, targetKey) => {
    const nextItems = [...items];
    const sourceIndex = nextItems.indexOf(sourceKey);
    const targetIndex = nextItems.indexOf(targetKey);

    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return nextItems;

    const [movedItem] = nextItems.splice(sourceIndex, 1);
    nextItems.splice(targetIndex, 0, movedItem);
    return nextItems;
  };

  const moveSection = (sourceSectionKey, targetSectionKey) => {
    if (!sourceSectionKey || !targetSectionKey || sourceSectionKey === targetSectionKey) return;

    setConfig((current) => {
      const currentSections = getAssetFormSections(current);
      const savedConfig = {
        ...current,
        __sectionOrder: reorderItems(
          currentSections.map((section) => section.key),
          sourceSectionKey,
          targetSectionKey,
        ),
      };
      saveAssetFormConfig(savedConfig);
      return savedConfig;
    });
  };

  const moveField = (fieldName, targetSectionKey, targetFieldName = "") => {
    if (!fieldName || !targetSectionKey || fieldName === targetFieldName) return;

    setConfig((current) => {
      const currentSections = getAssetFormSections(current);
      const fieldOrder = createFieldOrder(currentSections);
      const targetSection = currentSections.find((section) => section.key === targetSectionKey);
      const targetSectionTitle = targetSection?.title || targetSectionKey;

      Object.keys(fieldOrder).forEach((sectionKey) => {
        fieldOrder[sectionKey] = fieldOrder[sectionKey].filter((name) => name !== fieldName);
      });

      const targetFields = fieldOrder[targetSectionKey] || [];
      const targetIndex = targetFieldName ? targetFields.indexOf(targetFieldName) : -1;

      if (targetIndex >= 0) {
        targetFields.splice(targetIndex, 0, fieldName);
      } else {
        targetFields.push(fieldName);
      }

      fieldOrder[targetSectionKey] = targetFields;

      const savedConfig = {
        ...current,
        __fieldOrder: fieldOrder,
        __fieldSections: {
          ...(current.__fieldSections || {}),
          [fieldName]: targetSectionKey,
        },
        __customFields: (current.__customFields || []).map((field) =>
          field.name === fieldName
            ? { ...field, sectionKey: targetSectionKey, sectionTitle: targetSectionTitle }
            : field,
        ),
      };
      saveAssetFormConfig(savedConfig);
      return savedConfig;
    });
  };

  const handleSectionDragStart = (event, section) => {
    const item = { type: "section", sectionKey: section.key };
    setDragItem(item);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/json", JSON.stringify(item));
  };

  const handleFieldDragStart = (event, section, field) => {
    event.stopPropagation();
    const item = { type: "field", sectionKey: section.key, fieldName: field.name };
    setDragItem(item);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/json", JSON.stringify(item));
  };

  const readDragItem = (event) => {
    if (dragItem) return dragItem;

    try {
      return JSON.parse(event.dataTransfer.getData("application/json"));
    } catch {
      return null;
    }
  };

  const handleSectionDrop = (event, section) => {
    event.preventDefault();
    const item = readDragItem(event);

    if (item?.type === "section") {
      moveSection(item.sectionKey, section.key);
    }

    if (item?.type === "field") {
      moveField(item.fieldName, section.key);
    }

    setDragItem(null);
  };

  const handleFieldDrop = (event, section, field) => {
    event.preventDefault();
    event.stopPropagation();
    const item = readDragItem(event);

    if (item?.type === "field") {
      moveField(item.fieldName, section.key, field.name);
    }

    setDragItem(null);
  };

  const editFieldName = (field) => {
    setEditingField(field.name);
    setEditingLabel(field.label);
  };

  const saveFieldName = (field) => {
    const nextLabel = editingLabel.trim();
    if (!nextLabel) return;

    setConfig((current) => ({
      ...current,
      __fieldLabels: {
        ...(current.__fieldLabels || {}),
        [field.name]: nextLabel,
      },
    }));
    setEditingField(null);
    setEditingLabel("");
  };

  const startSectionEdit = (section) => {
    setEditingSection(section.key);
    setEditingSectionTitle(section.title);
    setEditingSectionDescription(section.description || "");
  };

  const saveSectionName = (section) => {
    const nextTitle = editingSectionTitle.trim();
    const nextDescription = editingSectionDescription.trim();
    if (!nextTitle) return;

    setConfig((current) => ({
      ...current,
      __sectionLabels: {
        ...(current.__sectionLabels || {}),
        [section.key]: nextTitle,
      },
      __sectionDescriptions: {
        ...(current.__sectionDescriptions || {}),
        [section.key]: nextDescription,
      },
      __customSections: (current.__customSections || []).map((item) =>
        item.key === section.key ? { ...item, title: nextTitle, description: nextDescription } : item,
      ),
    }));
    setEditingSection(null);
    setEditingSectionTitle("");
    setEditingSectionDescription("");
  };

  const deleteField = (field) => {
    if (field.locked) return;
    const confirmed = window.confirm(`Delete "${field.label}" field?`);
    if (!confirmed) return;

    if (field.custom) {
      setConfig((current) => {
        const nextConfig = { ...current };
        delete nextConfig[field.name];
        const savedConfig = {
          ...nextConfig,
          __customFields: (current.__customFields || []).filter((item) => item.name !== field.name),
          __fieldLabels: Object.fromEntries(
            Object.entries(current.__fieldLabels || {}).filter(([name]) => name !== field.name),
          ),
        };
        saveAssetFormConfig(savedConfig);
        return savedConfig;
      });
      return;
    }

    setConfig((current) => {
      const savedConfig = {
        ...current,
        __deletedFields: Array.from(new Set([...(current.__deletedFields || []), field.name])),
        __fieldLabels: Object.fromEntries(
          Object.entries(current.__fieldLabels || {}).filter(([name]) => name !== field.name),
        ),
        [field.name]: {
          ...(current[field.name] || {}),
          visible: false,
          required: false,
        },
      };
      saveAssetFormConfig(savedConfig);
      return savedConfig;
    });
  };

  const deleteSection = (section) => {
    if (!isCustomSection(section.key)) return;
    const confirmed = window.confirm(`Delete "${section.title}" section and all fields inside it?`);
    if (!confirmed) return;

    setConfig((current) => {
      const fieldNames = (current.__customFields || [])
        .filter((field) => field.sectionKey === section.key)
        .map((field) => field.name);
      const nextConfig = { ...current };
      fieldNames.forEach((name) => {
        delete nextConfig[name];
      });
      const nextFieldSections = Object.fromEntries(
        Object.entries(current.__fieldSections || {}).filter(([, sectionKey]) => sectionKey !== section.key),
      );
      const nextFieldOrder = Object.fromEntries(
        Object.entries(current.__fieldOrder || {}).filter(([sectionKey]) => sectionKey !== section.key),
      );

      const savedConfig = {
        ...nextConfig,
        __customSections: (current.__customSections || []).filter((item) => item.key !== section.key),
        __customFields: (current.__customFields || []).filter((field) => field.sectionKey !== section.key),
        __sectionOrder: (current.__sectionOrder || []).filter((key) => key !== section.key),
        __fieldSections: nextFieldSections,
        __fieldOrder: nextFieldOrder,
        __sectionLabels: Object.fromEntries(
          Object.entries(current.__sectionLabels || {}).filter(([key]) => key !== section.key),
        ),
        __sectionDescriptions: Object.fromEntries(
          Object.entries(current.__sectionDescriptions || {}).filter(([key]) => key !== section.key),
        ),
        __fieldLabels: Object.fromEntries(
          Object.entries(current.__fieldLabels || {}).filter(([name]) => !fieldNames.includes(name)),
        ),
      };
      saveAssetFormConfig(savedConfig);
      return savedConfig;
    });
  };

  const saveChanges = () => {
    saveAssetFormConfig(config);
    showToast({
      title: "Builder saved",
      message: "Master Editor changes were saved successfully.",
    });
  };

  const addCustomField = () => {
    const label = newFieldLabel.trim();
    const sectionTitle =
      selectedSection === "__new__" ? newSectionTitle.trim() : "";
    const sectionDescription =
      selectedSection === "__new__" ? newSectionDescription.trim() : "";
    const sectionKey =
      selectedSection === "__new__"
        ? `section_${sectionTitle.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now()}`
        : selectedSection;

    if (!label) return;
    if (!sectionKey) return;
    if (selectedSection === "__new__" && !sectionTitle) return;

    const baseName = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    const name = `custom_${baseName || "field"}_${Date.now()}`;

    if (config[name]) return;

    setConfig((current) => ({
      ...current,
      __customSections:
        selectedSection === "__new__"
          ? [...(current.__customSections || []), { key: sectionKey, title: sectionTitle, description: sectionDescription }]
          : current.__customSections || [],
      __sectionDescriptions:
        selectedSection === "__new__"
          ? {
              ...(current.__sectionDescriptions || {}),
              [sectionKey]: sectionDescription,
            }
          : current.__sectionDescriptions || {},
      __customFields: [
        ...(current.__customFields || []),
        {
          name,
          label,
          custom: true,
          sectionKey,
          sectionTitle: selectedSection === "__new__" ? sectionTitle : undefined,
          sectionDescription: selectedSection === "__new__" ? sectionDescription : undefined,
        },
      ],
      [name]: {
        visible: true,
        required: false,
      },
    }));
    setNewFieldLabel("");
    setNewSectionTitle("");
    setNewSectionDescription("");
    if (selectedSection === "__new__") {
      setSelectedSection(sectionKey);
    }
  };

  const addFieldToSection = (section) => {
    setSelectedSection(section.key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetDefaults = () => {
    resetAssetFormConfig();
    setConfig(getDefaultAssetFormConfig());
  };

  return (
    <div className="master-editor-page">
      <div className="master-editor-header">
        <div>
          <p>Form Builder</p>
          <h2>Master Editor</h2>
          <span>{visibleFields} of {totalFields} fields visible in Add Asset form</span>
        </div>
        <div className="master-editor-actions">
          <button type="button" className="reset-master-btn" onClick={resetDefaults}>
            Reset Defaults
          </button>
          <button type="button" className="save-master-btn" onClick={saveChanges}>
            Save Builder
          </button>
        </div>
      </div>

      <div className="custom-field-builder">
        <h3>Add Custom Field</h3>
        <select value={selectedSection} onChange={(event) => setSelectedSection(event.target.value)}>
          {sectionOptions.map((section) => (
            <option value={section.key} key={section.key}>{section.title}</option>
          ))}
          <option value="__new__">Create New Header</option>
        </select>
        {selectedSection === "__new__" && (
          <div className="new-section-fields">
            <input
              type="text"
              value={newSectionTitle}
              onChange={(event) => setNewSectionTitle(event.target.value)}
              placeholder="Enter new header name"
            />
            <input
              type="text"
              value={newSectionDescription}
              onChange={(event) => setNewSectionDescription(event.target.value)}
              placeholder="Enter header description"
            />
          </div>
        )}
        <input
          type="text"
          value={newFieldLabel}
          onChange={(event) => setNewFieldLabel(event.target.value)}
          placeholder="Enter field label"
        />
        <button type="button" className="save-master-btn" onClick={addCustomField}>
          Add Field
        </button>
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
                    <span className="drag-handle" title="Drag header">Drag</span>
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
                    {isCustomSection(section.key) && (
                      <button type="button" className="field-delete-btn" onClick={() => deleteSection(section)}>
                        Delete Header
                      </button>
                    )}
                  </>
                )}
                <button type="button" className="save-master-btn" onClick={() => addFieldToSection(section)}>
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
                          <span className="drag-handle" title="Drag field">Drag</span>
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
    </div>
  );
}

export default MasterEditor;
