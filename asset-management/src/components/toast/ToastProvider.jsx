import { useMemo } from "react";
import { Toaster } from "react-hot-toast";
import { ToastContext } from "./toastStore";
import { showToast } from "./toastApi.jsx";
import "./ToastProvider.css";

function ToastProvider({ children }) {
  const value = useMemo(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster
        position="top-right"
        gutter={10}
        containerStyle={{ top: 72 }}
        toastOptions={{
          duration: 4000,
          style: {
            maxWidth: 440,
            borderRadius: 8,
            fontSize: 14,
          },
        }}
      />
    </ToastContext.Provider>
  );
}

export default ToastProvider;
