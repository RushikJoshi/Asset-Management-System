import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import {
  fetchScannedAsset,
  fetchSingleAsset,
  updateAsset,
} from "../store/slices/assetSlice";
import { loadAssetFormConfig } from "../utils/assetFormBuilder";
import { isNetworkAssetCategory } from "../utils/categoryCatalog";
import { useToast } from "./toast/toastStore";
import "./AssetDetails.css";

const currency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;
const dateText = (value) => (value ? new Date(value).toLocaleDateString("en-IN") : "-");

function AssetDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { singleAssetData, loading, error } = useSelector((state) => state.assetList);
  const [activeTab, setActiveTab] = useState("overview");
  const [repairForm, setRepairForm] = useState({ status: "OPEN", priority: "Medium" });
  const [transferForm, setTransferForm] = useState({ transferType: "Employee Transfer", approvalStatus: "Pending" });
  const [auditForm, setAuditForm] = useState({ physicalStatus: "Verified" });

  const isScanPage = location.pathname.startsWith("/scan");

  useEffect(() => {
    if (isScanPage) {
      dispatch(fetchScannedAsset({ id, token: searchParams.get("t") }));
      return;
    }
    dispatch(fetchSingleAsset(id));
  }, [dispatch, id, isScanPage, searchParams]);

  const asset = singleAssetData || {};
  const showComputerDetails = isNetworkAssetCategory(
    asset.category,
    loadAssetFormConfig().__categoryCatalog,
  );

  const totalRepairCost = useMemo(
    () => asset.repairHistory?.reduce((sum, item) => sum + Number(item.repairCost || 0), 0) || 0,
    [asset.repairHistory],
  );

  const warrantyStatus = useMemo(() => {
    if (!asset.warrantyEnd) return "No warranty date";
    const days = Math.ceil((new Date(asset.warrantyEnd) - new Date()) / 86400000);
    if (days < 0) return "Expired";
    if (days <= Number(asset.warrantyReminderDays || 10)) return `Expires in ${days} days`;
    return `${days} days remaining`;
  }, [asset.warrantyEnd, asset.warrantyReminderDays]);

  const stickerDetails = [
    ["Asset Name", asset.assetName],
    ["Serial No", asset.serialNumber],
    ["Company Name", asset.companyName || asset.ownerName || asset.vendor || "AssetPro"],
    ["Branch", asset.branchName || asset.branchCode || asset.department],
    ["Office Name", asset.officeName || asset.location],
    ["Asset No", asset.assetCode || asset._id],
  ];

  const saveWorkflow = async (payload) => {
    await dispatch(updateAsset({ id: asset._id, payload })).unwrap();
    if (isScanPage) {
      dispatch(fetchScannedAsset({ id, token: searchParams.get("t") }));
    } else {
      dispatch(fetchSingleAsset(id));
    }
  };

  const addRepair = async (event) => {
    event.preventDefault();
    try {
      await saveWorkflow({
        repairHistory: [...(asset.repairHistory || []), repairForm],
        assetStatus: repairForm.status === "COMPLETED" ? "AVAILABLE" : "UNDER_REPAIR",
        lifecycleTimeline: [
          ...(asset.lifecycleTimeline || []),
          {
            title: `Repair ${repairForm.status}`,
            detail: `${repairForm.issue || "Issue"} - ${repairForm.repairDetails || "Repair updated"}`,
            date: new Date(),
          },
        ],
      });
      setRepairForm({ status: "OPEN", priority: "Medium" });
      showToast({ title: "Repair saved", message: "Repair history was updated successfully." });
    } catch (error) {
      showToast({ title: "Repair failed", message: error || "Unable to save repair.", type: "error" });
    }
  };

  const addTransfer = async (event) => {
    event.preventDefault();
    try {
      await saveWorkflow({
        transferHistory: [...(asset.transferHistory || []), transferForm],
        assignedTo: transferForm.toEmployee || asset.assignedTo,
        officeName: transferForm.toOffice || asset.officeName,
        lifecycleTimeline: [
          ...(asset.lifecycleTimeline || []),
          {
            title: transferForm.transferType,
            detail: `Transferred to ${transferForm.toEmployee || transferForm.toOffice || "new owner"}.`,
            date: new Date(),
          },
        ],
      });
      setTransferForm({ transferType: "Employee Transfer", approvalStatus: "Pending" });
      showToast({ title: "Transfer saved", message: "Asset transfer was updated successfully." });
    } catch (error) {
      showToast({ title: "Transfer failed", message: error || "Unable to save transfer.", type: "error" });
    }
  };

  const addAudit = async (event) => {
    event.preventDefault();
    try {
      await saveWorkflow({
        auditLogs: [...(asset.auditLogs || []), auditForm],
        lifecycleTimeline: [
          ...(asset.lifecycleTimeline || []),
          {
            title: "Audit Verification",
            detail: `${auditForm.physicalStatus || "Verified"} by ${auditForm.verifiedBy || "auditor"}.`,
            date: new Date(),
          },
        ],
      });
      setAuditForm({ physicalStatus: "Verified" });
      showToast({ title: "Audit saved", message: "Audit verification was updated successfully." });
    } catch (error) {
      showToast({ title: "Audit failed", message: error || "Unable to save audit.", type: "error" });
    }
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <h2>Loading Asset Details...</h2>
      </div>
    );
  }

  if (error) return <p className="asset-message">{error}</p>;
  if (!asset?._id) return <p className="asset-message">No Asset Found</p>;

  return (
    <div className={`asset-container${activeTab === "sticker" ? " asset-container--sticker-fit" : ""}`}>
      <header className="asset-header">
        <div>
          <p className="eyebrow">{isScanPage ? "QR Scan Details" : "Asset Lifecycle"}</p>
          <h1>{asset.assetName}</h1>
          <p>{asset.assetCode || asset.serialNumber || "Asset record"}</p>
        </div>
        <span className={`status-badge ${asset.assetStatus?.toLowerCase()}`}>
          {asset.assetStatus}
        </span>
      </header>

      <div className="metric-grid">
        <div className="metric-card"><span>Total Repair Cost</span><strong>{currency(totalRepairCost)}</strong></div>
        <div className="metric-card"><span>Warranty</span><strong>{warrantyStatus}</strong></div>
        <div className="metric-card"><span>Office</span><strong>{asset.officeName || "-"}</strong></div>
        <div className="metric-card"><span>Assigned To</span><strong>{asset.assignedTo || "Inventory"}</strong></div>
      </div>

      <div className="tab-row">
        {["overview", "repairs", "transfer", "audit", "timeline", "sticker"].map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "active-tab" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          <div className="asset-grid">
            <InfoCard title="Asset Info" rows={[
              ["Category", asset.category],
              ["Sub-Category", asset.subCategory],
              ["Brand / Model", [asset.brand, asset.model].filter(Boolean).join(" / ")],
              ["Serial No", asset.serialNumber],
              ["Type", asset.assetType],
            ]} />
            <InfoCard title="Request & Assignment" rows={[
              ["Request ID", asset.requestId],
              ["Requested By", asset.requestedBy],
              ["Approvals", `${asset.managerApproval || "-"} / ${asset.adminApproval || "-"}`],
              ["Employee ID", asset.employeeId],
              ["Employee Email", asset.employeeEmail],
              ["Assigned Date", dateText(asset.assignedDate)],
              ["Expected Return", dateText(asset.expectedReturn)],
            ]} />
            <InfoCard title="Purchase & Warranty" rows={[
              ["Vendor", asset.vendor],
              ["Invoice", asset.invoiceNumber],
              ["Price", currency(asset.price)],
              ["Purchase Date", dateText(asset.purchaseDate)],
              ["Warranty End", dateText(asset.warrantyEnd)],
            ]} />
            <InfoCard title="Office / Branch" rows={[
              ["Office", asset.officeName],
              ["Branch Code", asset.branchCode],
              ["Floor / Room", [asset.floor, asset.room].filter(Boolean).join(" / ")],
              ["Department", asset.department],
              ["City / State", [asset.city, asset.state].filter(Boolean).join(" / ")],
            ]} />
            {showComputerDetails && (
              <>
                <InfoCard title="IP Configuration" rows={[
                  ["IP Address", asset.ipAddress],
                  ["MAC Address", asset.macAddress],
                  ["Host Name", asset.hostName],
                  ["Network Type", asset.networkType],
                  ["Subnet / Gateway", [asset.subnet, asset.gateway].filter(Boolean).join(" / ")],
                ]} />
                <InfoCard title="Computer Specifications" rows={[
                  ["Operating System", asset.operatingSystem],
                  ["Processor", asset.processor],
                  ["RAM", asset.ram],
                  ["Storage", asset.storage],
                  ["Antivirus / Domain", [asset.antivirus, asset.domainName].filter(Boolean).join(" / ")],
                ]} />
              </>
            )}
          </div>
          <section className="description-card">
            <h3>Description</h3>
            <p>{asset.assetDescription || "No notes added."}</p>
          </section>
        </>
      )}

      {activeTab === "repairs" && (
        <WorkflowPanel
          title="Maintenance & Repair"
          rows={asset.repairHistory || []}
          columns={["ticketId", "issue", "repairDetails", "repairCost", "vendorName", "status"]}
        >
          <form className="workflow-form" onSubmit={addRepair}>
            <input placeholder="Ticket ID" value={repairForm.ticketId || ""} onChange={(e) => setRepairForm({ ...repairForm, ticketId: e.target.value })} />
            <input placeholder="Issue" value={repairForm.issue || ""} onChange={(e) => setRepairForm({ ...repairForm, issue: e.target.value })} />
            <input placeholder="Repair Details" value={repairForm.repairDetails || ""} onChange={(e) => setRepairForm({ ...repairForm, repairDetails: e.target.value })} />
            <input placeholder="Vendor" value={repairForm.vendorName || ""} onChange={(e) => setRepairForm({ ...repairForm, vendorName: e.target.value })} />
            <input placeholder="Cost" value={repairForm.repairCost || ""} onChange={(e) => setRepairForm({ ...repairForm, repairCost: e.target.value })} />
            <select value={repairForm.status} onChange={(e) => setRepairForm({ ...repairForm, status: e.target.value })}>
              <option>OPEN</option>
              <option>UNDER_REPAIR</option>
              <option>COMPLETED</option>
            </select>
            <button type="submit">Add Repair</button>
          </form>
        </WorkflowPanel>
      )}

      {activeTab === "transfer" && (
        <WorkflowPanel
          title="Asset Transfer / Return"
          rows={asset.transferHistory || []}
          columns={["transferType", "fromEmployee", "toEmployee", "fromOffice", "toOffice", "approvalStatus"]}
        >
          <form className="workflow-form" onSubmit={addTransfer}>
            <select value={transferForm.transferType} onChange={(e) => setTransferForm({ ...transferForm, transferType: e.target.value })}>
              <option>Employee Transfer</option>
              <option>Department Transfer</option>
              <option>Office Transfer</option>
              <option>Return Asset</option>
            </select>
            <input placeholder="From Employee" value={transferForm.fromEmployee || ""} onChange={(e) => setTransferForm({ ...transferForm, fromEmployee: e.target.value })} />
            <input placeholder="To Employee" value={transferForm.toEmployee || ""} onChange={(e) => setTransferForm({ ...transferForm, toEmployee: e.target.value })} />
            <input placeholder="From Office" value={transferForm.fromOffice || ""} onChange={(e) => setTransferForm({ ...transferForm, fromOffice: e.target.value })} />
            <input placeholder="To Office" value={transferForm.toOffice || ""} onChange={(e) => setTransferForm({ ...transferForm, toOffice: e.target.value })} />
            <button type="submit">Save Transfer</button>
          </form>
        </WorkflowPanel>
      )}

      {activeTab === "audit" && (
        <WorkflowPanel
          title="Audit Verification"
          rows={asset.auditLogs || []}
          columns={["auditDate", "verifiedBy", "physicalStatus", "locationVerified", "notes"]}
        >
          <form className="workflow-form" onSubmit={addAudit}>
            <input placeholder="Verified By" value={auditForm.verifiedBy || ""} onChange={(e) => setAuditForm({ ...auditForm, verifiedBy: e.target.value })} />
            <select value={auditForm.physicalStatus} onChange={(e) => setAuditForm({ ...auditForm, physicalStatus: e.target.value })}>
              <option>Verified</option>
              <option>Missing</option>
              <option>Damaged</option>
            </select>
            <select value={auditForm.locationVerified || ""} onChange={(e) => setAuditForm({ ...auditForm, locationVerified: e.target.value })}>
              <option value="">Select</option>
              <option value="Haan">Haan</option>
              <option value="Naa">Naa</option>
            </select>
            <input placeholder="Notes" value={auditForm.notes || ""} onChange={(e) => setAuditForm({ ...auditForm, notes: e.target.value })} />
            <button type="submit">Mark Audit</button>
          </form>
        </WorkflowPanel>
      )}

      {activeTab === "timeline" && (
        <section className="description-card">
          <h3>Asset Timeline</h3>
          <div className="timeline">
            {(asset.lifecycleTimeline || []).map((item, index, list) => (
              <div className="timeline-entry" key={`${item.title}-${index}`}>
                <div className="timeline-marker">
                  <div className="timeline-dot" />
                  {index < list.length - 1 && <div className="timeline-line" />}
                </div>
                <div className="timeline-card">
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                  <span>{dateText(item.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "sticker" && (
        <section className="sticker-card">
          <div className="sticker-layout">
            <div className="qr-sticker">
              <h3>Company Asset</h3>
              <strong>{asset.assetCode || asset._id}</strong>
              <p>{asset.assetName}</p>
              <img src={asset.qrCode} alt="Asset QR" />
              <span>Scan For Details</span>
            </div>

            <div className="sticker-details-panel">
              <p className="sticker-details-kicker">Asset Sticker Details</p>
              <h3>{asset.assetName}</h3>
              <div className="sticker-details-list">
                {stickerDetails.map(([label, value]) => (
                  <div className="sticker-detail-row" key={label}>
                    <span>{label}</span>
                    <strong>{value || "-"}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function InfoCard({ title, rows }) {
  return (
    <section className="info-card">
      <h3>{title}</h3>
      {rows.map(([label, value]) => (
        <div className="info-item" key={label}>
          <span>{label}:</span> {value || "-"}
        </div>
      ))}
    </section>
  );
}

function WorkflowPanel({ title, rows, columns, children }) {
  return (
    <section className="description-card">
      <h3>{title}</h3>
      {children}
      <div className="workflow-table-wrap">
        <table className="workflow-table">
          <thead>
            <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row, index) => (
              <tr key={row._id || index}>
                {columns.map((column) => (
                  <td key={column}>{column.toLowerCase().includes("date") ? dateText(row[column]) : row[column] || "-"}</td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length}>No records yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AssetDetails;
