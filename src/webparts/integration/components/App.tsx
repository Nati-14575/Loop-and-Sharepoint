import * as React from "react";
import { Box, Tabs, Tab } from "@mui/material";
import HeaderBar from "./HeaderBar";
import LoopTab from "./LoopTab";
import SpListTab from "./SpListTab";

export default function App() {
  const [tab, setTab] = React.useState(0);

  return (
    <div className="p-4 bg-white rounded-2xl shadow-lg">
      <HeaderBar />
      <Box className="mt-4">
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
          <Tab label="Microsoft Loop" />
          <Tab label="SharePoint List" />
        </Tabs>
      </Box>

      <div className="mt-4">
        {tab === 0 && <LoopTab />}
        {tab === 1 && <SpListTab />}
      </div>
    </div>
  );
}
