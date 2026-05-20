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
import { pushAppNotification } from "../utils/notificationStore";
import {
  APPROVAL_PENDING,
  buildApprovalPayload,
  buildRejectionPayload,
  canDeleteRequest,
  canEditRequest,
  getNextApprovalStep,
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

  const requests = getRequestRecords(assetListData);
  const pendingCount = requests.filter((item) => !isRequestFullyApproved(item)).length;
  const approvedCount = requests.filter((item) => isRequestFullyApproved(item)).length;

  const approveStep = async (request, step) => {
    if (!step?.field) return;
    setApprovingId(request._id);
    try {
      const payload = buildApprovalPayload(request, step.field);
      await dispatch(updateAsset({ id: request._id, payload })).unwrap();
      await dispatch(fetchAssetList());

      const fullyApproved = payload.requestStatus === "Approved";
      const title = fullyApproved ? "Request fully approved" : `${step.stepName} approval done`;
      const message = fullyApproved
        ? `${request.requestId || request.assetName || "Request"} is ready for next steps.`
        : `${request.requestId || request.assetName || "Request"} — waiting for next approval.`;

      showToast({ title, message, type: "success" });
      pushAppNotification({ title, message, type: "success", meta: { requestId: request._id } });
    } catch (error) {
      showToast({
        title: "Approval failed",
        message: error || "Could not approve this request.",
        type: "error",
      });
    } finally {
      setApprovingId("");
    }
  };

  const rejectStep = async (request, step) => {
    if (!step?.field) return;
    setApprovingId(request._id);
    try {
      const payload = buildRejectionPayload(request, step.field);
      await dispatch(updateAsset({ id: request._id, payload })).unwrap();
      await dispatch(fetchAssetList());

      const title = `${step.stepName} Request Rejected`;
      const message = `${request.requestId || request.assetName || "Request"} has been rejected.`;

      showToast({ title, message, type: "info" });
      pushAppNotification({ title, message, type: "info", meta: { requestId: request._id } });
    } catch (error) {
      showToast({
        title: "Rejection failed",
        message: error || "Could not reject this request.",
        type: "error",
      });
    } finally {
      setApprovingId("");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dispatch(deleteAsset(deleteTarget._id)).unwrap();
      showToast({ title: "Request deleted", message: "The request was removed." });
      pushAppNotification({
        title: "Request deleted",
        message: `${deleteTarget.requestId || "Request"} removed.`,
        type: "info",
      });
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
        columns={[
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
          {
            key: "requestStatus",
            label: "Status",
            render: (row) => <ApprovalBadge value={row.requestStatus} />,
          },
          {
            key: "action",
            label: "Action",
            render: (row) => {
              const step = getNextApprovalStep(row, user?.role);
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

                  {step ? (
                    <>
                      <button
                        type="button"
                        className="module-button"
                        disabled={busy}
                        onClick={() => approveStep(row, step)}
                      >
                        {busy ? "Saving…" : step.label}
                      </button>
                      <button
                        type="button"
                        className="module-button danger"
                        disabled={busy}
                        onClick={() => rejectStep(row, step)}
                      >
                        {busy ? "Saving…" : `Reject (${step.stepName})`}
                      </button>
                    </>
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
          },
        ]}
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
