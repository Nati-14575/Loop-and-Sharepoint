import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BacklogRow } from "../types";

type UIState = {
  detailsOpen: boolean;
  selected?: BacklogRow | null;
  showDashboard: boolean;
};

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    detailsOpen: false,
    selected: null,
    showDashboard: false,
  } as UIState,
  reducers: {
    openDetails: (s, a: PayloadAction<BacklogRow>) => {
      s.detailsOpen = true;
      s.selected = a.payload;
    },
    closeDetails: (s) => {
      s.detailsOpen = false;
      s.selected = null;
    },
    toggleDashboard: (state) => {
      state.showDashboard = !state.showDashboard;
    },
    showDashboard: (state) => {
      state.showDashboard = true;
    },
    hideDashboard: (state) => {
      state.showDashboard = false;
    },
  },
});

export const {
  openDetails,
  closeDetails,
  toggleDashboard,
  showDashboard,
  hideDashboard,
} = uiSlice.actions;
export default uiSlice.reducer;
