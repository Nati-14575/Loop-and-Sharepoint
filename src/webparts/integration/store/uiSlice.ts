import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BacklogRow } from "../types";

type UIState = {
  detailsOpen: boolean;
  selected?: BacklogRow | null;
};

const uiSlice = createSlice({
  name: "ui",
  initialState: { detailsOpen: false, selected: null } as UIState,
  reducers: {
    openDetails: (s, a: PayloadAction<BacklogRow>) => {
      s.detailsOpen = true;
      s.selected = a.payload;
    },
    closeDetails: (s) => {
      s.detailsOpen = false;
      s.selected = null;
    },
  },
});

export const { openDetails, closeDetails } = uiSlice.actions;
export default uiSlice.reducer;
