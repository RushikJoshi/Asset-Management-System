import { useState } from "react";
import { PageTitle, KpiGrid, DataTable } from "../../components/common/ModuleComponents";
import { FaBoxes, FaPlus, FaSearch, FaTags, FaExclamationTriangle, FaBarcode, FaArrowUp, FaTimes } from "react-icons/fa";

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [subcategoryFilter, setSubcategoryFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Seeded mock product items list matching Image 2 exactly
  const [products, setProducts] = useState([
    {
      id: "PRD001",
      name: "Mooring",
      desc: "M!",
      brand: "Timex",
      category: "Machine",
      subcategory: "heavy Machine",
      vendors: "",
      status: "Out of Stock",
      stocks: 1,
      image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=80&auto=format&fit=crop&q=60",
      unitPrice: "$2,400"
    },
    {
      id: "PRD002",
      name: "The Arburg Allrounder 370",
      desc: "AB323cq",
      brand: "CISCO",
      category: "Machine",
      subcategory: "heavy Machine",
      vendors: "Luna",
      status: "Out of Stock",
      stocks: 1,
      image: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=80&auto=format&fit=crop&q=60",
      unitPrice: "$12,500"
    },
    {
      id: "PRD003",
      name: "CNC Machine",
      desc: "Haas VF-2 Vertical Machining Center",
      brand: "CISCO",
      category: "Machine",
      subcategory: "heavy Machine",
      vendors: "Luna",
      status: "Out of Stock",
      stocks: 0,
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=80&auto=format&fit=crop&q=60",
      unitPrice: "$45,000"
    },
    {
      id: "PRD004",
      name: "NetApp",
      desc: "FAS2040",
      brand: "Netapp",
      category: "Software",
      subcategory: "Server",
      vendors: "Luna",
      status: "Out of Stock",
      stocks: 1,
      avatar: "N",
      unitPrice: "$4,500"
    },
    {
      id: "PRD005",
      name: "Dell",
      desc: "PowerEdge R740xd",
      brand: "Dell",
      category: "Machine",
      subcategory: "Laptop",
      vendors: "Zylker",
      status: "Out of Stock",
      stocks: 1,
      avatar: "D",
      unitPrice: "$1,899"
    },
    {
      id: "PRD006",
      name: "CISCO",
      desc: "C9200L-48P-4X-E",
      brand: "CISCO",
      category: "Parts",
      subcategory: "Subparts",
      vendors: "",
      status: "Out of Stock",
      stocks: 1,
      avatar: "C",
      unitPrice: "$850"
    },
    {
      id: "PRD007",
      name: "Induction Heater",
      desc: "I31313",
      brand: "Dell",
      category: "Machine",
      subcategory: "Laptop",
      vendors: "",
      status: "Out of Stock",
      stocks: 0,
      avatar: "IH",
      unitPrice: "$1,200"
    }
  ]);

  // Form State for Adding New Product
  const [formData, setFormData] = useState({
    name: "",
    model: "",
    brand: "",
    category: "Machine",
    subcategory: "heavy Machine",
    vendors: "",
    stocks: "",
    unitPrice: ""
  });
  const [formError, setFormError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.model.trim() || !formData.brand.trim() || !formData.stocks) {
      setFormError("Please fill in the Product Name, Model, Brand, and Stock Quantity.");
      return;
    }

    const countNum = parseInt(formData.stocks) || 0;

    const newProduct = {
      id: `PRD00${products.length + 1}`,
      name: formData.name,
      desc: formData.model,
      brand: formData.brand,
      category: formData.category,
      subcategory: formData.subcategory,
      vendors: formData.vendors,
      status: countNum === 0 ? "Out of Stock" : "Available",
      stocks: countNum,
      avatar: formData.name.substring(0, 2).toUpperCase(),
      unitPrice: formData.unitPrice ? (formData.unitPrice.startsWith("$") ? formData.unitPrice : `$${formData.unitPrice}`) : "$0"
    };

    setProducts((prev) => [...prev, newProduct]);
    setShowAddModal(false);
    setFormData({ name: "", model: "", brand: "", category: "Machine", subcategory: "heavy Machine", vendors: "", stocks: "", unitPrice: "" });
    setFormError("");

    setToastMessage(`Product catalog ${newProduct.name} added successfully!`);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // Filtering Logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchQuery.toLowerCase());
                          
    const matchesCategory = categoryFilter === "ALL" ? true : p.category === categoryFilter;
    const matchesSubcategory = subcategoryFilter === "ALL" ? true : p.subcategory === subcategoryFilter;
    
    let matchesStock = true;
    if (stockFilter === "OUT") {
      matchesStock = p.stocks === 0;
    } else if (stockFilter === "AVAILABLE") {
      matchesStock = p.stocks > 0;
    }

    return matchesSearch && matchesCategory && matchesSubcategory && matchesStock;
  });

  const columns = [
    {
      key: "name",
      label: "Product",
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {row.image ? (
            <img
              src={row.image}
              alt={row.name}
              style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover", border: "1px solid #e2e8f0" }}
            />
          ) : (
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "13px"
            }}>
              {row.avatar || row.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <strong style={{ color: "#0f172a", fontSize: "14px" }}>{row.name}</strong>
            <span style={{ fontSize: "12px", color: "#64748b" }}>{row.desc}</span>
          </div>
        </div>
      )
    },
    {
      key: "brand",
      label: "Brand",
      render: (row) => <span style={{ color: "#334155", fontWeight: "500" }}>{row.brand}</span>
    },
    {
      key: "category",
      label: "Category",
      render: (row) => <span style={{ color: "#334155" }}>{row.category}</span>
    },
    {
      key: "subcategory",
      label: "Subcategory",
      render: (row) => <span style={{ color: "#334155" }}>{row.subcategory}</span>
    },
    {
      key: "vendors",
      label: "Vendors",
      render: (row) => <span style={{ color: "#475569" }}>{row.vendors || "-"}</span>
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const isOutOfStock = row.stocks === 0 || row.status === "Out of Stock";
        return (
          <span style={{
            fontSize: "13px",
            fontWeight: "600",
            color: isOutOfStock ? "#64748b" : "#0d9488"
          }}>
            {isOutOfStock ? "Out of Stock" : "Available"}
          </span>
        );
      }
    },
    {
      key: "stocks",
      label: "Total Stocks",
      render: (row) => (
        <div style={{ textAlign: "right", paddingRight: "32px", fontWeight: "600", color: "#0f172a" }}>
          {row.stocks}
        </div>
      )
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "32px" }}>
      
      {/* Products Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Products</h2>
        
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "10px 20px",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1d4ed8"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#2563eb"}
          >
            Add Product
          </button>
          
          <button
            style={{
              backgroundColor: "#ffffff",
              color: "#64748b",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s"
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div style={{
          backgroundColor: "#ECFDF5",
          border: "1px solid #10B981",
          color: "#047857",
          padding: "12px 16px",
          borderRadius: "8px",
          fontWeight: "600",
          fontSize: "14px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
        }}>
          {toastMessage}
        </div>
      )}

      {/* Filters Area matching Image 2 exactly */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "12px 16px",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        {/* Search Input */}
        <div style={{ position: "relative", width: "320px", minWidth: "240px" }}>
          <input
            type="text"
            placeholder="Product Name, Brand, etc.."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
              outline: "none",
              backgroundColor: "#ffffff"
            }}
            onFocus={(e) => e.target.style.borderColor = "#5B50EC"}
            onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
          />
          <FaSearch style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#94a3b8",
            fontSize: "14px"
          }} />
        </div>

        {/* Filter Dropdowns */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Filter By:</span>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
              color: "#475569",
              backgroundColor: "#ffffff",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="ALL">- Category -</option>
            <option value="Machine">Machine</option>
            <option value="Software">Software</option>
            <option value="Parts">Parts</option>
          </select>

          <select
            value={subcategoryFilter}
            onChange={(e) => setSubcategoryFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
              color: "#475569",
              backgroundColor: "#ffffff",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="ALL">- Subcategory -</option>
            <option value="heavy Machine">heavy Machine</option>
            <option value="Server">Server</option>
            <option value="Laptop">Laptop</option>
            <option value="Subparts">Subparts</option>
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
              color: "#475569",
              backgroundColor: "#ffffff",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="ALL">- Stock Level -</option>
            <option value="OUT">Out of Stock</option>
            <option value="AVAILABLE">Available</option>
          </select>
        </div>
      </div>

      {/* Products table */}
      <DataTable
        columns={columns}
        rows={filteredProducts}
        emptyText="No products found in the catalog directory."
      />

      {/* Add Product Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "480px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e2e8f0",
            overflow: "hidden"
          }}>
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid #e2e8f0",
              background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>Add Product</h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddProduct} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {formError && (
                <div style={{ color: "#B91C1C", backgroundColor: "#FEF2F2", padding: "10px", borderRadius: "6px", fontSize: "13px", fontWeight: "600" }}>
                  {formError}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Dell PowerEdge R740xd"
                  style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Model Number / Spec</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    placeholder="e.g. AB323cq"
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    required
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Brand</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    placeholder="e.g. Dell"
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
                  >
                    <option value="Machine">Machine</option>
                    <option value="Software">Software</option>
                    <option value="Parts">Parts</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Subcategory</label>
                  <select
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleInputChange}
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
                  >
                    <option value="heavy Machine">heavy Machine</option>
                    <option value="Server">Server</option>
                    <option value="Laptop">Laptop</option>
                    <option value="Subparts">Subparts</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Unit Price ($)</label>
                  <input
                    type="text"
                    name="unitPrice"
                    value={formData.unitPrice}
                    onChange={handleInputChange}
                    placeholder="e.g. 1899"
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Stock Quantity</label>
                  <input
                    type="number"
                    name="stocks"
                    value={formData.stocks}
                    onChange={handleInputChange}
                    placeholder="e.g. 1"
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Vendors</label>
                <input
                  type="text"
                  name="vendors"
                  value={formData.vendors}
                  onChange={handleInputChange}
                  placeholder="e.g. Luna"
                  style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "12px",
                paddingTop: "16px",
                borderTop: "1px solid #e2e8f0"
              }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#64748b",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 20px",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(37, 99, 235, 0.15)"
                  }}
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
