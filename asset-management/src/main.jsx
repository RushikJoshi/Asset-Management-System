import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

import { store, persistor } from "./store/store";
import AppRouter from "./routes/AppRouter.jsx";
import ToastProvider from "./components/toast/ToastProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </PersistGate>
    </Provider>
  </StrictMode>,
);
