import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { BacklogRow } from "../types";
import { SharePointService } from "../utils/SharePointService";
import { BacklogService } from "../utils/BacklogService";
import { getSpfxCtx } from "../utils/spfxCtx";

export const fetchSpItems = createAsyncThunk<BacklogRow[]>(
  "sp/fetch",
  async () => {
    const svc = new SharePointService(getSpfxCtx());
    return svc.getItems();
  }
);

export const addSpItemToBacklog = createAsyncThunk<
  { id: string },
  BacklogRow,
  { extra: { ctx: any } }
>("loop/addToBacklog", async (row, { extra }) => {
  const svc = new BacklogService();

  await svc.createWorkItem({
    sourceRow: row,
    title: row.title,
    description: row.description || "",
    assigneeEmail: "",
    acceptanceCriteriaField: "",
  });

  return { id: row.id };
});
const spSlice = createSlice({
  name: "sp",
  initialState: {
    items: [] as BacklogRow[],
    loading: false,
    error: "" as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSpItems.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchSpItems.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload;
      })
      .addCase(fetchSpItems.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message || "Failed to load SharePoint items";
      })
      .addCase(addSpItemToBacklog.fulfilled, () => {});
  },
});

export default spSlice.reducer;
