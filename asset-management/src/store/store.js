// import { configureStore, combineReducers } from "@reduxjs/toolkit";
// import { persistReducer, persistStore } from "redux-persist";
// import storage from "redux-persist/lib/storage";
// import assetListReducer from "./slices/assetSlice";

// const rootReducer = combineReducers({
//   assetList: assetListReducer,
// });

// const persistConfig = {
//   key: "root",
//   storage,
//   whitelist: ["assetList"],
// };

// const persistedReducer = persistReducer(persistConfig, rootReducer);

// // Store
// export const store = configureStore({
//   reducer: persistedReducer,
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware({
//       serializableCheck: false,
//     }),
// });

// export const persistor = persistStore(store);

import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";

import { setLogoutHandler } from "../apis/apiConfig";
import assetListReducer from "./slices/assetSlice";
import authReducer, { logout } from "./slices/authSlice";

const storage = {
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),

  setItem: (key, value) => {
    localStorage.setItem(key, value);
    return Promise.resolve();
  },

  removeItem: (key) => {
    localStorage.removeItem(key);
    return Promise.resolve();
  },
};

const removePersistedAuth = () => {
  try {
    const persistedRoot = JSON.parse(localStorage.getItem("persist:root") || "{}");

    if (persistedRoot.auth) {
      delete persistedRoot.auth;
      localStorage.setItem("persist:root", JSON.stringify(persistedRoot));
    }
  } catch {
    localStorage.removeItem("persist:root");
  }
};

removePersistedAuth();

const rootReducer = combineReducers({
  assetList: assetListReducer,
  auth: authReducer,
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["assetList"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

setLogoutHandler(() => {
  store.dispatch(logout());
});
