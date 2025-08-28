// App.tsx
import * as React from "react";
import HeaderBar from "./HeaderBar";
import SpListTab from "./SpListTab";
import { Tabs, Tab, Box, Button, Stack } from "@mui/material";
import { UserListConfig } from "../utils/dynamicConfig";
import ListConfigManager from "./ListConfigManager";
import { loadAllConfigs } from "../utils/configStorage";

export default function App() {
  const [tab, setTab] = React.useState(0);
  const [configs, setConfigs] = React.useState<UserListConfig[]>(() =>
    loadAllConfigs()
  );

  const [configOpen, setConfigOpen] = React.useState(false);
  const [refresh, setRefresh] = React.useState(false);
  // Save configs to localStorage
  const handleSaveConfigs = (newConfigs: UserListConfig[]) => {
    setConfigs(newConfigs);
    localStorage.setItem("listConfigs", JSON.stringify(newConfigs));
    setConfigOpen(false);
    setRefresh(true);
  };

  React.useEffect(() => {
    if (refresh) {
      setRefresh(false);
    }
  }, [refresh]);

  return (
    <div className="p-4 bg-white rounded-2xl shadow-lg">
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <HeaderBar />
        <Button
          size="small"
          variant="outlined"
          onClick={() => setConfigOpen(true)}
        >
          Manage Lists
        </Button>
      </Stack>

      {!refresh && (
        <>
          <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 2 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              {configs.map((cfg, i) => (
                <Tab key={cfg.tabName} label={cfg.tabName} value={i} />
              ))}
            </Tabs>
          </Box>

          {/* Tab content */}
          <div className="mt-4">
            {configs.map((cfg, i) =>
              tab === i ? (
                <SpListTab key={cfg.listTitle} config={cfg} tab={i} />
              ) : null
            )}
          </div>
        </>
      )}

      {/* Config Manager Dialog */}
      <ListConfigManager
        open={configOpen}
        configs={configs}
        onSave={handleSaveConfigs}
        onCancel={() => setConfigOpen(false)}
      />
    </div>
  );
}
