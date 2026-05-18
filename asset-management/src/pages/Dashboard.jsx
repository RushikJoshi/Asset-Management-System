import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchAssetList } from "../store/slices/assetSlice";
import {
  DataTable,
  KpiGrid,
  MiniBars,
  PageTitle,
} from "../components/common/ModuleComponents";
import { buildStats, currency, groupByCount } from "../utils/assetUtils";
import { ROUTE_ROLES } from "../utils/permissions";

function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { assetListData } = useSelector((state) => state.assetList);
  const stats = buildStats(assetListData);

  useEffect(() => {
    dispatch(fetchAssetList());
  }, [dispatch]);

  const recent = assetListData
    .flatMap((asset) =>
      (asset.lifecycleTimeline || []).map((event) => ({
        ...event,
        assetName: asset.assetName,
        assetCode: asset.assetCode,
      })),
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  return (
    <>
      <PageTitle
        eyebrow="Dashboard"
        title="Asset Operations Overview"
        description="Live inventory, assignment, warranty, repair, audit, and lifecycle health."
        action={
          ROUTE_ROLES["/add-asset"]?.includes(user?.role) && (
            <button
              onClick={() => navigate("/add-asset")}
              className="primary-action"
            >
              + Add Asset
            </button>
          )
        }
      />
      <KpiGrid
        items={[
          { label: "Total Assets", value: stats.total },
          { label: "Available", value: stats.available },
          { label: "Assigned", value: stats.assigned },
          { label: "Under Repair", value: stats.repair },
          { label: "Warranty Alerts", value: stats.warranty },
          { label: "Audit Pending", value: stats.auditPending },
          { label: "Repair Spend", value: currency(stats.repairCost) },
        ]}
      />
      <div className="chart-grid">
        <MiniBars title="Assets By Status" data={groupByCount(assetListData, "assetStatus")} />
        <MiniBars title="Assets By Office" data={groupByCount(assetListData, "officeName")} />
        <MiniBars title="Assets By Category" data={groupByCount(assetListData, "category")} />
      </div>
      <DataTable
        columns={[
          { key: "date", label: "Date", render: (row) => new Date(row.date).toLocaleDateString("en-IN") },
          { key: "assetName", label: "Asset" },
          { key: "title", label: "Activity" },
          { key: "detail", label: "Details" },
        ]}
        rows={recent}
        emptyText="No lifecycle activity yet"
      />
    </>
  );
}

export default Dashboard;
