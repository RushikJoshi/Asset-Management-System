import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  DataTable,
  KpiGrid,
  PageTitle,
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

  const requests = getRequestRecords(assetListData);
  const pendingCount = requests.filter((item) => !isRequestFullyApproved(item)).length;
  const approvedCount = requests.filter((item) => isRequestFullyApproved(item)).length;
  const hideStatusColumn = ["IT_STAFF", "MANAGER"].includes(user?.role);
  const showActionDropdown = user?.role !== "IT_STAFF";

  const requestColumns = [
    { key: "requestId", label: "Request ID" },
    { key: "requestType", label: "Type" },
    { key: "requestedBy", label: "Requested By" },
    { key: "department", label: "Department" },
    { key: "category", label: "Asset Type" },
    { key: "requestPriority", label: "Priority" },
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
    <>
      <PageTitle
        eyebrow="Asset Request"
        title="Request & Approval Workflow"
        description="Employee request, manager approval, IT/admin approval, and purchase handoff."
        action={<button type="button" className="module-button" onClick={() => navigate("/add-request")}>Add Request</button>}
      />

      <KpiGrid
        items={[
          { label: "Requests", value: requests.length },
          { label: "Pending", value: pendingCount },
          { label: "Approved", value: approvedCount },
        ]}
      />

      <DataTable
        columns={requestColumns}
        rows={requests}
      />

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
    </>
  );
}

export default Requests;
