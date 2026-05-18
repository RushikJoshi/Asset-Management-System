import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import AppLayout from "../components/layout/AppLayout";
import AssetDetails from "../components/AssetDetails";
import AddAsset from "../components/AddAsset";
import Assets from "../pages/Assets";
import { Login, Register } from "../pages/Auth";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import {
  Assignments,
  Audit,
  Employees,
  Inventory,
  Maintenance,
  Offices,
  Reports,
  Requests,
  Roles,
  ScanDemo,
  Warranty,
} from "../pages/WorkflowModules";
import { canAccessRoute, getRoleHome } from "../utils/permissions";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/requests" element={<Requests />} />
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
          <Route path="/scan-demo" element={<ScanDemo />} />
          <Route path="/add-asset" element={<AddAsset />} />
          <Route path="/edit-asset/:id" element={<AddAsset />} />
          <Route path="/add-request" element={<AddAsset />} />
          <Route path="/edit-request/:id" element={<AddAsset />} />
          <Route path="/asset-details/:id" element={<AssetDetails />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="/scan/:id" element={<AssetDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

function RequireAuth({ children }) {
  const location = useLocation();
  const { user, token } = useSelector((state) => state.auth);

  if (!user || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!canAccessRoute(user.role, location.pathname)) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  return children;
}

export default AppRouter;
