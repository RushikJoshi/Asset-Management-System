import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import AppLayout from "../components/layout/AppLayout";
import AssetDetails from "../components/AssetDetails";
import AddAsset from "../components/AddAsset";
import Assets from "../pages/Assets";
import { Login, Register } from "../pages/Auth";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import MasterEditor from "../pages/MasterEditor";
import AssetFormMaster from "../pages/masters/AssetFormMaster";
import RequestFormMaster from "../pages/masters/RequestFormMaster";
import ProcurementFormMaster from "../pages/masters/ProcurementFormMaster";
import CategoryMaster from "../pages/masters/CategoryMaster";
import {
  Assignments,
  Audit,
  Employees,
  Inventory,
  Maintenance,
  Offices,
  Reports,
  Roles,
  ScanDemo,
  Warranty,
} from "../pages/WorkflowModules";
import { Requests } from "../pages/RequestsPage";
import Procurements from "../pages/Procurements";
import POSummary from "../pages/POSummary";
import ApprovalsPage from "../pages/ApprovalsPage";
import WorkOrdersPage from "../pages/WorkOrdersPage";
import UsersPage from "../pages/setup/UsersPage";
import VendorsPage from "../pages/setup/VendorsPage";
import ProductsPage from "../pages/setup/ProductsPage";
import PreferencesPage from "../pages/setup/PreferencesPage";
import AddRequestPage from "../pages/AddRequestPage";
import { canAccessRoute, getRoleHome } from "../utils/permissions";
import { fetchRoles } from "../utils/roleApi";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/work-orders" element={<WorkOrdersPage />} />
          <Route path="/procurements" element={<Procurements />} />
          <Route path="/procurements/:id" element={<POSummary />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/warranty" element={<Warranty />} />
          <Route path="/offices" element={<Offices />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/master-editor" element={<MasterEditor />} />
          <Route path="/masters/asset-form" element={<AssetFormMaster />} />
          <Route path="/masters/request-form" element={<RequestFormMaster />} />
          <Route path="/masters/procurement-form" element={<ProcurementFormMaster />} />
          <Route path="/masters/categories" element={<CategoryMaster />} />
          <Route path="/scan-demo" element={<ScanDemo />} />
          <Route path="/add-asset" element={<AddAsset />} />
          <Route path="/edit-asset/:id" element={<AddAsset />} />
           <Route path="/add-request" element={<AddRequestPage />} />
          <Route path="/edit-request/:id" element={<AddRequestPage />} />
          <Route path="/asset-details/:id" element={<AssetDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/setup/users" element={<UsersPage />} />
          <Route path="/setup/vendors" element={<VendorsPage />} />
          <Route path="/setup/products" element={<ProductsPage />} />
          <Route path="/setup/preferences" element={<PreferencesPage />} />
          <Route path="/scan/:id" element={<AssetDetails />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function RequireAuth() {
  const location = useLocation();
  const { user, token } = useSelector((state) => state.auth);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    let active = true;
    if (!token) return undefined;

    fetchRoles()
      .then((data) => {
        if (active) setRoles(data);
      })
      .catch(() => {
        if (active) setRoles([]);
      });

    return () => {
      active = false;
    };
  }, [token]);

  if (!user || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = roles.find((item) => item.key === user.role);
  const roleAccess = role?.sidebarAccess?.length ? role.sidebarAccess : role?.access || "";

  if (!canAccessRoute(user.role, location.pathname, roleAccess, role?.permissions || [])) {
    return <Navigate to={getRoleHome(user.role, roleAccess)} replace />;
  }

  return <Outlet />;
}

export default AppRouter;
