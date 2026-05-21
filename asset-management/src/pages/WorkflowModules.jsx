import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchAssetList,
  refreshQrCodes,
  seedWarrantyMaintenanceDemo,
  updateAsset,
} from "../store/slices/assetSlice";
import {
  AssetLink,
  DataTable,
  KpiGrid,
  MiniBars,
  PageTitle,
} from "../components/common/ModuleComponents";
import {
  buildStats,
  currency,
  dateText,
  getInventoryAssets,
  groupByCount,
  repairCost,
  warrantyDays,
} from "../utils/assetUtils";
import { useToast } from "../components/toast/toastStore";
import { fetchRecommendedScanBaseUrl, getQrClientOrigin, getScanBaseUrl } from "../apis/apiConfig";
import { createRole, deleteRole, fetchRoles, updateRole } from "../utils/roleApi";
import { formatAccessLabels, MENU_ACCESS_OPTIONS, parseAccessLabels, PERMISSION_OPTIONS } from "../utils/permissions";
import { exportReportCsv, exportReportPdf, exportReportWord } from "../utils/reportExport";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal";
import "./RolesPage.css";

const assetColumns = [
  { key: "assetName", label: "Asset", render: (row) => <AssetLink asset={row} /> },
  { key: "assetCode", label: "Code" },
  { key: "assetStatus", label: "Status" },
  { key: "assignedTo", label: "Assigned To" },
  { key: "officeName", label: "Office" },
  { key: "department", label: "Department" },
];

const maintenanceDue = (asset) => {
  if (!asset.purchaseDate || !asset.maintenancePeriod) return null;
  const dueDate = new Date(asset.purchaseDate);
  dueDate.setMonth(dueDate.getMonth() + Number(asset.maintenancePeriod));

  while (dueDate < new Date()) {
    dueDate.setMonth(dueDate.getMonth() + Number(asset.maintenancePeriod));
  }

  return dueDate;
};

const maintenanceStatus = (asset) => {
  const dueDate = maintenanceDue(asset);
  if (!dueDate) return "Not configured";
  const days = Math.ceil((dueDate - new Date()) / 86400000);
  if (asset.assetStatus === "UNDER_REPAIR") return "Under repair";
  if (days <= 7) return `Due in ${days} days`;
  return `Next due in ${days} days`;
};

function useDemoLoader() {
  const dispatch = useDispatch();
  const { showToast } = useToast();

  return async () => {
    try {
      const result = await dispatch(seedWarrantyMaintenanceDemo()).unwrap();
      await dispatch(fetchAssetList());
      showToast({
        title: "Demo data loaded",
        message: `${result.count || 0} warranty and maintenance demo records are ready.`,
      });
    } catch (error) {
      showToast({
        title: "Demo load failed",
        message: error || "Unable to load demo warranty and maintenance data.",
        type: "error",
      });
    }
  };
}

export function Requests() {
  const { assetListData } = useModuleData();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const requests = getRequestRecords(assetListData);

  const removeRequest = async (id) => {
    const confirmed = window.confirm("Delete this request?");
    if (!confirmed) return;
    try {
      await dispatch(deleteAsset(id)).unwrap();
      showToast({ title: "Request deleted", message: "The request was removed successfully." });
    } catch (error) {
      showToast({
        title: "Delete failed",
        message: error || "Unable to delete this request.",
        type: "error",
      });
    }
  };

  const approve = async (asset, field) => {
    try {
      await dispatch(updateAsset({ id: asset._id, payload: { [field]: "Approved", requestStatus: "Approved" } })).unwrap();
      showToast({
        title: "Request approved",
        message: `${asset.assetName || "Asset request"} approved successfully.`,
      });
    } catch (error) {
      showToast({
        title: "Approval failed",
        message: error || "Unable to approve this request.",
        type: "error",
      });
    }
  };

  return (
    <>
      <PageTitle
        eyebrow="Asset Request"
        title="Request & Approval Workflow"
        description="Employee request, manager approval, IT/admin approval, and purchase handoff."
      />
      <KpiGrid 
        action={<button className="module-button" onClick={() => navigate("/add-request")}>Add Request</button>}
        items={[
          { label: "Requests", value: requests.length },
          { label: "Pending", value: requests.filter((item) => item.requestStatus !== "Approved").length },
          { label: "Approved", value: requests.filter((item) => item.requestStatus === "Approved").length },
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
          { key: "managerApproval", label: "Manager" },
          { key: "adminApproval", label: "IT/Admin" },
          {
            key: "action",
            label: "Action",
            render: (row) => (
              <div className="module-actions">
                <button className="module-button" onClick={() => navigate(`/edit-request/${row._id}`)}>Edit</button>
                <button className="module-button" onClick={() => approve(row, "adminApproval")}>Approve</button>
                <button className="module-button danger" onClick={() => removeRequest(row._id)}>Delete</button>
              </div>
            ),
          },
        ]}
        rows={requests}
      />
    </>
  );
}

export function Inventory() {
  const { assetListData } = useModuleData();
  const inventoryAssets = getInventoryAssets(assetListData);
  const stats = buildStats(assetListData);

  return (
    <>
      <PageTitle eyebrow="Inventory" title="Inventory Tracking" description="Status, office-wise, and category-wise inventory control." />
      <KpiGrid items={[
        { label: "Total", value: stats.total },
        { label: "Available", value: stats.available },
        { label: "Assigned", value: stats.assigned },
        { label: "Repair", value: stats.repair },
      ]} />
      <div className="chart-grid">
        <MiniBars title="Office-wise Assets" data={groupByCount(inventoryAssets, "officeName")} />
        <MiniBars title="Category-wise Assets" data={groupByCount(inventoryAssets, "category")} />
      </div>
      <DataTable columns={assetColumns} rows={inventoryAssets} />
    </>
  );
}

export function Employees() {
  const { assetListData } = useModuleData();
  const { user } = useSelector((state) => state.auth);
  const visibleAssets = user?.role === "EMPLOYEE"
    ? assetListData.filter((asset) =>
      [asset.employeeId, asset.assignedTo, asset.ownerName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase() === String(user.employeeId || user.name).toLowerCase()),
    )
    : assetListData;
  const employees = useMemo(() => {
    const map = {};
    visibleAssets.forEach((asset) => {
      const employee = asset.assignedTo || asset.ownerName;
      if (!employee) return;
      if (!map[employee]) {
        map[employee] = {
          id: employee,
          employee,
          department: asset.department,
          officeName: asset.officeName,
          assignedAssets: 0,
          repairCost: 0,
        };
      }
      map[employee].assignedAssets += 1;
      map[employee].repairCost += repairCost(asset);
    });
    return Object.values(map);
  }, [visibleAssets]);

  return (
    <>
      <PageTitle eyebrow="Employee Portal" title="Employee Assets" description="Assigned assets, ownership, repair access, and warranty visibility." />
      <KpiGrid items={[
        { label: "Employees With Assets", value: employees.length },
        { label: "Assigned Assets", value: visibleAssets.filter((asset) => asset.assignedTo).length },
      ]} />
      <DataTable
        columns={[
          { key: "employee", label: "Employee" },
          { key: "department", label: "Department" },
          { key: "officeName", label: "Office" },
          { key: "assignedAssets", label: "Assets" },
          { key: "repairCost", label: "Repair Cost", render: (row) => currency(row.repairCost) },
        ]}
        rows={employees}
      />
    </>
  );
}

export function Assignments() {
  const { assetListData } = useModuleData();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const [selectedId, setSelectedId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [assignedBy, setAssignedBy] = useState("Admin");

  const assign = async (event) => {
    event.preventDefault();
    if (!selectedId || !assignedTo) return;
    try {
      await dispatch(updateAsset({
        id: selectedId,
        payload: {
          assignedTo,
          employeeId,
          employeeEmail,
          assignedBy,
          assignedDate: new Date(),
          assetStatus: "ASSIGNED",
        },
      })).unwrap();
      showToast({
        title: "Asset assigned",
        message: `Asset assigned to ${assignedTo}.`,
      });
      setSelectedId("");
      setAssignedTo("");
      setEmployeeId("");
      setEmployeeEmail("");
    } catch (error) {
      showToast({
        title: "Assignment failed",
        message: error || "Unable to assign this asset.",
        type: "error",
      });
    }
  };

  return (
    <>
      <PageTitle eyebrow="Assignments" title="Assign, Transfer & Return Assets" description="Assign assets to employees and use the detail page for transfers and returns." />
      <form className="action-panel" onSubmit={assign}>
        <h3>Quick Assign Asset</h3>
        <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
          <option value="">Select available asset</option>
          {assetListData.map((asset) => <option value={asset._id} key={asset._id}>{asset.assetName} - {asset.assetCode}</option>)}
        </select>
        <input placeholder="Employee name" value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} />
        <input placeholder="Employee ID" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} />
        <input placeholder="Employee email" value={employeeEmail} onChange={(event) => setEmployeeEmail(event.target.value)} />
        <input placeholder="Assigned by" value={assignedBy} onChange={(event) => setAssignedBy(event.target.value)} />
        <button type="submit">Assign Asset</button>
      </form>
      <DataTable columns={assetColumns} rows={assetListData.filter((asset) => asset.assignedTo)} />
    </>
  );
}

export function Maintenance() {
  const { assetListData } = useModuleData();
  const loadDemoData = useDemoLoader();
  const repairs = assetListData.flatMap((asset) =>
    (asset.repairHistory || []).map((repair) => ({
      ...repair,
      assetName: asset.assetName,
      assetCode: asset.assetCode,
      officeName: asset.officeName,
    })),
  );

  return (
    <>
      <PageTitle
        eyebrow="Maintenance"
        title="Tickets & Repair History"
        description="Open tickets, repair spend, vendors, and permanent repair records."
      />
      <KpiGrid 
        action={<button className="module-button" onClick={loadDemoData}>Load Demo Data</button>}
        items={[
          { label: "Tickets", value: repairs.length },
          { label: "Open", value: repairs.filter((item) => item.status !== "COMPLETED").length },
          { label: "Assets Under Repair", value: assetListData.filter((asset) => asset.assetStatus === "UNDER_REPAIR").length },
          { label: "Maintenance Due Soon", value: assetListData.filter((asset) => maintenanceStatus(asset).startsWith("Due in")).length },
          { label: "Repair Spend", value: currency(repairs.reduce((sum, item) => sum + Number(item.repairCost || 0), 0)) },
        ]} 
      />
      <DataTable
        columns={[
          { key: "assetName", label: "Asset", render: (row) => <AssetLink asset={row} /> },
          { key: "assetCode", label: "Code" },
          { key: "maintenancePeriod", label: "Maintenance Period", render: (row) => row.maintenancePeriod ? `${row.maintenancePeriod} months` : "-" },
          { key: "nextMaintenance", label: "Next Maintenance", render: (row) => dateText(maintenanceDue(row)) },
          { key: "maintenanceStatus", label: "Check Result", render: (row) => maintenanceStatus(row) },
          { key: "assetStatus", label: "Asset Status" },
        ]}
        rows={assetListData.filter((asset) => asset.maintenancePeriod || asset.assetStatus === "UNDER_REPAIR")}
        emptyText="No maintenance configuration yet"
      />
      <DataTable
        columns={[
          { key: "ticketId", label: "Ticket" },
          { key: "assetName", label: "Asset" },
          { key: "issue", label: "Issue" },
          { key: "repairDetails", label: "Repair" },
          { key: "vendorName", label: "Vendor" },
          { key: "repairCost", label: "Cost", render: (row) => currency(row.repairCost) },
          { key: "status", label: "Status" },
        ]}
        rows={repairs}
      />
    </>
  );
}

export function Warranty() {
  const { assetListData } = useModuleData();
  const loadDemoData = useDemoLoader();
  const warranties = assetListData
    .filter((asset) => asset.warrantyEnd)
    .map((asset) => {
      const days = warrantyDays(asset);
      let warrantyCheck = "Active";

      if (days < 0) warrantyCheck = "Expired";
      else if (days <= Number(asset.warrantyReminderDays || 10)) warrantyCheck = "Expiring Soon";

      return { ...asset, days, warrantyCheck };
    });

  return (
    <>
      <PageTitle
        eyebrow="Warranty"
        title="Warranty & AMC Alerts"
        description="Expiry tracking and reminder workflow."
      />
      <KpiGrid 
        action={<button className="module-button" onClick={loadDemoData}>Load Demo Data</button>}
        items={[
          { label: "Tracked Warranties", value: warranties.length },
          { label: "Expiring Soon", value: warranties.filter((asset) => asset.days >= 0 && asset.days <= Number(asset.warrantyReminderDays || 10)).length },
          { label: "Expired", value: warranties.filter((asset) => asset.days < 0).length },
          { label: "Active", value: warranties.filter((asset) => asset.warrantyCheck === "Active").length },
        ]} 
      />
      <DataTable
        columns={[
          { key: "assetName", label: "Asset", render: (row) => <AssetLink asset={row} /> },
          { key: "vendor", label: "Vendor" },
          { key: "warrantyStart", label: "Start", render: (row) => dateText(row.warrantyStart) },
          { key: "warrantyEnd", label: "End", render: (row) => dateText(row.warrantyEnd) },
          { key: "days", label: "Days Left" },
          { key: "warrantyReminderDays", label: "Reminder Days" },
          { key: "warrantyCheck", label: "Check Result" },
        ]}
        rows={warranties}
      />
    </>
  );
}

export function Offices() {
  const { assetListData } = useModuleData();
  const offices = Object.entries(groupByCount(assetListData, "officeName")).map(([officeName, count]) => {
    const sample = assetListData.find((asset) => (asset.officeName || "Unassigned") === officeName) || {};
    return {
      id: officeName,
      officeName,
      count,
      branchCode: sample.branchCode,
      city: sample.city,
      state: sample.state,
      contact: sample.officeContactPerson,
      repairCost: assetListData
        .filter((asset) => (asset.officeName || "Unassigned") === officeName)
        .reduce((sum, asset) => sum + repairCost(asset), 0),
    };
  });

  return (
    <>
      <PageTitle eyebrow="Office Management" title="Branch & Location Control" description="Office, floor, department, room, transfers, and office-wise reporting." />
      <DataTable
        columns={[
          { key: "officeName", label: "Office" },
          { key: "branchCode", label: "Branch Code" },
          { key: "city", label: "City" },
          { key: "state", label: "State" },
          { key: "contact", label: "Contact" },
          { key: "count", label: "Assets" },
          { key: "repairCost", label: "Repair Cost", render: (row) => currency(row.repairCost) },
        ]}
        rows={offices}
      />
    </>
  );
}

export function Audit() {
  const { assetListData } = useModuleData();
  const navigate = useNavigate();
  const auditRows = assetListData.map((asset) => ({
    ...asset,
    lastAudit: asset.auditLogs?.[asset.auditLogs.length - 1],
  }));

  return (
    <>
      <PageTitle eyebrow="Audit" title="QR Verification & Audit Logs" description="Scan QR codes, verify physical assets, and identify missing inventory." />
      <KpiGrid items={[
        { label: "Assets", value: assetListData.length },
        { label: "Verified", value: auditRows.filter((asset) => asset.lastAudit?.physicalStatus === "Verified").length },
        { label: "Pending", value: auditRows.filter((asset) => !asset.lastAudit).length },
        { label: "Missing/Damaged", value: auditRows.filter((asset) => ["Missing", "Damaged"].includes(asset.lastAudit?.physicalStatus)).length },
      ]} />
      <DataTable
        columns={[
          { key: "assetName", label: "Asset", render: (row) => <AssetLink asset={row} /> },
          { key: "assetCode", label: "Code" },
          { key: "officeName", label: "Office" },
          { key: "lastAudit", label: "Last Status", render: (row) => row.lastAudit?.physicalStatus || "Pending" },
          { key: "auditDate", label: "Audit Date", render: (row) => dateText(row.lastAudit?.auditDate) },
          { key: "action", label: "Action", render: (row) => <button className="module-button" onClick={() => navigate(`/asset-details/${row._id}`)}>Verify</button> },
        ]}
        rows={auditRows}
      />
    </>
  );
}

export function Reports() {
  const { assetListData } = useModuleData();
  const { showToast } = useToast();
  const exportMenuRef = useRef(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const repairs = assetListData.flatMap((asset) => asset.repairHistory || []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleExport = (format) => {
    try {
      if (format === "csv") exportReportCsv(assetListData);
      if (format === "word") exportReportWord(assetListData);
      if (format === "pdf") exportReportPdf(assetListData);
      setExportMenuOpen(false);
      showToast({
        title: "Report exported",
        message: `Asset report downloaded as ${format.toUpperCase()}.`,
        type: "info",
      });
    } catch (error) {
      showToast({
        title: "Export failed",
        message: error?.message || "Unable to export report.",
        type: "error",
      });
    }
  };

  return (
    <>
      <PageTitle
        eyebrow="Reports"
        title="Reports & Analytics"
        description="Asset, repair, warranty, and office reports with CSV export."
      />
      <KpiGrid 
        action={(
          <div className="export-dropdown-wrap" ref={exportMenuRef}>
            <button 
              type="button" 
              className="module-button" 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px", 
                height: "36px", 
                padding: "0 16px", 
                fontSize: "13px", 
                borderRadius: "var(--radius-md)" 
              }} 
              onClick={() => setExportMenuOpen((open) => !open)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block" }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export Report</span>
            </button>
            {exportMenuOpen && (
              <div className="export-dropdown-menu">
                <button type="button" onClick={() => handleExport("pdf")}>Download PDF</button>
                <button type="button" onClick={() => handleExport("word")}>Download Word</button>
                <button type="button" onClick={() => handleExport("csv")}>Download CSV</button>
              </div>
            )}
          </div>
        )}
        items={[
          { label: "Total Assets", value: assetListData.length },
          { label: "Total Repair Cost", value: currency(assetListData.reduce((sum, asset) => sum + repairCost(asset), 0)) },
          { label: "Repair Records", value: repairs.length },
        ]} 
      />
      <div className="chart-grid">
        <MiniBars title="Office-wise Asset Count" data={groupByCount(assetListData, "officeName")} />
        <MiniBars title="Category-wise Asset Count" data={groupByCount(assetListData, "category")} />
      </div>
      <DataTable columns={assetColumns} rows={assetListData} />
    </>
  );
}

export function Roles() {
  const { showToast } = useToast();
  const [roles, setRoles] = useState([]);
  const [newRole, setNewRole] = useState({ label: "", sidebarAccess: [], permissions: [] });
  const [editingKey, setEditingKey] = useState("");
  const [editForm, setEditForm] = useState({ label: "", sidebarAccess: [], permissions: [] });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadRoles = async () => {
    const data = await fetchRoles();
    setRoles(
      data.map((role) => ({
        id: role.key,
        key: role.key,
        role: role.label,
        sidebarAccess: role.sidebarAccess?.length ? role.sidebarAccess : parseAccessLabels(role.access),
        permissions: role.permissions || [],
        access: role.access || "-",
        isSystem: Boolean(role.isSystem),
      })),
    );
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRoles();
  }, []);

  const addRole = async (event) => {
    event.preventDefault();
    if (!newRole.label.trim()) {
      showToast({ title: "Role required", message: "Enter a role name.", type: "error" });
      return;
    }

    setSaving(true);
    try {
      await createRole({
        label: newRole.label.trim(),
        sidebarAccess: newRole.sidebarAccess,
        permissions: newRole.permissions,
      });
      setNewRole({ label: "", sidebarAccess: [], permissions: [] });
      await loadRoles();
      showToast({ title: "Role added", message: "New role is available in registration dropdown." });
    } catch (error) {
      showToast({
        title: "Unable to add role",
        message: error?.response?.data?.message || error?.message || "Try again.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (row) => {
    setEditingKey(row.key);
    setEditForm({
      label: row.role === "-" ? "" : row.role,
      sidebarAccess: row.sidebarAccess || [],
      permissions: row.permissions || [],
    });
  };

  const cancelEdit = () => {
    setEditingKey("");
    setEditForm({ label: "", sidebarAccess: [], permissions: [] });
  };

  const saveEdit = async (row) => {
    if (!editForm.label.trim()) {
      showToast({ title: "Role required", message: "Enter a role name.", type: "error" });
      return;
    }

    setSaving(true);
    try {
      await updateRole(row.key, {
        label: editForm.label.trim(),
        sidebarAccess: editForm.sidebarAccess,
        permissions: editForm.permissions,
      });
      cancelEdit();
      await loadRoles();
      showToast({ title: "Role updated", message: "Role changes saved successfully." });
    } catch (error) {
      showToast({
        title: "Unable to update role",
        message: error?.response?.data?.message || error?.message || "Try again.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const removeRole = async () => {
    const row = deleteTarget;
    if (!row) return;

    setSaving(true);
    try {
      await deleteRole(row.key);
      if (editingKey === row.key) cancelEdit();
      setDeleteTarget(null);
      await loadRoles();
      showToast({ title: "Role deleted", message: "Role removed from the list." });
    } catch (error) {
      showToast({
        title: "Unable to delete role",
        message: error?.response?.data?.message || error?.message || "Try again.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSelection = (currentSelection, value) => {
    const selected = parseAccessLabels(currentSelection);
    return selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
  };

  const renderMultiDropdown = ({ id, value, options, placeholder, onChange, getValue = (option) => option.label, getLabel = (option) => option.label }) => {
    const selected = parseAccessLabels(value);
    const selectedLabels = selected.map((item) => options.find((option) => getValue(option) === item))
      .filter(Boolean)
      .map((option) => getLabel(option));
    const summary = selectedLabels.length ? formatAccessLabels(selectedLabels) : placeholder;

    return (
      <details className="role-access-dropdown">
        <summary id={id}>
          <span className="role-dropdown-summary-text">{summary}</span>
        </summary>
        <div className="role-access-menu" aria-labelledby={id}>
          {options.map((option) => {
            const optionValue = getValue(option);
            return (
            <label key={optionValue} className="role-access-option">
              <input
                type="checkbox"
                checked={selected.includes(optionValue)}
                onChange={() => onChange(updateSelection(value, optionValue))}
              />
              <span>{getLabel(option)}</span>
            </label>
          );
          })}
        </div>
      </details>
    );
  };

  return (
    <>
      <PageTitle
        eyebrow="Roles"
        title="Role-Based Access Control"
        description="Manage role visibility, access scope, and registration options from one place."
      />
      
      <KpiGrid 
        items={[
          { label: "Total Roles", value: roles.length },
          { label: "System Roles", value: roles.filter((role) => role.isSystem).length },
          { label: "Custom Roles", value: roles.filter((role) => !role.isSystem).length },
        ]} 
      />

      <section 
        className="form-section" 
        style={{ 
          background: "var(--bg-surface)", 
          border: "1px solid var(--border-color)", 
          borderRadius: "var(--radius-lg)", 
          padding: "20px", 
          marginBottom: "24px",
          boxShadow: "var(--shadow-sm)"
        }}
      >
        <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "600", color: "var(--text-main)" }}>Add New Role</h3>
        <form 
          onSubmit={addRole}
          style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr auto", 
            gap: "16px", 
            alignItems: "end" 
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="new-role-name" style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>Role Name</label>
            <input
              id="new-role-name"
              className="custom-input"
              style={{ height: "36px", padding: "0 12px", fontSize: "13px", boxSizing: "border-box" }}
              placeholder="e.g. HR Manager"
              value={newRole.label}
              onChange={(e) => setNewRole({ ...newRole, label: e.target.value })}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="new-role-access" style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>Visible / Primary Access</label>
            <input
              id="new-role-access"
              className="custom-input"
              style={{ height: "36px", padding: "0 12px", fontSize: "13px", boxSizing: "border-box" }}
              placeholder="Dashboard, Assets, Reports"
              value={newRole.access}
              onChange={(e) => setNewRole({ ...newRole, access: e.target.value })}
            />
          </div>
          <button 
            type="submit" 
            className="module-button" 
            style={{ height: "36px", padding: "0 20px", fontSize: "13px", fontWeight: "600", borderRadius: "var(--radius-md)" }}
            disabled={saving}
          >
            {saving ? "Adding..." : "Add Role"}
          </button>
        </form>
      </section>

      <DataTable
        columns={[
          { 
            key: "role", 
            label: "Role", 
            render: (row) => editingKey === row.key ? (
              <input 
                className="custom-input" 
                style={{ height: "30px", fontSize: "13px", padding: "0 8px", width: "100%", boxSizing: "border-box" }} 
                value={editForm.label} 
                onChange={(e) => setEditForm({ ...editForm, label: e.target.value })} 
              />
            ) : row.role 
          },
          { 
            key: "access", 
            label: "Visible / Primary Access", 
            render: (row) => editingKey === row.key ? (
              <input 
                className="custom-input" 
                style={{ height: "30px", fontSize: "13px", padding: "0 8px", width: "100%", boxSizing: "border-box" }} 
                value={editForm.access} 
                onChange={(e) => setEditForm({ ...editForm, access: e.target.value })} 
              />
            ) : row.access 
          },
          { 
            key: "type", 
            label: "Type", 
            render: (row) => row.isSystem ? (
              <span className="role-system-tag" style={{ background: "var(--bg-subtle)", color: "var(--text-muted)", padding: "4px 8px", borderRadius: "var(--radius-sm)", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>System</span>
            ) : (
              <span className="role-custom-tag" style={{ background: "rgba(14,165,164,0.1)", color: "var(--color-primary)", padding: "4px 8px", borderRadius: "var(--radius-sm)", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>Custom</span>
            ) 
          },
          { 
            key: "actions", 
            label: "Actions", 
            render: (row) => editingKey === row.key ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" className="module-button" style={{ padding: "0 12px", height: "28px", fontSize: "12px", borderRadius: "var(--radius-sm)" }} onClick={() => saveEdit(row)}>Save</button>
                <button type="button" className="module-button secondary-button" style={{ padding: "0 12px", height: "28px", fontSize: "12px", borderRadius: "var(--radius-sm)" }} onClick={cancelEdit}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" className="module-button" style={{ padding: "0 12px", height: "28px", fontSize: "12px", borderRadius: "var(--radius-sm)" }} onClick={() => startEdit(row)}>Edit</button>
                {!row.isSystem && (
                  <button 
                    type="button" 
                    className="module-button danger" 
                    style={{ padding: "0 12px", height: "28px", fontSize: "12px", background: "#FEF2F2", borderColor: "#FECACA", color: "#DC2626", borderRadius: "var(--radius-sm)" }} 
                    onClick={() => setDeleteTarget(row)}
                  >
                    Delete
                  </button>
                )}
              </div>
            ) 
          }
        ]}
        rows={roles}
      />

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        title="DELETE ROLE PERMANENTLY?"
        message={
          deleteTarget
            ? `If you delete "${deleteTarget.role}", it will be removed from registration and access lists. Do you want to delete it?`
            : ""
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={removeRole}
      />
    </>
  );
}

export function ScanDemo() {
  const { assetListData } = useModuleData();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const refreshForNetwork = async () => {
    const scanBaseUrl = getScanBaseUrl(getQrClientOrigin());
    setRefreshing(true);
    try {
      await dispatch(refreshQrCodes(scanBaseUrl)).unwrap();
      await dispatch(fetchAssetList());
      showToast({ title: "QR Codes Generated", message: "QR codes have been generated successfully." });
    } catch (error) {
      showToast({ title: "Generation failed", message: error || "Unable to generate QR codes.", type: "error" });
    } finally {
      setRefreshing(false);
    }
  };

  const filteredAssets = assetListData.filter(a => 
    (a.assetName || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (a.assetCode || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <PageTitle
        eyebrow="QR Management"
        title="QR Scanner Console"
      />

      <div className="action-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "12px", flex: 1 }}>
          <input 
            type="text" 
            placeholder="Search asset name or code..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: "300px" }}
          />
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button 
            type="button" 
            className="secondary-button" 
            onClick={() => window.print()}
            style={{ margin: 0 }}
          >
            Download QR PDF
          </button>
          <button 
            type="button" 
            className="module-button" 
            disabled={refreshing} 
            onClick={refreshForNetwork}
            style={{ margin: 0 }}
          >
            {refreshing ? "Generating..." : "Generate Bulk QR"}
          </button>
        </div>
      </div>
      
      <DataTable
        columns={[
          { key: "assetName", label: "Asset", render: (row) => <AssetLink asset={row} /> },
          { key: "assetCode", label: "Code" },
          { key: "serialNumber", label: "Serial" },
          {
            key: "qrCode",
            label: "QR Code",
            render: (row) => row.qrCode ? (
              <div className="qr-sticker-badge">
                <img src={row.qrCode} alt="QR" />
              </div>
            ) : "-"
          }
        ]}
        rows={filteredAssets}
      />
    </>
  );
}

function useModuleData() {
  const dispatch = useDispatch();
  const { assetListData, loading, error } = useSelector((state) => state.assetList);

  useEffect(() => {
    dispatch(fetchAssetList());
  }, [dispatch]);

  return { assetListData, loading, error };
}
