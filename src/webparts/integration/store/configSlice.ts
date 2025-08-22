import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AdoConfig {
  org: string;
  project: string;
  pat: string;
  defaultType: string;
  apiVersion: string;
  areaPath: string;
  iterationPath: string;
  defaultTags: string[];
}

export interface ConfigState {
  loopWorkspaceName: string;
  loopPageTitle: string;
  spListTitle: string;
  azdoProxyUrl: string;
  adoConfig: AdoConfig;
}

const initialState: ConfigState = {
  loopWorkspaceName: "Test WorkSpace",
  loopPageTitle: "MyLoop",
  spListTitle: "TasksList",
  azdoProxyUrl: "https://your-api.example.com/azdo/backlog",
  adoConfig: {
    org: "your-org-name",
    project: "your-project-name",
    pat: "your-pat-token",
    defaultType: "Product Backlog Item",
    apiVersion: "7.1-preview.3",
    areaPath: "your-project-name",
    iterationPath: "your-project-name\\Sprint 1",
    defaultTags: ["Loop", "Imported"],
  },
};

const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {
    updateConfig(state, action: PayloadAction<Partial<ConfigState>>) {
      return { ...state, ...action.payload };
    },
    updateAdoConfig(state, action: PayloadAction<Partial<AdoConfig>>) {
      state.adoConfig = { ...state.adoConfig, ...action.payload };
    },
  },
});

export const { updateConfig, updateAdoConfig } = configSlice.actions;
export default configSlice.reducer;
