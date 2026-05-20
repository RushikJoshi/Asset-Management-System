import { useState } from "react";
import {
  FORM_TYPES,
  getDefaultFormConfig,
  loadFormConfig,
  saveFormConfig,
} from "../../utils/assetFormBuilder";
import { mergeCategoryCatalog } from "../../utils/categoryCatalog";
import { useToast } from "../../components/toast/toastStore";

export function useCategoryCatalog() {
  const { showToast } = useToast();
  const [config, setConfig] = useState(() => loadFormConfig(FORM_TYPES.ASSET));

  const categoryRows =
    Array.isArray(config.__categoryCatalog?.categories) && config.__categoryCatalog.categories.length
      ? config.__categoryCatalog.categories
      : mergeCategoryCatalog(null).categories;

  const addCategoryRow = () => {
    let list = Array.isArray(config.__categoryCatalog?.categories)
      ? [...config.__categoryCatalog.categories]
      : [...mergeCategoryCatalog(null).categories];
    if (!list.length) list = [...mergeCategoryCatalog(null).categories];

    if (list.some((row) => !String(row?.name || "").trim())) {
      showToast({
        title: "Enter category name first",
        message: "Fill the empty row before adding another.",
        type: "info",
      });
      return;
    }

    setConfig((cur) => {
      let nextList = Array.isArray(cur.__categoryCatalog?.categories)
        ? [...cur.__categoryCatalog.categories]
        : [...mergeCategoryCatalog(null).categories];
      if (!nextList.length) nextList = [...mergeCategoryCatalog(null).categories];
      return {
        ...cur,
        __categoryCatalog: {
          categories: [
            ...nextList,
            { id: `cat_${Date.now()}`, name: "", subCategories: [], network: false },
          ],
        },
      };
    });
  };

  const updateCategoryRow = (id, patch) => {
    setConfig((cur) => {
      const list = Array.isArray(cur.__categoryCatalog?.categories)
        ? cur.__categoryCatalog.categories.map((row) => (row.id === id ? { ...row, ...patch } : row))
        : [...mergeCategoryCatalog(null).categories];
      return { ...cur, __categoryCatalog: { categories: list } };
    });
  };

  const removeCategoryRow = (id) => {
    setConfig((cur) => {
      const list = Array.isArray(cur.__categoryCatalog?.categories)
        ? cur.__categoryCatalog.categories.filter((row) => row.id !== id)
        : [];
      return {
        ...cur,
        __categoryCatalog: {
          categories: list.length ? list : [...mergeCategoryCatalog(null).categories],
        },
      };
    });
  };

  const saveChanges = () => {
    saveFormConfig(FORM_TYPES.ASSET, config);
    showToast({ title: "Saved", message: "Category catalog saved." });
  };

  const resetDefaults = () => {
    const defaults = getDefaultFormConfig(FORM_TYPES.ASSET);
    setConfig((current) => ({
      ...current,
      __categoryCatalog: defaults.__categoryCatalog,
    }));
    showToast({ title: "Reset", message: "Category catalog reset to defaults." });
  };

  return {
    categoryRows,
    addCategoryRow,
    updateCategoryRow,
    removeCategoryRow,
    saveChanges,
    resetDefaults,
  };
}
