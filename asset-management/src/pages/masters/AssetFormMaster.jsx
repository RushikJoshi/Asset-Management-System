import { FORM_TYPES } from "../../utils/assetFormBuilder";
import MasterPageHeader from "./components/MasterPageHeader";
import FormBuilderView from "./components/FormBuilderView";
import { useFormBuilder } from "./useFormBuilder";
import "../MasterEditor.css";

function AssetFormMaster() {
  const builder = useFormBuilder(FORM_TYPES.ASSET);

  return (
    <div className="master-editor-page">
      <MasterPageHeader
        kicker="Masters"
        title="Asset Form"
        subtitle={`${builder.visibleFields} of ${builder.totalFields} fields visible in Add Asset form`}
        onReset={builder.resetDefaults}
        onSave={builder.saveChanges}
      />
      <FormBuilderView builder={builder} />
    </div>
  );
}

export default AssetFormMaster;
