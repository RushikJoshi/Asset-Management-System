import toast from "react-hot-toast";

let activeToastCount = 0;

// eslint-disable-next-line react-refresh/only-export-components
function ToastBody({ title, message }) {
  return (
    <div className="app-hot-toast-body">
      <strong className="app-hot-toast-title">{title}</strong>
      {message ? <p className="app-hot-toast-message">{message}</p> : null}
    </div>
  );
}

function updateNotificationBadge() {
  if (window.__toastNotificationCount) {
    window.__toastNotificationCount(activeToastCount);
  }
}

/**
 * App-wide toast. Uses react-hot-toast. All copy should be English.
 * @param {{ title: string, message?: string, type?: "success"|"error"|"info", duration?: number }} opts
 */
export function showToast({ title, message = "", type = "success", duration = 4000 }) {
  const content = <ToastBody title={title || ""} message={message} />;
  activeToastCount++;
  updateNotificationBadge();

  const opts = {
    duration,
    onClose: () => {
      activeToastCount = Math.max(0, activeToastCount - 1);
      updateNotificationBadge();
    },
  };

  if (type === "error") {
    toast.custom(
      (t) => (
        <div className={`app-hot-toast-wrapper error ${t.visible ? "visible" : ""}`}>
          {content}
        </div>
      ),
      opts
    );
    return;
  }

  if (type === "info") {
    toast.custom(
      (t) => (
        <div className={`app-hot-toast-wrapper info ${t.visible ? "visible" : ""}`}>
          {content}
        </div>
      ),
      opts
    );
    return;
  }

  toast.custom(
    (t) => (
      <div className={`app-hot-toast-wrapper success ${t.visible ? "visible" : ""}`}>
        {content}
      </div>
    ),
    opts
  );
}
