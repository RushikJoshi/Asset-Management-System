const cloneCategories = (categories) =>
  categories.map((c) => ({
    ...c,
    subCategories: [...(c.subCategories || [])],
  }));

/** Default catalog — editable from Master Editor (Asset form). */
export const DEFAULT_CATEGORY_CATALOG = {
  categories: [
    {
      id: "laptop",
      name: "Laptop",
      subCategories: ["Business Laptop", "Ultrabook", "Gaming"],
      network: true,
    },
    {
      id: "pc",
      name: "PC",
      subCategories: ["Desktop", "Workstation"],
      network: true,
    },
    {
      id: "desktop",
      name: "Desktop",
      subCategories: ["Office Desktop", "All-in-One"],
      network: true,
    },
    {
      id: "computer",
      name: "Computer",
      subCategories: ["Mini PC", "Tower"],
      network: true,
    },
    {
      id: "mobile",
      name: "Mobile",
      subCategories: ["Smartphone", "Tablet"],
      network: true,
    },
    {
      id: "monitor",
      name: "Monitor",
      subCategories: ["LCD", "LED", "Curved"],
      network: false,
    },
    {
      id: "printer",
      name: "Printer",
      subCategories: ["Laser", "Inkjet", "MFP"],
      network: false,
    },
    {
      id: "vehicle",
      name: "Vehicle",
      subCategories: ["Car", "Bike", "Truck"],
      network: false,
    },
    {
      id: "furniture",
      name: "Furniture",
      subCategories: ["Desk", "Table", "Cabinet"],
      network: false,
    },
    {
      id: "chair",
      name: "Chair",
      subCategories: ["Office", "Visitor", "Executive"],
      network: false,
    },
  ],
};

/**
 * Merge saved catalog with defaults (fixes missing fields / empty list).
 */
export function mergeCategoryCatalog(saved) {
  if (!saved || typeof saved !== "object" || !Array.isArray(saved.categories)) {
    return {
      categories: cloneCategories(DEFAULT_CATEGORY_CATALOG.categories),
    };
  }

  const categories = saved.categories
    .filter((c) => c && String(c.name || "").trim())
    .map((c, index) => {
      const subs = Array.isArray(c.subCategories)
        ? c.subCategories.map((s) => String(s).trim()).filter(Boolean)
        : String(c.subCategories || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
      return {
        id: String(c.id || `cat_${index}_${String(c.name).trim()}`),
        name: String(c.name).trim(),
        subCategories: subs,
        network: Boolean(c.network),
      };
    });

  if (!categories.length) {
    return {
      categories: cloneCategories(DEFAULT_CATEGORY_CATALOG.categories),
    };
  }

  return { categories };
}

/**
 * Whether the selected category should show IP + computer specification sections.
 */
export function isNetworkAssetCategory(category, catalog) {
  const cat = String(category || "").trim();
  if (!cat) return false;

  const merged = mergeCategoryCatalog(catalog);
  const entry = merged.categories.find((c) => c.name.toLowerCase() === cat.toLowerCase());
  if (entry) return Boolean(entry.network);

  return ["laptop", "pc", "desktop", "computer", "mobile"].includes(cat.toLowerCase());
}

export function getSubcategoriesForCategory(category, catalog) {
  const cat = String(category || "").trim();
  if (!cat) return [];
  const merged = mergeCategoryCatalog(catalog);
  const entry = merged.categories.find((c) => c.name.toLowerCase() === cat.toLowerCase());
  return entry?.subCategories || [];
}
