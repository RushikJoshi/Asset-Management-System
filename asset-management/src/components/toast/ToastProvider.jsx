import { useMemo, useState, useRef, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { ToastContext } from "./toastStore";
import { showToast } from "./toastApi.jsx";
import "./ToastProvider.css";

function ToastProvider({ children }) {
  const value = useMemo(() => ({ showToast }), []);
  const [activeNotifications, setActiveNotifications] = useState(0);
  const notificationCountRef = useRef(0);

  useEffect(() => {
    // Monitor toast lifecycle
    const originalShow = showToast;
    
    // Intercept and track notifications
    window.__toastNotificationCount = (count) => {
      notificationCountRef.current = count;
      setActiveNotifications(count);
    };

    return () => {
      delete window.__toastNotificationCount;
    };
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-wrapper" style={{ position: "relative" }}>
        {activeNotifications > 0 && (
          <div className="notification-toast-badge">
            {activeNotifications > 99 ? "99+" : activeNotifications}
          </div>
        )}
        <Toaster
          position="top-right"
          gutter={12}
          containerStyle={{ top: 80, right: 20 }}
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: 8,
              fontSize: 14,
            },
          }}
        />
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
