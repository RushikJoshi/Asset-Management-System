const InputUsersError = ({ errors, inputname, manualError }) => {
  const errorMessage = errors?.[inputname]?.message;

  return errorMessage || manualError ? (
    <p className="error">{manualError || String(errorMessage)}</p>
  ) : null;
};

export default InputUsersError;
