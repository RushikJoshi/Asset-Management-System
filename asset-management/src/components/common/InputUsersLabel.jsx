
const InputUsersLabel = ({ inputUsersLabel, mandatory }) => {
  return (
    <div className="label-box">
      <label className="input-label">{inputUsersLabel}</label>

      {mandatory && <span className="required">*</span>}
    </div>
  );
};

export default InputUsersLabel;
