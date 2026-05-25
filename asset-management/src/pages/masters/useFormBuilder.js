import { useState, useCallback } from "react";
import {
  FORM_TYPES,
  getDefaultFormConfig,
  getFormSections,
  loadFormConfig,
  resetFormConfig,
  saveFormConfig,
} from "../../utils/assetFormBuilder";
import { useToast } from "../../components/toast/toastStore";

export function useFormBuilder(formType) {
  const { showToast } = useToast();
  const defaultSection =
    formType === FORM_TYPES.REQUEST
      ? "Request Details"
      : formType === FORM_TYPES.PROCUREMENT
        ? "Shipping Location"
        : "Asset Information";

  const [config, setConfig] = useState(() => loadFormConfig(formType));
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [selectedSection, setSelectedSection] = useState(defaultSection);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionDescription, setNewSectionDescription] = useState("");
  const [editingField, setEditingField] = useState(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [editingSection, setEditingSection] = useState(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState("");
  const [editingSectionDescription, setEditingSectionDescription] = useState("");
  const [dragItem, setDragItem] = useState(null);
  const [sectionDeleteTarget, setSectionDeleteTarget] = useState(null);

  const sections = getFormSections(formType, config);
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
      const currentSections = getFormSections(formType, current);
      const savedConfig = {
        ...current,
        __sectionOrder: reorderItems(
          currentSections.map((section) => section.key),
          sourceSectionKey,
          targetSectionKey,
        ),
      };
      saveFormConfig(formType, savedConfig);
      return savedConfig;
    });
  };

  const moveField = (fieldName, targetSectionKey, targetFieldName = "") => {
    if (!fieldName || !targetSectionKey || fieldName === targetFieldName) return;
    setConfig((current) => {
      const currentSections = getFormSections(formType, current);
      const fieldOrder = createFieldOrder(currentSections);
      const targetSection = currentSections.find((section) => section.key === targetSectionKey);
      const targetSectionTitle = targetSection?.title || targetSectionKey;

      Object.keys(fieldOrder).forEach((sectionKey) => {
        fieldOrder[sectionKey] = fieldOrder[sectionKey].filter((name) => name !== fieldName);
      });

      const targetFields = fieldOrder[targetSectionKey] || [];
      const targetIndex = targetFieldName ? targetFields.indexOf(targetFieldName) : -1;
      if (targetIndex >= 0) targetFields.splice(targetIndex, 0, fieldName);
      else targetFields.push(fieldName);
      fieldOrder[targetSectionKey] = targetFields;

      const savedConfig = {
        ...current,
        __fieldOrder: fieldOrder,
        __fieldSections: { ...(current.__fieldSections || {}), [fieldName]: targetSectionKey },
        __customFields: (current.__customFields || []).map((field) =>
          field.name === fieldName
            ? { ...field, sectionKey: targetSectionKey, sectionTitle: targetSectionTitle }
            : field,
        ),
      };
      saveFormConfig(formType, savedConfig);
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
    if (item?.type === "section") moveSection(item.sectionKey, section.key);
    if (item?.type === "field") moveField(item.fieldName, section.key);
    setDragItem(null);
  };

  const handleFieldDrop = (event, section, field) => {
    event.preventDefault();
    event.stopPropagation();
    const item = readDragItem(event);
    if (item?.type === "field") moveField(item.fieldName, section.key, field.name);
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
      __fieldLabels: { ...(current.__fieldLabels || {}), [field.name]: nextLabel },
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
      __sectionLabels: { ...(current.__sectionLabels || {}), [section.key]: nextTitle },
      __sectionDescriptions: { ...(current.__sectionDescriptions || {}), [section.key]: nextDescription },
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
        saveFormConfig(formType, savedConfig);
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
        [field.name]: { ...(current[field.name] || {}), visible: false, required: false },
      };
      saveFormConfig(formType, savedConfig);
      return savedConfig;
    });
  };

  const deleteSection = (section) => {
    if (isCustomSection(section.key)) {
      setConfig((current) => {
        const fieldNames = (current.__customFields || [])
          .filter((field) => field.sectionKey === section.key)
          .map((field) => field.name);
        const nextConfig = { ...current };
        fieldNames.forEach((name) => delete nextConfig[name]);
        const savedConfig = {
          ...nextConfig,
          __customSections: (current.__customSections || []).filter((item) => item.key !== section.key),
          __customFields: (current.__customFields || []).filter((field) => field.sectionKey !== section.key),
          __sectionOrder: (current.__sectionOrder || []).filter((key) => key !== section.key),
          __fieldSections: Object.fromEntries(
            Object.entries(current.__fieldSections || {}).filter(([, sectionKey]) => sectionKey !== section.key),
          ),
          __fieldOrder: Object.fromEntries(
            Object.entries(current.__fieldOrder || {}).filter(([sectionKey]) => sectionKey !== section.key),
          ),
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
        saveFormConfig(formType, savedConfig);
        return savedConfig;
      });
      return;
    }

    setConfig((current) => {
      const savedConfig = {
        ...current,
        __hiddenSections: Array.from(new Set([...(current.__hiddenSections || []), section.key])),
      };
      saveFormConfig(formType, savedConfig);
      return savedConfig;
    });
  };

  const confirmDeleteSection = () => {
    if (!sectionDeleteTarget) return;
    deleteSection(sectionDeleteTarget);
    if (selectedSection === sectionDeleteTarget.key) {
      const remaining = sections.filter((item) => item.key !== sectionDeleteTarget.key);
      setSelectedSection(remaining[0]?.key || "");
    }
    setSectionDeleteTarget(null);
    showToast({
      title: "Header deleted",
      message: `"${sectionDeleteTarget.title}" section removed.`,
    });
  };

  const saveChanges = useCallback(() => {
    saveFormConfig(formType, config);
    showToast({
      title: "Saved",
      message: `${
        formType === FORM_TYPES.REQUEST
          ? "Request"
          : formType === FORM_TYPES.PROCUREMENT
            ? "Procurement"
            : "Asset"
      } form saved.`,
    });
  }, [formType, config, showToast]);

  const addCustomField = () => {
    const label = newFieldLabel.trim();
    const sectionTitle = selectedSection === "__new__" ? newSectionTitle.trim() : "";
    const sectionDescription = selectedSection === "__new__" ? newSectionDescription.trim() : "";
    const sectionKey =
      selectedSection === "__new__"
        ? `section_${sectionTitle.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now()}`
        : selectedSection;

    if (!label || !sectionKey) return;
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
          ? { ...(current.__sectionDescriptions || {}), [sectionKey]: sectionDescription }
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
      [name]: { visible: true, required: false },
    }));
    setNewFieldLabel("");
    setNewSectionTitle("");
    setNewSectionDescription("");
    if (selectedSection === "__new__") setSelectedSection(sectionKey);
  };

  const addFieldToSection = (section) => {
    if (!section?.key) return;
    setSelectedSection(section.key);
    setNewSectionTitle("");
    setNewSectionDescription("");
  };

  const resetDefaults = useCallback(() => {
    resetFormConfig(formType);
    setConfig(getDefaultFormConfig(formType));
    setSelectedSection(defaultSection);
    setEditingField(null);
    setEditingSection(null);
  }, [formType, defaultSection]);

  return {
    formType,
    config,
    sections,
    sectionOptions,
    visibleFields,
    totalFields,
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
    saveChanges,
    addCustomField,
    addFieldToSection,
    resetDefaults,
    setEditingSection,
  };
}
