import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import Cookies from "js-cookie";
import apiInstance from "../../apis/apiConfig";

const storedUser = (() => {
  try {
    const token = Cookies.get("token");
    return token ? JSON.parse(localStorage.getItem("authUser") || "null") : null;
  } catch {
    return null;
  }
})();

const initialState = {
  user: storedUser,
  token: Cookies.get("token") || "",
  loading: false,
  error: "",
};

const saveSession = ({ token, user }) => {
  Cookies.set("token", token, { expires: 1 });
  localStorage.setItem("authUser", JSON.stringify(user));
};

const clearSession = () => {
  Cookies.remove("token");
  localStorage.removeItem("authUser");
};

export const loginUser = createAsyncThunk("auth/login", async (payload, thunkAPI) => {
  try {
    const response = await apiInstance.post("/auth/login", payload);
    saveSession(response.data);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Login failed");
  }
});

export const registerUser = createAsyncThunk("auth/register", async (payload, thunkAPI) => {
  try {
    const response = await apiInstance.post("/auth/register", payload);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Registration failed");
  }
});

export const fetchCurrentUser = createAsyncThunk("auth/me", async (_, thunkAPI) => {
  try {
    const response = await apiInstance.get("/auth/me");
    localStorage.setItem("authUser", JSON.stringify(response.data.user));
    return response.data.user;
  } catch (error) {
    clearSession();
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Session expired");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = "";
      state.error = "";
      clearSession();
    },
    updateUserSession: (state, action) => {
      state.user = action.payload;
      localStorage.setItem("authUser", JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = "";
        state.error = "";
        state.registrationMessage = action.payload.message || "Registration completed. Please login.";
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.user = null;
        state.token = "";
        state.error = action.payload;
      });
  },
});

export const { logout, updateUserSession } = authSlice.actions;
export default authSlice.reducer;
