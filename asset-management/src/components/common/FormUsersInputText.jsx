import InputUsersLabel from "./InputUsersLabel";
import InputUsersError from "./InputUsersError";

const FormUsersInputText = ({
  inputLabel,
  inputname,
  inputPlaceholder,
  register,
  errors,
  manualError,
  isDisabled = false,
  mandatory = false,
  inputType = "text",
  inputMode,
  maxLength,
}) => {
  return (
    <div className="input-wrapper">
      {inputLabel && (
        <InputUsersLabel inputUsersLabel={inputLabel} mandatory={mandatory} />
      )}

      <input
        disabled={isDisabled}
        type={inputType}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={inputPlaceholder || `Enter ${inputLabel}`}
        {...register(inputname)}
        className={`custom-input ${
          errors[inputname] || manualError ? "input-error-border" : ""
        }`}
      />

      <InputUsersError
        errors={errors}
        manualError={manualError}
        inputname={inputname}
      />
    </div>
  );
};

export default FormUsersInputText;
