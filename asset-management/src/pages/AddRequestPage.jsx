import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { addAsset, updateAsset, deleteAsset, fetchAssetList } from "../store/slices/assetSlice";
import { useToast } from "../components/toast/toastStore";
import { getRequestFormSections, loadRequestFormConfig } from "../utils/assetFormBuilder";
import {
  FaSearch,
  FaFilter,
  FaPlus,
  FaMinus,
  FaTrashAlt,
  FaArrowLeft,
  FaShoppingCart,
  FaBoxOpen,
  FaCheckCircle,
  FaTimesCircle,
  FaLaptop,
  FaMobileAlt,
  FaTabletAlt,
  FaCog,
  FaCode
} from "react-icons/fa";
import "./AddRequestPage.css";

// Dynamic stock-based images or crisp modern SVG fallbacks for premium look
const PRODUCT_CATALOG = [
  {
    id: "CAT001",
    name: "Inspiron 15",
    brand: "Dell",
    category: "Machine",
    subCategory: "Laptop",
    price: 120000,
    stocks: 0,
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300&auto=format&fit=crop&q=60"
  },
  {
    id: "CAT002",
    name: "iPhone 16 Pro",
    brand: "Apple",
    category: "Phone",
    subCategory: "Smart Phone",
    price: 120000,
    stocks: 12,
    image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=300&auto=format&fit=crop&q=60"
  },
  {
    id: "CAT003",
    name: "Mac M2 Pro",
    brand: "Apple",
    category: "Machine",
    subCategory: "Laptop",
    price: 250000,
    stocks: 0,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&auto=format&fit=crop&q=60"
  },
  {
    id: "CAT004",
    name: "Galaxy S24 Ultra",
    brand: "Samsung",
    category: "Phone",
    subCategory: "Smart Phone",
    price: 120000,
    stocks: 8,
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300&auto=format&fit=crop&q=60"
  },
  {
    id: "CAT005",
    name: "Galaxy Tab S10 FE+",
    brand: "Samsung",
    category: "Tab",
    subCategory: "Tablet",
    price: 65999,
    stocks: 0,
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&auto=format&fit=crop&q=60"
  },
  {
    id: "CAT006",
    name: "iPhone 17 pro max",
    brand: "Apple",
    category: "Phone",
    subCategory: "Smart Phone",
    price: 179999,
    stocks: 0,
    image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300&auto=format&fit=crop&q=60"
  },
  {
    id: "CAT007",
    name: "Mooring",
    brand: "Timex",
    category: "Machine",
    subCategory: "heavy Machine",
    price: 198000,
    stocks: 0,
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=60"
  },
  {
    id: "CAT008",
    name: "The Arburg Allrounder 370",
    brand: "CISCO",
    category: "Machine",
    subCategory: "heavy Machine",
    price: 1031250,
    stocks: 1,
    image: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=300&auto=format&fit=crop&q=60"
  },
  {
    id: "CAT009",
    name: "CNC Machine",
    brand: "CISCO",
    category: "Machine",
    subCategory: "heavy Machine",
    price: 3712500,
    stocks: 0,
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&auto=format&fit=crop&q=60"
  },
  {
    id: "CAT010",
    name: "NetApp",
    brand: "Netapp",
    category: "Software",
    subCategory: "Server",
    price: 371250,
    stocks: 2,
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=300&auto=format&fit=crop&q=60"
  }
];

const renderProductIcon = (prod) => {
  const size = "40px";
  let icon = <FaBoxOpen style={{ fontSize: size }} />;
  let bgColor = "rgba(79, 70, 229, 0.08)";
  let iconColor = "#4f46e5";

  const sub = String(prod.subCategory || "").toLowerCase();
  const cat = String(prod.category || "").toLowerCase();

  if (sub.includes("laptop")) {
    icon = <FaLaptop style={{ fontSize: size }} />;
    bgColor = "rgba(14, 165, 233, 0.08)";
    iconColor = "#0ea5e9";
  } else if (sub.includes("heavy") || sub.includes("cnc")) {
    icon = <FaCog style={{ fontSize: size }} />;
    bgColor = "rgba(245, 158, 11, 0.08)";
    iconColor = "#f59e0b";
  } else if (cat.includes("phone")) {
    icon = <FaMobileAlt style={{ fontSize: size }} />;
    bgColor = "rgba(16, 185, 129, 0.08)";
    iconColor = "#10b981";
  } else if (cat.includes("tab")) {
    icon = <FaTabletAlt style={{ fontSize: size }} />;
    bgColor = "rgba(236, 72, 153, 0.08)";
    iconColor = "#ec4899";
  } else if (cat.includes("software")) {
    icon = <FaCode style={{ fontSize: size }} />;
    bgColor = "rgba(139, 92, 246, 0.08)";
    iconColor = "#8b5cf6";
  }

  return (
    <div style={{
      width: "64px",
      height: "64px",
      borderRadius: "16px",
      backgroundColor: bgColor,
      color: iconColor,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "transform 0.2s ease"
    }} className="fallback-icon-container">
      {icon}
    </div>
  );
};

export default function AddRequestPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { showToast } = useToast();
  const { user } = useSelector((state) => state.auth);
  const { assetListData, loading } = useSelector((state) => state.assetList);
  const [hasLoadedEditData, setHasLoadedEditData] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");

  const [cart, setCart] = useState([]);
  
  // Custom forms and fields from local storage configuration builder
  const [formConfig] = useState(() => loadRequestFormConfig());
  const formSections = getRequestFormSections(formConfig);
  
  // Dynamic fields from config
  const isFieldVisible = (name) => formConfig[name]?.visible !== false;
  const isFieldRequired = (name) => formConfig[name]?.required === true;
  
  // Custom dynamic form state
  const [employeeDetails, setEmployeeDetails] = useState({
    requestedBy: user?.name || user?.username || "Albert Admin",
    department: "Admin",
    requestPriority: "Medium",
    requestReason: "",
    reportingTo: "Admin\ncreatorindustrysolutions",
    // placeholder for dynamic custom fields
  });

  useEffect(() => {
    dispatch(fetchAssetList());
  }, [dispatch]);

  // Extract custom fields from sections
  const customFields = formSections.flatMap((section) =>
    section.fields.filter((field) => field.custom && isFieldVisible(field.name))
  );

  // Prefill existing data in edit mode
  useEffect(() => {
    if (isEditMode && assetListData.length > 0 && !hasLoadedEditData) {
      const existingItems = assetListData.filter(
        (item) => item.recordType === "REQUEST" && item.requestId === id
      );
      if (existingItems.length > 0) {
        const firstItem = existingItems[0];
        
        // Parse custom field values from the first item
        const initialCustoms = {};
        customFields.forEach(field => {
          initialCustoms[field.name] = firstItem.customFields?.[`Request Details.${field.label}`] || "";
        });

        setEmployeeDetails({
          requestedBy: firstItem.requestedBy || "",
          department: firstItem.department || "",
          requestPriority: firstItem.requestPriority || "Medium",
          requestReason: firstItem.requestReason || "",
          reportingTo: firstItem.reportingTo || "Admin\ncreatorindustrysolutions",
          ...initialCustoms
        });

        const cartItems = existingItems.map((item) => {
          const catalogProd = PRODUCT_CATALOG.find(
            (p) => p.name === item.assetName && p.brand === item.brand
          ) || {};
          return {
            id: catalogProd.id || `EXISTING_${item._id}`,
            _id: item._id,
            name: item.assetName,
            brand: item.brand,
            category: item.category,
            subCategory: item.subCategory,
            price: item.price || catalogProd.price || 0,
            quantity: item.quantity || 1,
            stocks: catalogProd.stocks !== undefined ? catalogProd.stocks : 0,
            image: catalogProd.image || ""
          };
        });

        setCart(cartItems);
        setHasLoadedEditData(true);
      }
    }
  }, [isEditMode, assetListData, id, hasLoadedEditData, customFields]);

  // Initialize custom field values in details state (only when not in edit mode)
  useEffect(() => {
    if (!isEditMode) {
      const initialCustoms = {};
      customFields.forEach(field => {
        initialCustoms[field.name] = "";
      });
      setEmployeeDetails(prev => ({ ...prev, ...initialCustoms }));
    }
  }, [isEditMode, customFields]);

  const handleDetailsChange = (name, value) => {
    setEmployeeDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    showToast({
      title: "Added to Cart",
      message: `${product.name} has been added to your request list.`,
      type: "success"
    });
  };

  const handleUpdateQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const nextQty = item.quantity + delta;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  // Generate Request ID dynamically from existing max Req-X
  const generateReqId = () => {
    let maxNum = 100;
    assetListData.forEach((item) => {
      if (item.requestId) {
        const match = item.requestId.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (num > maxNum) maxNum = num;
        }
      }
    });
    return `Req-${maxNum + 1}`;
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast({
        title: "Cart Empty",
        message: "Please add at least one product to submit a request.",
        type: "error"
      });
      return;
    }

    // Validate required dynamic fields
    const missingRequired = [];
    if (isFieldRequired("requestedBy") && !employeeDetails.requestedBy) missingRequired.push("Requested By");
    if (isFieldRequired("department") && !employeeDetails.department) missingRequired.push("Department");

    customFields.forEach(field => {
      if (isFieldRequired(field.name) && !employeeDetails[field.name]) {
        missingRequired.push(field.label);
      }
    });

    if (missingRequired.length > 0) {
      showToast({
        title: "Missing Fields",
        message: `Please fill in required fields: ${missingRequired.join(", ")}`,
        type: "error"
      });
      return;
    }

    if (isEditMode) {
      try {
        const originalItems = assetListData.filter(
          (item) => item.recordType === "REQUEST" && item.requestId === id
        );

        const deletedItems = originalItems.filter(
          (orig) => !cart.some((cItem) => cItem._id === orig._id)
        );
        const updatedItems = cart.filter((cItem) => Boolean(cItem._id));
        const addedItems = cart.filter((cItem) => !cItem._id);

        const deletePromises = deletedItems.map((item) =>
          dispatch(deleteAsset(item._id)).unwrap()
        );

        const updatePromises = updatedItems.map((cItem) => {
          const itemCustomFields = {};
          customFields.forEach((field) => {
            itemCustomFields[`Request Details.${field.label}`] =
              employeeDetails[field.name] || "";
          });

          const payload = {
            requestedBy: employeeDetails.requestedBy,
            department: employeeDetails.department,
            requestPriority: employeeDetails.requestPriority,
            requestReason: employeeDetails.requestReason,
            reportingTo: employeeDetails.reportingTo,
            price: Number(cItem.price),
            quantity: Number(cItem.quantity),
            customFields: itemCustomFields,
          };

          return dispatch(updateAsset({ id: cItem._id, payload })).unwrap();
        });

        const addPromises = addedItems.map((cItem) => {
          const itemCustomFields = {};
          customFields.forEach((field) => {
            itemCustomFields[`Request Details.${field.label}`] =
              employeeDetails[field.name] || "";
          });

          const payload = {
            recordType: "REQUEST",
            requestId: id,
            requestType: "Procurement",
            requestDate: originalItems[0]?.requestDate || new Date().toISOString().split("T")[0],
            requestedBy: employeeDetails.requestedBy,
            department: employeeDetails.department,
            requestPriority: employeeDetails.requestPriority,
            requestReason: employeeDetails.requestReason,
            reportingTo: employeeDetails.reportingTo,
            assetName: cItem.name,
            brand: cItem.brand,
            category: cItem.category,
            subCategory: cItem.subCategory,
            price: Number(cItem.price),
            quantity: Number(cItem.quantity),
            requestStatus: "Pending",
            managerApproval: "Pending",
            adminApproval: "Pending",
            purchaseStatus: "Pending",
            customFields: itemCustomFields,
          };

          return dispatch(addAsset(payload)).unwrap();
        });

        await Promise.all([...deletePromises, ...updatePromises, ...addPromises]);

        showToast({
          title: "✓ Request Updated",
          message: `Successfully updated request group ${id}.`,
          type: "success",
        });
        navigate("/requests");
      } catch (err) {
        showToast({
          title: "Update Failed",
          message: err || "Unable to update request. Please try again.",
          type: "error",
        });
      }
      return;
    }

    const newRequestId = generateReqId();
    const currentDate = new Date().toISOString().split("T")[0];

    try {
      // Loop through each item in cart and submit a distinct record, all sharing the same RequestID
      const submitPromises = cart.map((cartItem) => {
        // Compile dynamic custom fields for this item
        const itemCustomFields = {};
        customFields.forEach(field => {
          itemCustomFields[`Request Details.${field.label}`] = employeeDetails[field.name] || "";
        });

        const payload = {
          recordType: "REQUEST",
          requestId: newRequestId,
          requestType: "Procurement",
          requestDate: currentDate,
          requestedBy: employeeDetails.requestedBy,
          department: employeeDetails.department,
          requestPriority: employeeDetails.requestPriority,
          requestReason: employeeDetails.requestReason,
          reportingTo: employeeDetails.reportingTo,

          // Product item specifics
          assetName: cartItem.name,
          brand: cartItem.brand,
          category: cartItem.category,
          subCategory: cartItem.subCategory,
          price: Number(cartItem.price),
          quantity: Number(cartItem.quantity),

          // Standard default approvals workflow
          requestStatus: "Pending",
          managerApproval: "Pending",
          adminApproval: "Pending",
          purchaseStatus: "Pending",
          
          customFields: itemCustomFields
        };

        return dispatch(addAsset(payload)).unwrap();
      });

      await Promise.all(submitPromises);
      showToast({
        title: "✓ Request Submitted",
        message: `Successfully created request group ${newRequestId} with ${cart.length} product(s).`,
        type: "success"
      });
      navigate("/requests");
    } catch (err) {
      showToast({
        title: "Submission Failed",
        message: err || "Unable to save your request. Please try again.",
        type: "error"
      });
    }
  };

  // Filter dynamic catalog matching Zoho criteria
  const filteredCatalog = PRODUCT_CATALOG.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(search.toLowerCase()) ||
      prod.brand.toLowerCase().includes(search.toLowerCase()) ||
      prod.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === "ALL" || prod.category === categoryFilter;

    let matchesStock = true;
    if (stockFilter === "IN") {
      matchesStock = prod.stocks > 0;
    } else if (stockFilter === "OUT") {
      matchesStock = prod.stocks === 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="add-request-container">
      {/* Title Header with Back Action */}
      <div className="catalog-header-bar">
        <button className="back-btn-premium" onClick={() => navigate("/requests")}>
          <FaArrowLeft /> Back to Requests
        </button>
        <div className="catalog-title">
          <h2>{isEditMode ? `Edit Request (${id})` : "Create Request Catalog"}</h2>
          <p>{isEditMode ? "Modify details, quantities, or products in this request group." : "Search, filter, and add premium inventory assets to your request sheet."}</p>
        </div>
      </div>

      <div className="split-grid-panel">
        {/* Left Side: Search, Filters & Product Grid */}
        <div className="catalog-main-panel">
          <div className="catalog-toolbar-wrapper">
            {/* Search Input Box */}
            <div className="catalog-search-box">
              <FaSearch className="search-icon-premium" />
              <input
                type="text"
                placeholder="Product, Brand, Model, etc..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Dynamic Status Filters */}
            <div className="catalog-filter-controls">
              <div className="filter-select-group">
                <span className="control-tag"><FaFilter /> Category:</span>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="ALL">All Categories</option>
                  <option value="Machine">Machine</option>
                  <option value="Phone">Phone</option>
                  <option value="Tab">Tab</option>
                  <option value="Software">Software</option>
                </select>
              </div>

              <div className="filter-select-group">
                <span className="control-tag"><FaFilter /> Stock Level:</span>
                <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
                  <option value="ALL">All Stock levels</option>
                  <option value="IN">In stock</option>
                  <option value="OUT">Out of stock</option>
                </select>
              </div>
            </div>
          </div>

          {/* Catalog Grid Cards */}
          <div className="catalog-cards-grid">
            {filteredCatalog.length === 0 ? (
              <div className="empty-catalog-state">
                <FaBoxOpen style={{ fontSize: "48px", color: "#cbd5e1" }} />
                <p>No products match your search/filter criteria.</p>
              </div>
            ) : (
              filteredCatalog.map((prod) => {
                const inStock = prod.stocks > 0;
                return (
                  <div className="catalog-prod-card" key={prod.id}>
                    {/* Category Label */}
                    <span className="prod-cat-label">{prod.category}</span>
                    
                    {/* Stock Status Badge */}
                    <span className={`prod-stock-badge ${inStock ? "in-stock" : "out-of-stock"}`}>
                      {inStock ? "In stock" : "Out of stock"}
                    </span>

                    {/* Product Image Cover / Premium Icon */}
                    <div className="prod-image-wrapper">
                      {renderProductIcon(prod)}
                    </div>

                    {/* Product Title and Brand */}
                    <div className="prod-meta-info">
                      <h4>{prod.name}</h4>
                      <p className="prod-brand-text">{prod.brand} • {prod.subCategory}</p>
                    </div>

                    {/* Price and Cart Addition */}
                    <div className="prod-card-footer">
                      <span className="prod-price-tag">₹ {prod.price.toLocaleString("en-IN")}.00</span>
                      <button
                        className="add-to-cart-btn"
                        onClick={() => handleAddToCart(prod)}
                        title="Add to Request Sheet"
                      >
                        <FaPlus />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Cart Drawer & Dynamically Form Details */}
        <div className="cart-sidebar-panel">
          <div className="cart-header-title">
            <h3><FaShoppingCart /> Cart</h3>
            {cart.length > 0 && <span className="cart-badge-qty">{cart.reduce((s, i) => s + i.quantity, 0)} items</span>}
          </div>

          {cart.length === 0 ? (
            <div className="empty-cart-state">
              <FaShoppingCart style={{ fontSize: "52px", color: "#e2e8f0", marginBottom: "12px" }} />
              <p className="primary-text">Cart is empty</p>
              <p className="subtext">Select items from the catalog grid to request them.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitRequest} className="cart-form-container">
              {/* Selected items list */}
              <div className="cart-items-list">
                {cart.map((item) => (
                  <div className="cart-item-row" key={item.id}>
                    <div className="cart-item-info" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span className="cart-item-name">{item.name}</span>
                      <span className="cart-item-brand" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        {item.brand} • ₹
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => {
                            const newPrice = Math.max(0, parseFloat(e.target.value) || 0);
                            setCart(prev => prev.map(i => i.id === item.id ? { ...i, price: newPrice } : i));
                          }}
                          style={{
                            width: "90px",
                            padding: "2px 6px",
                            fontSize: "12px",
                            border: "1px solid #cbd5e1",
                            borderRadius: "4px",
                            color: "#1f2937",
                            fontWeight: "600",
                            outline: "none",
                            height: "24px"
                          }}
                          placeholder="Price"
                        />
                      </span>
                    </div>

                    {/* Quantity controls */}
                    <div className="cart-item-actions">
                      <div className="qty-controls">
                        <button type="button" onClick={() => handleUpdateQty(item.id, -1)}><FaMinus /></button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => handleUpdateQty(item.id, 1)}><FaPlus /></button>
                      </div>
                      <button
                        type="button"
                        className="remove-trash-btn"
                        onClick={() => handleRemoveFromCart(item.id)}
                        title="Remove product"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dynamic Employee and dynamic custom fields checkout form */}
              <div className="checkout-details-card">
                <h4>Request Details</h4>
                <p className="checkout-section-desc">Specify requester and routing information below.</p>

                {/* Requested By - supports visible check */}
                {isFieldVisible("requestedBy") && (
                  <div className="checkout-field-group">
                    <label>
                      Requested By {isFieldRequired("requestedBy") && <span className="req-star">*</span>}
                    </label>
                    <input
                      type="text"
                      value={employeeDetails.requestedBy}
                      onChange={(e) => handleDetailsChange("requestedBy", e.target.value)}
                      placeholder="Enter requester name"
                      required={isFieldRequired("requestedBy")}
                    />
                  </div>
                )}

                {/* Department - supports visible check */}
                {isFieldVisible("department") && (
                  <div className="checkout-field-group">
                    <label>
                      Department {isFieldRequired("department") && <span className="req-star">*</span>}
                    </label>
                    <input
                      type="text"
                      value={employeeDetails.department}
                      onChange={(e) => handleDetailsChange("department", e.target.value)}
                      placeholder="e.g. Engineering, HR"
                      required={isFieldRequired("department")}
                    />
                  </div>
                )}

                {/* Reporting To */}
                <div className="checkout-field-group">
                  <label>Reporting To</label>
                  <textarea
                    value={employeeDetails.reportingTo}
                    onChange={(e) => handleDetailsChange("reportingTo", e.target.value)}
                    placeholder="Reporting line details"
                    rows={2}
                  />
                </div>

                {/* Priority Selection */}
                {isFieldVisible("requestPriority") && (
                  <div className="checkout-field-group">
                    <label>Priority</label>
                    <select
                      value={employeeDetails.requestPriority}
                      onChange={(e) => handleDetailsChange("requestPriority", e.target.value)}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                )}

                {/* Reason/Notes */}
                {isFieldVisible("requestReason") && (
                  <div className="checkout-field-group">
                    <label>Reason / Notes</label>
                    <textarea
                      value={employeeDetails.requestReason}
                      onChange={(e) => handleDetailsChange("requestReason", e.target.value)}
                      placeholder="State reason for requesting these assets..."
                      rows={3}
                    />
                  </div>
                )}

                {/* DYNAMIC CUSTOM FIELDS defined in Masters Builder */}
                {customFields.length > 0 && (
                  <div className="custom-fields-divider">
                    <h5>Additional Fields</h5>
                    {customFields.map((field) => (
                      <div className="checkout-field-group" key={field.name}>
                        <label>
                          {field.label} {isFieldRequired(field.name) && <span className="req-star">*</span>}
                        </label>
                        <input
                          type="text"
                          value={employeeDetails[field.name] || ""}
                          onChange={(e) => handleDetailsChange(field.name, e.target.value)}
                          placeholder={`Enter custom ${field.label.toLowerCase()}`}
                          required={isFieldRequired(field.name)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit panel */}
              <div className="checkout-footer-block">
                <div className="checkout-summary-cost">
                  <span>Estimated Total:</span>
                  <strong>₹ {cart.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString("en-IN")}.00</strong>
                </div>
                <button type="submit" className="submit-request-sheet-btn">
                  {isEditMode ? "Save Changes" : "Submit Request Sheet"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
