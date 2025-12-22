// App.tsx
import * as React from "react";
import HeaderBar from "./HeaderBar";
import SpListTab from "./SpListTab";
import {
  Tabs,
  Tab,
  Box,
  Button,
  Stack,
  Card,
  CardContent,
  Typography,
  Divider,
  Fab,
  Drawer,
  IconButton,
} from "@mui/material";
import {
  Settings,
  FiberManualRecord,
  List,
  ViewList,
  Visibility,
  Close,
} from "@mui/icons-material";
import { UserListConfig } from "../utils/dynamicConfig";
import ListConfigManager from "./ListConfigManager";
import { SharePointService } from "../utils/SharePointService";
import { getSpfxCtx } from "../utils/spfxCtx";
import { useDispatch, useSelector } from "react-redux";
import { toggleDashboard } from "../store/uiSlice";
import { RootState } from "../store/store";
import DemandStats from "./DemandStats";
import Dashboard from "./Dashboard";
import { ITCapacityDashboard } from "./ITCapacity";
export default function App() {
  const [tab, setTab] = React.useState(0);
  const [configs, setConfigs] = React.useState<UserListConfig[]>(() => []);
  const spService = new SharePointService(getSpfxCtx());
  const context = getSpfxCtx();
  React.useEffect(() => {
    spService
      .loadUserConfig(
        context.pageContext.web.absoluteUrl,
        context.pageContext.user.loginName
      )
      .then(async (c) => {
        if (c) setConfigs(c);
        else {
          const cfgs = await spService.loadDefaultConfig(
            getSpfxCtx().pageContext.web.absoluteUrl
          );
          setConfigs(cfgs);
        }
      });
  }, []);

  const [configOpen, setConfigOpen] = React.useState(false);
  const [refresh, setRefresh] = React.useState(false);
  const [capacityDrawerOpen, setCapacityDrawerOpen] = React.useState(false);
  const dispatch = useDispatch();
  const showDashboard = useSelector(
    (state: RootState) => state.ui.showDashboard
  );
  const handleSaveConfigs = async (newConfigs: UserListConfig[]) => {
    setConfigs(newConfigs);
    setConfigOpen(false);
    setRefresh(true);

    try {
      const username = context.pageContext.user.loginName;

      await spService.saveUserConfig(
        newConfigs[0].siteUrl, // assume all configs share same siteUrl
        username,
        newConfigs
      );

      console.log(`✅ Config saved for user ${username}`);
    } catch (err) {
      console.error("❌ Failed to save config to SharePoint", err);
    }
  };

  React.useEffect(() => {
    if (refresh) {
      setRefresh(false);
    }
  }, [refresh]);

  return (
    <div className="p-6 bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl border border-gray-100">
      {/* Header Section */}
      <Card
        variant="outlined"
        sx={{
          mb: 3,
          borderRadius: 3,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        }}
      >
        <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <HeaderBar />
            <Button
              size="small"
              variant="contained"
              onClick={() => dispatch(toggleDashboard())}
              startIcon={<Settings />}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                bgcolor: "rgba(255,255,255,0.2)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.3)",
                px: 2,
                py: 1,
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.3)",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              Show Dashboard
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => setConfigOpen(true)}
              startIcon={<Settings />}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                bgcolor: "rgba(255,255,255,0.2)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.3)",
                px: 2,
                py: 1,
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.3)",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              Manage Lists
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {!refresh && (
        <>
          {/* Tabs Section */}
          <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 0 }}>
              <Box
                sx={{
                  borderBottom: 1,
                  borderColor: "divider",
                  background: "linear-gradient(to right, #f8f9fa, #ffffff)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Tabs
                  value={tab}
                  onChange={(_, v) => setTab(v)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    minHeight: 56,
                    flex: 1,
                    "& .MuiTab-root": {
                      textTransform: "none",
                      fontWeight: 500,
                      fontSize: "0.95rem",
                      minHeight: 56,
                      color: "text.secondary",
                      "&.Mui-selected": {
                        color: "primary.main",
                        fontWeight: 600,
                      },
                    },
                    "& .MuiTabs-indicator": {
                      height: 3,
                      borderRadius: 2,
                    },
                  }}
                >
                  {configs.map((cfg, i) => (
                    <Tab
                      key={cfg.tabName}
                      label={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <span>{cfg.tabName}</span>
                          {i === tab && (
                            <FiberManualRecord sx={{ fontSize: 8 }} />
                          )}
                        </Stack>
                      }
                      value={i}
                    />
                  ))}
                </Tabs>
                <IconButton
                  size="small"
                  onClick={() => setCapacityDrawerOpen(true)}
                  sx={{ mr: 1 }}
                  aria-label="View IT Capacity"
                >
                  <Visibility fontSize="small" />
                </IconButton>
              </Box>

              <Box sx={{ p: 3 }}>
                {configs.map((cfg, i) =>
                  tab === i ? (
                    <SpListTab key={cfg.listTitle} config={cfg} tab={i} />
                  ) : null
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Quick Stats Bar */}
          <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 2 }}>
              <Stack
                direction="row"
                spacing={3}
                alignItems="center"
                sx={{ flexWrap: "wrap", rowGap: 1 }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <List sx={{ color: "primary.main", fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    {configs.length} list{configs.length !== 1 ? "s" : ""}{" "}
                    configured
                  </Typography>
                </Box>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ display: { xs: "none", sm: "block" } }}
                />
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ViewList sx={{ color: "secondary.main", fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    Active: {configs[tab]?.tabName}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </>
      )}
      {showDashboard && (
        <Box mt={3}>
          <DemandStats
            spService={spService}
            siteUrl={configs[0].siteUrl ?? ""}
          />
        </Box>
      )}
      {/* Config Manager Dialog */}
      <ListConfigManager
        open={configOpen}
        configs={configs}
        onSave={handleSaveConfigs}
        onCancel={() => setConfigOpen(false)}
      />

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        aria-label="manage lists"
        onClick={() => setConfigOpen(true)}
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          display: { xs: "flex", md: "none" },
          borderRadius: 3,
          boxShadow: "0 8px 25px rgba(102, 126, 234, 0.3)",
          "&:hover": {
            boxShadow: "0 12px 35px rgba(102, 126, 234, 0.4)",
            transform: "translateY(-2px)",
          },
        }}
      >
        <Settings />
      </Fab>
      <Dashboard />

      {/* IT Capacity Drawer */}
      <Drawer
        anchor="right"
        open={capacityDrawerOpen}
        onClose={() => setCapacityDrawerOpen(false)}
        PaperProps={{
          sx: { width: { xs: "90%", sm: "80%", md: 900 }, p: 0 },
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              IT Capacity Details
            </Typography>
            <IconButton
              onClick={() => setCapacityDrawerOpen(false)}
              aria-label="Close drawer"
            >
              <Close />
            </IconButton>
          </Box>
        </Box>
        <Box sx={{ p: 2, overflow: "auto", height: "calc(100vh - 64px)" }}>
          <ITCapacityDashboard
            siteUrl={configs[tab]?.siteUrl || configs[0]?.siteUrl}
            embedded={true}
          />
        </Box>
      </Drawer>
    </div>
  );
}
