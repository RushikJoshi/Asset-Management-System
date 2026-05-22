import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  DataTable,
} from "../components/common/ModuleComponents";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal";
import { deleteAsset, fetchAssetList, updateAsset } from "../store/slices/assetSlice";
import { getRequestRecords } from "../utils/assetUtils";
import { useToast } from "../components/toast/toastStore";
import {
  APPROVAL_PENDING,
  buildApprovalPayload,
  buildRejectionPayload,
  canDeleteRequest,
  canEditRequest,
  getNextApprovalStep,
  getChangeableApprovalStep,
  isRequestFullyApproved,
  isRequestRejected,
} from "../utils/requestWorkflow";
import {
  FaCheckCircle,
  FaTimes,
  FaSyncAlt,
  FaClipboardCheck,
  FaSearch,
  FaFilter,
  FaPlus,
} from "react-icons/fa";
import "./RequestsPage.css";

function ApprovalBadge({ value }) {
  const normalized = String(value || APPROVAL_PENDING).toLowerCase();
  return <span className={`approval-badge approval-badge--${normalized}`}>{value || APPROVAL_PENDING}</span>;
}

function useModuleData() {
  const dispatch = useDispatch();
  const { assetListData, loading } = useSelector((state) => state.assetList);

  useEffect(() => {
    dispatch(fetchAssetList());
  }, [dispatch]);

  return { assetListData, loading };
}

export function Requests() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useSelector((state) => state.auth);
  const { assetListData } = useModuleData();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [approvingId, setApprovingId] = useState("");
  const [selectedAction, setSelectedAction] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const requests = getRequestRecords(assetListData);
  const pendingCount = requests.filter((item) => !isRequestFullyApproved(item) && !isRequestRejected(item)).length;
  const approvedCount = requests.filter((item) => isRequestFullyApproved(item)).length;
  const rejectedCount = requests.filter((item) => isRequestRejected(item)).length;
  
  const hideStatusColumn = ["IT_STAFF", "MANAGER"].includes(user?.role);
  const showActionDropdown = user?.role !== "IT_STAFF";

  // Filter requests based on search and statusFilter
  const filteredRequests = requests.filter((item) => {
    // 1. Status Filter
    let matchesStatus = true;
    if (statusFilter === "PENDING") {
      matchesStatus = !isRequestFullyApproved(item) && !isRequestRejected(item);
    } else if (statusFilter === "APPROVED") {
      matchesStatus = isRequestFullyApproved(item);
    } else if (statusFilter === "REJECTED") {
      matchesStatus = isRequestRejected(item);
    }

    // 2. Search Text
    const searchLower = search.toLowerCase();
    const matchesSearch =
      String(item.requestId || "").toLowerCase().includes(searchLower) ||
      String(item.requestedBy || "").toLowerCase().includes(searchLower) ||
      String(item.department || "").toLowerCase().includes(searchLower) ||
      String(item.category || "").toLowerCase().includes(searchLower) ||
      String(item.requestType || "").toLowerCase().includes(searchLower);

    return matchesStatus && matchesSearch;
  });

  const renderRequestId = (id) => (
    <strong style={{ color: "#0d9488", fontFamily: "monospace", fontSize: "13px" }}>
      {id || "-"}
    </strong>
  );

  const renderType = (type) => (
    <span style={{ fontWeight: "600", color: "#1e293b", textTransform: "capitalize" }}>
      {String(type || "").toLowerCase()}
    </span>
  );

  const renderPriority = (priority) => {
    const p = String(priority || "low").toLowerCase();
    let style = { color: "#64748b", background: "#f1f5f9", border: "1px solid #cbd5e1" };
    if (p.includes("high") || p.includes("critical")) {
      style = { color: "#ef4444", background: "#fef2f2", border: "1px solid #fca5a5" };
    } else if (p.includes("medium")) {
      style = { color: "#f59e0b", background: "#fffbeb", border: "1px solid #fde68a" };
    } else if (p.includes("low")) {
      style = { color: "#3b82f6", background: "#eff6ff", border: "1px solid #bfdbfe" };
    }
    return (
      <span 
        style={{ 
          fontSize: "11px", 
          fontWeight: "600", 
          padding: "3px 8px", 
          borderRadius: "12px", 
          textTransform: "capitalize",
          display: "inline-block",
          ...style 
        }}
      >
        {priority || "Low"}
      </span>
    );
  };

  const requestColumns = [
    {
      key: "requestId",
      label: "Request ID",
      render: (row) => renderRequestId(row.requestId),
    },
    {
      key: "requestType",
      label: "Type",
      render: (row) => renderType(row.requestType),
    },
    { key: "requestedBy", label: "Requested By" },
    { key: "department", label: "Department" },
    { key: "category", label: "Asset Type" },
    {
      key: "requestPriority",
      label: "Priority",
      render: (row) => renderPriority(row.requestPriority),
    },
    {
      key: "managerApproval",
      label: "Manager",
      render: (row) => <ApprovalBadge value={row.managerApproval} />,
    },
    {
      key: "adminApproval",
      label: "IT/Admin",
      render: (row) => <ApprovalBadge value={row.adminApproval} />,
    },
  ];

  if (!hideStatusColumn) {
    requestColumns.push({
      key: "requestStatus",
      label: "Status",
      render: (row) => <ApprovalBadge value={row.requestStatus} />,
    });
  }

  requestColumns.push({
    key: "action",
    label: "Action",
    render: (row) => {
      const step = getNextApprovalStep(row, user?.role);
      const changeStep = !step ? getChangeableApprovalStep(row, user?.role) : null;
      const fullyApproved = isRequestFullyApproved(row);
      const canDelete = canDeleteRequest(row);
      const canEdit = canEditRequest(row);
      const busy = approvingId === row._id;

      return (
        <div className="module-actions request-row-actions">
          {canEdit ? (
            <button
              type="button"
              className="module-button secondary-button"
              onClick={() => navigate(`/edit-request/${row._id}`)}
            >
              Edit
            </button>
          ) : (
            <span className="request-action-done">Completed</span>
          )}

          {(step || changeStep) && showActionDropdown ? (
            <div className="request-action-dropdown-group">
              <select
                className="request-action-select"
                value={selectedAction[row._id] || "none"}
                disabled={busy}
                onChange={(event) =>
                  setSelectedAction((prev) => ({
                    ...prev,
                    [row._id]: event.target.value,
                  }))
                }
              >
                <option value="none">Select action</option>
                <option value="approve">{step?.label || changeStep?.label}</option>
                <option value="reject">Reject ({step?.stepName || changeStep?.stepName})</option>
              </select>
              <button
                type="button"
                className="module-button"
                disabled={busy || !selectedAction[row._id] || selectedAction[row._id] === "none"}
                onClick={() => handleSelectedAction(row, step || changeStep)}
              >
                {busy ? "Saving…" : "Apply"}
              </button>
            </div>
          ) : step && !showActionDropdown ? (
            <span className="request-action-wait">Action not available</span>
          ) : fullyApproved ? (
            <span className="request-action-approved">Approved</span>
          ) : isRequestRejected(row) ? (
            <span className="request-action-rejected">Rejected</span>
          ) : (
            <span className="request-action-wait" title="Waiting for manager approval first">
              Awaiting manager
            </span>
          )}

          {canDelete ? (
            <button
              type="button"
              className="module-button danger"
              onClick={() => setDeleteTarget(row)}
            >
              Delete
            </button>
          ) : (
            <button type="button" className="module-button danger" disabled title="Cannot delete after approval">
              Delete
            </button>
          )}
        </div>
      );
    },
  });

  const approveStep = async (request, step) => {
    if (!step?.field) return;
    setApprovingId(request._id);
    try {
      const oldValue = request[step.field] || "Pending";
      const payload = buildApprovalPayload(request, step.field);
      await dispatch(updateAsset({ id: request._id, payload })).unwrap();
      await dispatch(fetchAssetList());

      const fullyApproved = payload.requestStatus === "Approved";
      const requestName = request.requestId || request.assetName || "Request";
      
      // Build notification message with state change info
      let title = fullyApproved ? "✓ Request fully approved" : `✓ ${step.stepName} approved`;
      let message = `${requestName}`;
      
      if (oldValue !== "Approved") {
        // State changed
        message += ` — ${step.stepName} status: ${oldValue} → Approved`;
      } else {
        // Reconfirmed same state
        message += ` — ${step.stepName} status confirmed`;
      }
      
      if (fullyApproved) {
        message += ". Ready for next steps.";
      } else {
        message += ". Awaiting next approval.";
      }

      showToast({ title, message, type: "success" });
    } catch (error) {
      showToast({
        title: "Approval failed",
        message: error || "Could not approve this request.",
        type: "error",
      });
    } finally {
      setApprovingId("");
      setSelectedAction((prev) => ({ ...prev, [request._id]: "none" }));
    }
  };

  const rejectStep = async (request, step) => {
    if (!step?.field) return;
    setApprovingId(request._id);
    try {
      const oldValue = request[step.field] || "Pending";
      const payload = buildRejectionPayload(request, step.field);
      await dispatch(updateAsset({ id: request._id, payload })).unwrap();
      await dispatch(fetchAssetList());

      const requestName = request.requestId || request.assetName || "Request";
      
      // Build notification message with state change info
      let title = `✗ ${step.stepName} rejected`;
      let message = `${requestName}`;
      
      if (oldValue !== "Rejected") {
        // State changed
        message += ` — ${step.stepName} status: ${oldValue} → Rejected`;
      } else {
        // Reconfirmed same state
        message += ` — ${step.stepName} rejection confirmed`;
      }

      showToast({ title, message, type: "info" });
    } catch (error) {
      showToast({
        title: "Rejection failed",
        message: error || "Could not reject this request.",
        type: "error",
      });
    } finally {
      setApprovingId("");
      setSelectedAction((prev) => ({ ...prev, [request._id]: "none" }));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dispatch(deleteAsset(deleteTarget._id)).unwrap();
      showToast({ title: "Request deleted", message: "The request was removed." });
    } catch (error) {
      showToast({
        title: "Delete failed",
        message: error || "Unable to delete this request.",
        type: "error",
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSelectedAction = async (request, step) => {
    const action = selectedAction[request._id];
    if (action === "approve") {
      await approveStep(request, step);
    } else if (action === "reject") {
      await rejectStep(request, step);
    }
  };

  return (
    <div className="dashboard-container requests-page-container">
      {/* Header Row */}
      <div className="dashboard-header-row">
        <div className="hero-text-block">
          <h2>Request & Approval Workflow</h2>
          <p>Employee asset requests, manager checks, and IT/Admin approvals.</p>
        </div>
        <button 
          type="button" 
          className="dashboard-add-btn" 
          onClick={() => navigate("/add-request")}
        >
          <FaPlus style={{ marginRight: '6px' }} /> Add Request
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-cards-grid">
        {[
          {
            label: "Total Requests",
            value: requests.length,
            icon: <FaClipboardCheck />,
            color: "#0EA5E9",
            subtext: "Total submitted requests",
          },
          {
            label: "Pending",
            value: pendingCount,
            icon: <FaSyncAlt />,
            color: "#F59E0B",
            subtext: "Awaiting approval decision",
          },
          {
            label: "Approved",
            value: approvedCount,
            icon: <FaCheckCircle />,
            color: "#10B981",
            subtext: "Ready for procurement/handoff",
          },
          {
            label: "Rejected",
            value: rejectedCount,
            icon: <FaTimes />,
            color: "#EF4444",
            subtext: "Declined requests",
          },
        ].map((kpi) => (
          <div className="kpi-card-new" key={kpi.label}>
            <div className="kpi-card-content">
              <span className="kpi-card-label">{kpi.label}</span>
              <strong className="kpi-card-value">{kpi.value}</strong>
              <span className="kpi-card-subtext">{kpi.subtext}</span>
            </div>
            <div
              className="kpi-card-icon-container"
              style={{ color: kpi.color, backgroundColor: `${kpi.color}15` }}
            >
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Table & Filters Card */}
      <div className="bottom-card-large" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="requests-toolbar">
          <div className="requests-toolbar-left">
            <div className="search-box-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by ID, name, department, category..."
                className="search-input-premium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="filter-wrapper">
              <span className="filter-label">
                <FaFilter style={{ fontSize: '11px' }} /> Status:
              </span>
              <select
                className="status-filter-premium"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
          <div className="requests-toolbar-right">
            Showing {filteredRequests.length} of {requests.length} records
          </div>
        </div>

        <div className="table-responsive-new">
          <DataTable
            columns={requestColumns}
            rows={filteredRequests}
            emptyText="No matching requests found"
          />
        </div>
      </div>

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        title="DELETE REQUEST?"
        message={
          deleteTarget
            ? `Delete request "${deleteTarget.requestId || deleteTarget.assetName}" permanently?`
            : ""
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default Requests;

