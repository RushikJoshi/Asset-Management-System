import { useEffect } from "react";
import { FORM_TYPES } from "../../utils/assetFormBuilder";
import FormBuilderView from "./components/FormBuilderView";
import { useFormBuilder } from "./useFormBuilder";
import { useTopbarActions } from "../../components/layout/topbarActionsContext";
import "../MasterEditor.css";

function AssetFormMaster() {
  const builder = useFormBuilder(FORM_TYPES.ASSET);
  const { setActions } = useTopbarActions();

  useEffect(() => {
    setActions({ onReset: builder.resetDefaults, onSave: builder.saveChanges });
    return () => setActions(null);
  }, [builder.resetDefaults, builder.saveChanges, setActions]);

  return (
    <div className="master-editor-page">
      <FormBuilderView builder={builder} />
    </div>
  );
}

export default AssetFormMaster;
