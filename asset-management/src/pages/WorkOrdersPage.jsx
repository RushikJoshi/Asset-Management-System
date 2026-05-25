import React, { useEffect, useState } from "react";
import apiInstance from "../apis/apiConfig";
import { useToast } from "../components/toast/toastStore";
import { 
  FaWrench, 
  FaSearch, 
  FaTimes, 
  FaPlus, 
  FaTrash, 
  FaClipboardList, 
  FaTools, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaSpinner, 
  FaSlidersH,
  FaArrowRight
} from "react-icons/fa";
import { useSelector } from "react-redux";
import "./WorkOrdersPage.css";

const ASSIGNEE_OPTIONS = [
  "Albert Admin",
  "Thomas John",
  "Evan Employee",
  "Mathew Manager",
  "John Doe",
  "Alice Developer",
  "Bob HR"
];

const CATEGORY_OPTIONS = [
  "Keyboard Replacement",
  "OS Reinstallation",
  "Display Repair",
  "Battery Replacement",
  "OS Diagnostics",
  "Thermal Service",
  "Motherboard Service",
  "Button Repair",
  "GPU Diagnostics",
  "Input Device Repair",
  "Hinge Repair",
  "Audio Repair",
  "Panel Replacement",
  "Antivirus Clean",
  "Camera Service",
  "SMPS Replacement",
  "Access Reset",
  "RAM Upgrade",
  "Roller Cleaning",
  "SATA Cable Check",
  "Office License Act"
];

function WorkOrdersPage() {
  const { showToast } = useToast();
  const user = useSelector((state) => state.auth?.user);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // RBAC Check
  const isAdminOrManager = user?.role === "admin" || user?.role === "manager";

  // Filters & State
  const [activeKpi, setActiveKpi] = useState("All"); // All, Open, Ongoing, Completed
  const [activeTab, setActiveTab] = useState("All"); // All, Open Complaints, In Progress WO, Completed WO
  const [searchQuery, setSearchQuery] = useState("");
  const [productFilter, setProductFilter] = useState("");
  
  // Drawer state
  const [selectedWO, setSelectedWO] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Editable Drawer Form fields
  const [priority, setPriority] = useState("Medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [workOrderSelection, setWorkOrderSelection] = useState("");
  const [workOrderCost, setWorkOrderCost] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [checklists, setChecklists] = useState([]);

  // Load All Work Orders
  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const response = await apiInstance.get("/work-orders");
      if (response.data.success) {
        setWorkOrders(response.data.workOrders || []);
      } else {
        showToast({
          title: "Data Error",
          message: response.data.message || "Failed to load work orders.",
          type: "error",
        });
      }
    } catch (error) {
      showToast({
        title: "Connection Error",
        message: error.response?.data?.message || "Failed to connect to backend server.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminOrManager) {
      fetchWorkOrders();
    }
  }, [isAdminOrManager]);

  // Sync Drawer editable state when selectedWO changes
  useEffect(() => {
    if (selectedWO) {
      setPriority(selectedWO.priority || "Medium");
      setAssignedTo(selectedWO.assignedTo || "");
      setWorkOrderSelection(selectedWO.workOrderSelection || "");
      setWorkOrderCost(selectedWO.workOrderCost || 0);
      setTasks(selectedWO.tasks ? [...selectedWO.tasks] : []);
      setChecklists(selectedWO.checklists ? [...selectedWO.checklists] : []);
    }
  }, [selectedWO]);

  // Compute metrics from full workOrders array
  const openCount = workOrders.filter(wo => wo.status === "Open").length;
  const ongoingCount = workOrders.filter(wo => wo.status === "In Progress").length;
  const completedCount = workOrders.filter(wo => wo.status === "Completed").length;
  const totalCount = workOrders.length;

  // Filter products/assets list dynamically
  const uniqueProducts = Array.from(new Set(workOrders.map(wo => wo.assetName))).filter(Boolean).sort();

  // Filter complaints based on Search, KPI, Tabs, and Product dropdown
  const filteredWorkOrders = workOrders.filter(wo => {
    // 1. KPI Filter
    if (activeKpi === "Open" && wo.status !== "Open") return false;
    if (activeKpi === "Ongoing" && wo.status !== "In Progress") return false;
    if (activeKpi === "Completed" && wo.status !== "Completed") return false;

    // 2. Tab Filter
    if (activeTab === "Open Complaints" && wo.status !== "Open") return false;
    if (activeTab === "In Progress WO" && wo.status !== "In Progress") return false;
    if (activeTab === "Completed WO" && wo.status !== "Completed") return false;

    // 3. Search Query Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = wo.complaintId?.toLowerCase().includes(q);
      const matchAssetId = wo.assetId?.toLowerCase().includes(q);
      const matchAssetName = wo.assetName?.toLowerCase().includes(q);
      const matchType = wo.complaintType?.toLowerCase().includes(q);
      const matchTitle = wo.complaintTitle?.toLowerCase().includes(q);
      if (!matchId && !matchAssetId && !matchAssetName && !matchType && !matchTitle) return false;
    }

    // 4. Product Dropdown Filter
    if (productFilter && wo.assetName !== productFilter) return false;

    return true;
  });

  // Task Grid Managers Actions
  const handleAddTask = () => {
    setTasks([...tasks, { taskName: "", description: "" }]);
  };

  const handleUpdateTaskField = (index, field, value) => {
    const updated = [...tasks];
    updated[index][field] = value;
    setTasks(updated);
  };

  const handleDeleteTask = (index) => {
    const updated = [...tasks];
    updated.splice(index, 1);
    setTasks(updated);
  };

  // Checklist Grid Manager Actions
  const handleAddChecklist = () => {
    setChecklists([...checklists, { checkName: "", description: "" }]);
  };

  const handleUpdateChecklistField = (index, field, value) => {
    const updated = [...checklists];
    updated[index][field] = value;
    setChecklists(updated);
  };

  const handleDeleteChecklist = (index) => {
    const updated = [...checklists];
    updated.splice(index, 1);
    setChecklists(updated);
  };

  // Submit/Update changes to backend
  const handleUpdateWorkOrder = async (e) => {
    e.preventDefault();
    if (!selectedWO) return;

    // Basic validation
    const emptyTasks = tasks.some(t => !t.taskName.trim());
    const emptyChecklists = checklists.some(c => !c.checkName.trim());

    if (emptyTasks) {
      showToast({
        title: "Validation Error",
        message: "Please fill out all task names or remove empty rows.",
        type: "error",
      });
      return;
    }

    if (emptyChecklists) {
      showToast({
        title: "Validation Error",
        message: "Please fill out all checklist names or remove empty rows.",
        type: "error",
      });
      return;
    }

    try {
      setDrawerLoading(true);
      const payload = {
        priority,
        assignedTo,
        workOrderSelection,
        workOrderCost: Number(workOrderCost) || 0,
        tasks,
        checklists
      };

      const response = await apiInstance.put(`/work-orders/${selectedWO._id}`, payload);
      
      if (response.data.success) {
        showToast({
          title: "Work Order Updated",
          message: response.data.message || `Successfully reviewed ${selectedWO.complaintId}.`,
          type: "success",
        });
        
        // Refresh items list
        fetchWorkOrders();
        setIsDrawerOpen(false);
        setSelectedWO(null);
      } else {
        showToast({
          title: "Update Error",
          message: response.data.message || "Failed to update work order details.",
          type: "error",
        });
      }
    } catch (error) {
      showToast({
        title: "Connection Error",
        message: error.response?.data?.message || "Failed to connect to the server.",
        type: "error",
      });
    } finally {
      setDrawerLoading(false);
    }
  };

  const getPriorityBadgeClass = (level) => {
    switch (level) {
      case "High":
        return "priority-badge high";
      case "Medium":
        return "priority-badge medium";
      case "Low":
        return "priority-badge low";
      default:
        return "priority-badge default";
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Open":
        return "status-badge open";
      case "In Progress":
        return "status-badge ongoing";
      case "Completed":
        return "status-badge completed";
      default:
        return "status-badge default";
    }
  };

  if (!isAdminOrManager) {
    return (
      <div className="app-container work-orders-page">
        <div className="procurement-empty-state" style={{ marginTop: '100px' }}>
          <FaWrench style={{ fontSize: '48px', color: '#94a3b8', marginBottom: '16px' }} />
          <h3>Access Restricted</h3>
          <p>Work Orders are generated automatically when employees submit Complaints in the Requests module.</p>
          <p style={{ marginTop: '8px' }}>Only Administrators and Maintenance Managers have permission to review, assign, and update Work Orders.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container work-orders-page">
      {/* Metric Cards Panel */}
      <div className="metrics-panel">
        <div 
          className={`metric-card ${activeKpi === "Open" ? "active" : ""}`}
          onClick={() => {
            setActiveKpi(activeKpi === "Open" ? "All" : "Open");
            setActiveTab("All");
          }}
        >
          <div className="metric-icon open-icon">
            <FaExclamationTriangle />
          </div>
          <div className="metric-details">
            <h3 className="metric-number">{openCount}</h3>
            <p className="metric-label">Open Complaints</p>
          </div>
        </div>

        <div 
          className={`metric-card ${activeKpi === "Ongoing" ? "active" : ""}`}
          onClick={() => {
            setActiveKpi(activeKpi === "Ongoing" ? "All" : "Ongoing");
            setActiveTab("All");
          }}
        >
          <div className="metric-icon ongoing-icon">
            <FaTools />
          </div>
          <div className="metric-details">
            <h3 className="metric-number">{ongoingCount}</h3>
            <p className="metric-label">Ongoing WO</p>
          </div>
        </div>

        <div 
          className={`metric-card ${activeKpi === "Completed" ? "active" : ""}`}
          onClick={() => {
            setActiveKpi(activeKpi === "Completed" ? "All" : "Completed");
            setActiveTab("All");
          }}
        >
          <div className="metric-icon completed-icon">
            <FaCheckCircle />
          </div>
          <div className="metric-details">
            <h3 className="metric-number">{completedCount}</h3>
            <p className="metric-label">Completed WO</p>
          </div>
        </div>

        <div 
          className={`metric-card ${activeKpi === "All" ? "active" : ""}`}
          onClick={() => {
            setActiveKpi("All");
            setActiveTab("All");
          }}
        >
          <div className="metric-icon all-icon">
            <FaClipboardList />
          </div>
          <div className="metric-details">
            <h3 className="metric-number">{totalCount}</h3>
            <p className="metric-label">All Requests</p>
          </div>
        </div>
      </div>

      {/* Tab Controls Menu */}
      <div className="tab-navigation-bar">
        <div className="tabs-header">
          {["All", "Open Complaints", "In Progress WO", "Completed WO"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => {
                setActiveTab(tab);
                setActiveKpi("All"); // Reset KPI filter to prevent clash
              }}
            >
              {tab === "All" ? "All Requests" : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="filters-action-row">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by Complaint ID, Asset ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              type="button" 
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
            >
              <FaTimes />
            </button>
          )}
        </div>

        <div className="filter-dropdown-container">
          <FaSlidersH className="slider-icon" />
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="product-filter-select"
          >
            <option value="">All Products/Assets</option>
            {uniqueProducts.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Complaints Listing Table */}
      <div className="complaints-table-container">
        {loading ? (
          <div className="table-state-loading">
            <FaSpinner className="spin" />
            <p>Loading Zoho complaints records...</p>
          </div>
        ) : filteredWorkOrders.length === 0 ? (
          <div className="table-state-empty">
            <FaWrench />
            <h3>No Work Orders Found</h3>
            <p>Try refining your search queries or filter dropdown selectors.</p>
          </div>
        ) : (
          <table className="complaints-table">
            <thead>
              <tr>
                <th>Complaint ID</th>
                <th>Date</th>
                <th>Asset Details</th>
                <th>Complainant</th>
                <th>Complaint Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkOrders.map((wo) => (
                <tr key={wo._id}>
                  <td className="complaint-id-col">
                    <span className="id-badge">{wo.complaintId}</span>
                  </td>
                  <td className="date-col">
                    {new Date(wo.complaintDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="asset-details-col">
                    <span className="asset-name">{wo.assetName}</span>
                    <span className="asset-id">{wo.assetId}</span>
                  </td>
                  <td className="raised-by-col">
                    <span className="user-name">{wo.raisedBy}</span>
                  </td>
                  <td className="title-col">
                    <div className="complaint-type-tag">{wo.complaintType}</div>
                    <span className="complaint-text" title={wo.complaintTitle}>
                      {wo.complaintTitle || "No Title"}
                    </span>
                  </td>
                  <td className="priority-col">
                    <span className={getPriorityBadgeClass(wo.priority)}>
                      {wo.priority}
                    </span>
                  </td>
                  <td className="status-col">
                    <span className={getStatusBadgeClass(wo.status)}>
                      {wo.status}
                    </span>
                  </td>
                  <td className="action-col">
                    <button
                      type="button"
                      className="review-action-btn"
                      onClick={() => {
                        setSelectedWO(wo);
                        setIsDrawerOpen(true);
                      }}
                    >
                      Review <FaArrowRight className="btn-arrow" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Review Complaint Drawer Overlay */}
      {isDrawerOpen && selectedWO && (
        <div className="drawer-overlay" onClick={() => setIsDrawerOpen(false)}>
          <div className="review-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="header-title-block">
                <span className="drawer-badge">{selectedWO.complaintId}</span>
                <h2>Review Complaint</h2>
              </div>
              <button 
                type="button" 
                className="close-drawer-btn"
                onClick={() => setIsDrawerOpen(false)}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleUpdateWorkOrder} className="drawer-form">
              <div className="drawer-body">
                {/* Meta details cards */}
                <div className="meta-info-grid">
                  <div className="meta-card-item">
                    <label>Complainant</label>
                    <p>{selectedWO.raisedBy}</p>
                  </div>
                  <div className="meta-card-item">
                    <label>Asset Name</label>
                    <p>{selectedWO.assetName}</p>
                  </div>
                  <div className="meta-card-item">
                    <label>Asset ID</label>
                    <p>{selectedWO.assetId}</p>
                  </div>
                  <div className="meta-card-item">
                    <label>Complaint Type</label>
                    <p>{selectedWO.complaintType}</p>
                  </div>
                </div>

                <div className="complaint-summary-block">
                  <label>Complaint Title/Desc</label>
                  <p>{selectedWO.complaintTitle || "No detailed description provided."}</p>
                </div>

                <hr className="drawer-divider" />

                {/* Form Selects */}
                <div className="form-fields-grid">
                  <div className="form-group">
                    <label htmlFor="priority-select">Priority Level</label>
                    <select
                      id="priority-select"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="assignee-select">Assign Technician/Worker</label>
                    <select
                      id="assignee-select"
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {ASSIGNEE_OPTIONS.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="category-select">Work Order Category</label>
                    <select
                      id="category-select"
                      value={workOrderSelection}
                      onChange={(e) => setWorkOrderSelection(e.target.value)}
                    >
                      <option value="">Select Category</option>
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="cost-input">Estimated Maintenance Cost ($)</label>
                    <input
                      id="cost-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={workOrderCost}
                      onChange={(e) => setWorkOrderCost(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <hr className="drawer-divider" />

                {/* Tasks Grid Manager */}
                <div className="sub-grid-manager-block">
                  <div className="block-header">
                    <h3>Tasks Grid Manager</h3>
                    <button
                      type="button"
                      className="add-subrow-btn"
                      onClick={handleAddTask}
                      style={{ backgroundColor: "#2563eb", color: "#ffffff", border: "none" }}
                    >
                      Add New Task
                    </button>
                  </div>
                  
                  {tasks.length === 0 ? (
                    <p className="no-subrows-text">No active tasks. Click "Add New Task" to append procedural steps.</p>
                  ) : (
                    <div className="sub-grid-table-wrapper">
                      <table className="sub-grid-table">
                        <thead>
                          <tr>
                            <th>Task Name <span className="req">*</span></th>
                            <th>Description</th>
                            <th className="act-col">Remove</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tasks.map((task, idx) => (
                            <tr key={idx}>
                              <td>
                                <input
                                  type="text"
                                  value={task.taskName}
                                  placeholder="e.g. Diagnosing battery..."
                                  onChange={(e) => handleUpdateTaskField(idx, "taskName", e.target.value)}
                                  required
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  value={task.description}
                                  placeholder="e.g. Check voltage output levels..."
                                  onChange={(e) => handleUpdateTaskField(idx, "description", e.target.value)}
                                />
                              </td>
                              <td className="act-col">
                                <button
                                  type="button"
                                  className="delete-subrow-btn"
                                  onClick={() => handleDeleteTask(idx)}
                                >
                                  <FaTrash />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <hr className="drawer-divider" />

                {/* Checklist Grid Manager */}
                <div className="sub-grid-manager-block">
                  <div className="block-header">
                    <h3>Checklist Grid Manager</h3>
                    <button
                      type="button"
                      className="add-subrow-btn"
                      onClick={handleAddChecklist}
                      style={{ backgroundColor: "#2563eb", color: "#ffffff", border: "none" }}
                    >
                      Add New Check
                    </button>
                  </div>
                  
                  {checklists.length === 0 ? (
                    <p className="no-subrows-text">No checklist items. Click "Add New Check" to append post-repair procedures.</p>
                  ) : (
                    <div className="sub-grid-table-wrapper">
                      <table className="sub-grid-table">
                        <thead>
                          <tr>
                            <th>Check Name <span className="req">*</span></th>
                            <th>Description</th>
                            <th className="act-col">Remove</th>
                          </tr>
                        </thead>
                        <tbody>
                          {checklists.map((check, idx) => (
                            <tr key={idx}>
                              <td>
                                <input
                                  type="text"
                                  value={check.checkName}
                                  placeholder="e.g. Clean CPU Fan..."
                                  onChange={(e) => handleUpdateChecklistField(idx, "checkName", e.target.value)}
                                  required
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  value={check.description}
                                  placeholder="e.g. Free from dust..."
                                  onChange={(e) => handleUpdateChecklistField(idx, "description", e.target.value)}
                                />
                              </td>
                              <td className="act-col">
                                <button
                                  type="button"
                                  className="delete-subrow-btn"
                                  onClick={() => handleDeleteChecklist(idx)}
                                >
                                  <FaTrash />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer actions */}
              <div className="drawer-footer">
                <button
                  type="button"
                  className="drawer-cancel-btn"
                  onClick={() => setIsDrawerOpen(false)}
                  disabled={drawerLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="drawer-submit-btn"
                  disabled={drawerLoading}
                >
                  {drawerLoading ? (
                    <>
                      <FaSpinner className="spin" /> Saving Changes...
                    </>
                  ) : (
                    "Update Work Order"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkOrdersPage;
