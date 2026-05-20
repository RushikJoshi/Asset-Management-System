import { Navigate } from "react-router-dom";

/** Old URL — redirects to Asset Form under Masters. */
function MasterEditor() {
  return <Navigate to="/masters/asset-form" replace />;
}

export default MasterEditor;
