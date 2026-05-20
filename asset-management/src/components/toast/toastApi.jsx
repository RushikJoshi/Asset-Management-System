import toast from "react-hot-toast";

// eslint-disable-next-line react-refresh/only-export-components
function ToastBody({ title, message }) {
  return (
    <div className="app-hot-toast-body">
      <strong className="app-hot-toast-title">{title}</strong>
      {message ? <p className="app-hot-toast-message">{message}</p> : null}
    </div>
  );
}

/**
 * App-wide toast. Uses react-hot-toast. All copy should be English.
 * @param {{ title: string, message?: string, type?: "success"|"error"|"info", duration?: number }} opts
 */
export function showToast({ title, message = "", type = "success", duration = 4000 }) {
  const content = <ToastBody title={title || ""} message={message} />;
  const opts = { duration };

  if (type === "error") {
    toast.error(content, opts);
    return;
  }

  if (type === "info") {
    toast(content, {
      ...opts,
      style: {
        background: "#1e293b",
        color: "#f8fafc",
      },
      iconTheme: {
        primary: "#38bdf8",
        secondary: "#0f172a",
      },
    });
    return;
  }

  toast.success(content, opts);
}
