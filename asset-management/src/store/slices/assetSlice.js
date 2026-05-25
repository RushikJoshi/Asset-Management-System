import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiInstance from "../../apis/apiConfig";

const initialState = {
  assetListData: [],
  loading: false,
  error: "",
  singleAssetData: {},
};

export const fetchAssetList = createAsyncThunk(
  "asset/fetchAssetList",
  async (_, thunkAPI) => {
    try {
      const response = await apiInstance.get("/assets");

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch assets",
      );
    }
  },
);

// ADD ASSET API
export const addAsset = createAsyncThunk(
  "asset/addAsset",
  async (payload, thunkAPI) => {
    try {
      const response = await apiInstance.post("/asset/create", payload);

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.response?.data?.error || "Something went wrong",
      );
    }
  },
);

export const fetchSingleAsset = createAsyncThunk(
  "asset/fetchSingleAsset",
  async (id, thunkAPI) => {
    try {
      const response = await apiInstance.get(`/asset/${id}`);

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch asset",
      );
    }
  },
);

export const fetchScannedAsset = createAsyncThunk(
  "asset/fetchScannedAsset",
  async ({ id, token }, thunkAPI) => {
    try {
      const response = await apiInstance.get(`/scan/${id}?t=${token}`);

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch scanned asset",
      );
    }
  },
);

export const updateAsset = createAsyncThunk(
  "asset/updateAsset",
  async ({ id, payload }, thunkAPI) => {
    try {
      const response = await apiInstance.put(`/asset/update/${id}`, payload);

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.response?.data?.error || "Failed to update asset",
      );
    }
  },
);

export const deleteAsset = createAsyncThunk(
  "asset/deleteAsset",
  async (id, thunkAPI) => {
    try {
      const response = await apiInstance.delete(`/asset/delete/${id}`);

      return {
        id,
        ...response.data,
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to delete asset",
      );
    }
  },
);

export const refreshQrCodes = createAsyncThunk(
  "asset/refreshQrCodes",
  async (scannerOrigin, thunkAPI) => {
    try {
      const headers = scannerOrigin
        ? { "x-scanner-origin": scannerOrigin, "x-client-origin": scannerOrigin }
        : undefined;
      const response = await apiInstance.post(
        "/qr/refresh",
        {},
        { headers, timeout: 120000 },
      );

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message
          || error.response?.data?.error
          || error.message
          || "Failed to refresh QR codes",
      );
    }
  },
);

export const seedWarrantyMaintenanceDemo = createAsyncThunk(
  "asset/seedWarrantyMaintenanceDemo",
  async (_, thunkAPI) => {
    try {
      const response = await apiInstance.post("/demo/warranty-maintenance");

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to load demo warranty and maintenance data",
      );
    }
  },
);

const assetListSlice = createSlice({
  name: "assetList",
  initialState,
  reducers: {
    setAssetListData: (state, action) => {
      state.assetListData = action.payload.assetListData;
    },
  },
  extraReducers: (builder) => {
    //fetch data
    builder
      .addCase(fetchAssetList.pending, (state) => {
        state.loading = true;
        state.error = "";
      })

      .addCase(fetchAssetList.fulfilled, (state, action) => {
        state.loading = false;

        state.assetListData = action.payload.assets || [];
      })

      .addCase(fetchAssetList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      //fetch single
      .addCase(fetchSingleAsset.pending, (state) => {
        state.loading = true;
        state.error = "";
      })

      .addCase(fetchSingleAsset.fulfilled, (state, action) => {
        state.loading = false;

        state.singleAssetData = action.payload;
      })

      .addCase(fetchSingleAsset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchScannedAsset.pending, (state) => {
        state.loading = true;
        state.error = "";
      })

      .addCase(fetchScannedAsset.fulfilled, (state, action) => {
        state.loading = false;
        state.singleAssetData = action.payload;
      })

      .addCase(fetchScannedAsset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // add data
      .addCase(addAsset.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(addAsset.fulfilled, (state, action) => {
        state.loading = false;
        state.assetListData.push(action.payload.asset);
      })
      .addCase(addAsset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateAsset.pending, (state) => {
        state.loading = true;
        state.error = "";
      })

      .addCase(updateAsset.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload?.asset ?? action.payload;
        if (!updated?._id) return;
        state.singleAssetData = updated;
        state.assetListData = state.assetListData.map((item) =>
          String(item._id) === String(updated._id) ? updated : item,
        );
      })

      .addCase(updateAsset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // delete asset
      .addCase(deleteAsset.pending, (state) => {
        state.loading = true;
        state.error = "";
      })

      .addCase(deleteAsset.fulfilled, (state, action) => {
        state.loading = false;

        state.assetListData = state.assetListData.filter(
          (item) => item._id !== action.payload.id,
        );
      })

      .addCase(deleteAsset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(refreshQrCodes.pending, (state) => {
        state.loading = true;
        state.error = "";
      })

      .addCase(refreshQrCodes.fulfilled, (state) => {
        state.loading = false;
      })

      .addCase(refreshQrCodes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(seedWarrantyMaintenanceDemo.pending, (state) => {
        state.loading = true;
        state.error = "";
      })

      .addCase(seedWarrantyMaintenanceDemo.fulfilled, (state, action) => {
        state.loading = false;
        const incomingAssets = action.payload.assets || [];

        incomingAssets.forEach((asset) => {
          const existingIndex = state.assetListData.findIndex((item) => item._id === asset._id);

          if (existingIndex >= 0) {
            state.assetListData[existingIndex] = asset;
          } else {
            state.assetListData.unshift(asset);
          }
        });
      })

      .addCase(seedWarrantyMaintenanceDemo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setAssetListData } = assetListSlice.actions;
export default assetListSlice.reducer;