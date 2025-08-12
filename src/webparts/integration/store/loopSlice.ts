import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { BacklogRow } from "../types";
import { LoopService } from "../utils/LoopService";
import { BacklogService } from "../utils/BacklogService";
import { getSpfxCtx } from "../utils/spfxCtx";

export const fetchLoopItems = createAsyncThunk<
  BacklogRow[],
  void,
  { extra: { ctx: any } }
>("loop/fetch", async () => {
  const svc = new LoopService(getSpfxCtx());
  return await svc.getItems();
});

export const addLoopItemToBacklog = createAsyncThunk<
  { id: string },
  BacklogRow,
  { extra: { ctx: any } }
>("loop/addToBacklog", async (row, { extra }) => {
  const svc = new BacklogService(extra.ctx);
  await svc.createWorkItem(row);
  return { id: row.id };
});

const loopSlice = createSlice({
  name: "loop",
  initialState: {
    items: [] as BacklogRow[],
    loading: false,
    error: "" as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLoopItems.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchLoopItems.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload;
      })
      .addCase(fetchLoopItems.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message || "Failed to load Loop items";
      })
      .addCase(addLoopItemToBacklog.fulfilled, () => {});
  },
});

export default loopSlice.reducer;
