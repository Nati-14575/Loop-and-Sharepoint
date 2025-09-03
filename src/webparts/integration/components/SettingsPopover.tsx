// SettingsPopover.tsx
import * as React from "react";
import {
  Popover,
  Stack,
  Typography,
  Divider,
  TextField,
  MenuItem,
  Button,
  Checkbox,
  FormGroup,
  FormControlLabel,
  IconButton,
  CircularProgress,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

import type { UserListConfig } from "../utils/dynamicConfig";

type Props = {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  config: UserListConfig;
  onSave: () => void;
  state: {
    titleColumnKey: string;
    setTitleColumnKey: React.Dispatch<React.SetStateAction<string>>;
    descCols: string[];
    setDescCols: React.Dispatch<React.SetStateAction<string[]>>;
    acCols: string[];
    setAcCols: React.Dispatch<React.SetStateAction<string[]>>;
    selectedProject: string;
    setSelectedProject: React.Dispatch<React.SetStateAction<string>>;
    featureColumnKey: string;
    setFeatureColumnKey: React.Dispatch<React.SetStateAction<string>>;
    featureDelimiter: string;
    setFeatureDelimiter: React.Dispatch<React.SetStateAction<string>>;
    selectedAzureFeatures: string[];
    setSelectedAzureFeatures: React.Dispatch<React.SetStateAction<string[]>>;
    setBusinessPocCol: React.Dispatch<React.SetStateAction<string>>;
    businessPocCol: string;
    // Azure stuff
    projects?: { name: string }[];
    projLoading?: boolean;
    projErr?: string | null;
    refreshProjects?: () => void;

    azureFeatures?: string[];
    azureLoading?: boolean;
    azureErr?: string | null;
    refreshFeatures?: () => void;
    teams?: { name: string }[];
    teamLoading?: boolean;
    teamErr?: string | null;
    selectedTeam: string;
    setSelectedTeam: React.Dispatch<React.SetStateAction<string>>;
    refreshTeams?: () => void;
  };
};

export function SettingsPopover({
  anchorEl,
  onClose,
  config,
  state,
  onSave,
}: Props) {
  const open = Boolean(anchorEl);

  const toggleArray = (arr: string[], key: string) =>
    arr.indexOf(key) !== -1 ? arr.filter((k) => k !== key) : [...arr, key];

  const setAll = (setter: (keys: string[]) => void, on: boolean) =>
    setter(on ? config.systemColumns?.map((c) => c.key) : []);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
    >
      <Stack spacing={2} sx={{ p: 2, width: 560, maxWidth: "100%" }}>
        {/* Title Config */}
        <Stack spacing={1}>
          <Typography variant="subtitle2">Title</Typography>

          <TextField
            select
            fullWidth
            size="small"
            label="Title column"
            value={state.titleColumnKey}
            onChange={(e) => state.setTitleColumnKey(e.target.value)}
          >
            <MenuItem value="">(none)</MenuItem>
            {config.systemColumns?.map((c) => (
              <MenuItem key={c.key} value={c.key}>
                {c.displayName}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Divider />

        {/* Description Fields */}
        <Stack spacing={1}>
          <Typography variant="subtitle2">Description fields</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              onClick={() => setAll(state.setDescCols, true)}
            >
              Select All
            </Button>
            <Button
              size="small"
              onClick={() => setAll(state.setDescCols, false)}
            >
              Clear
            </Button>
          </Stack>
          <FormGroup>
            {config.systemColumns?.map((c) => (
              <FormControlLabel
                key={c.key}
                control={
                  <Checkbox
                    size="small"
                    checked={state.descCols.indexOf(c.key) !== -1}
                    onChange={() => {
                      state.setDescCols(toggleArray(state.descCols, c.key));
                    }}
                  />
                }
                label={c.displayName}
              />
            ))}
          </FormGroup>
        </Stack>

        <Divider />

        {/* Business POC Field */}
        <Stack spacing={1}>
          <Typography variant="subtitle2">Business POC</Typography>
          <FormGroup>
            {config.systemColumns?.map((c) => (
              <FormControlLabel
                key={c.key}
                control={
                  <Checkbox
                    size="small"
                    checked={state.businessPocCol === c.key} // ✅ single selection
                    onChange={
                      () => state.setBusinessPocCol(c.key) // ✅ just set one value
                    }
                  />
                }
                label={c.displayName}
              />
            ))}
          </FormGroup>
        </Stack>

        <Divider />

        {/* Feature Names */}
        <Stack spacing={1}>
          <Typography variant="subtitle2">Feature Names</Typography>

          <Stack spacing={1}>
            {/* Project */}
            {/* Project */}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2">Select Azure Project</Typography>
              {state.refreshProjects && (
                <IconButton
                  size="small"
                  onClick={state.refreshProjects}
                  disabled={state.projLoading}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              )}
              {state.projLoading && <CircularProgress size={14} />}
              {state.projErr && (
                <Typography color="error" variant="caption">
                  {state.projErr}
                </Typography>
              )}
            </Stack>
            <TextField
              select
              fullWidth
              size="small"
              label="Project"
              value={state.selectedProject}
              onChange={(e) => {
                state.setSelectedProject(e.target.value);
                state.setSelectedTeam(""); // reset downstream
                state.setSelectedAzureFeatures([]);
              }}
            >
              <MenuItem value="">(none)</MenuItem>
              {state.projects?.map((p) => (
                <MenuItem key={p.name} value={p.name}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>

            {/* Team */}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2">Select Azure Team</Typography>
              {state.refreshTeams && (
                <IconButton
                  size="small"
                  onClick={state.refreshTeams}
                  disabled={state.teamLoading || !state.selectedProject}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              )}
              {state.teamLoading && <CircularProgress size={14} />}
              {state.teamErr && (
                <Typography color="error" variant="caption">
                  {state.teamErr}
                </Typography>
              )}
            </Stack>
            <TextField
              select
              fullWidth
              size="small"
              label="Team"
              value={state.selectedTeam}
              onChange={(e) => {
                state.setSelectedTeam(e.target.value);
                state.setSelectedAzureFeatures([]); // reset downstream
              }}
              disabled={!state.selectedProject} // 🔒 locked until project is chosen
            >
              <MenuItem value="">(none)</MenuItem>
              {state.teams?.map((t) => (
                <MenuItem key={t.name} value={t.name}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>

            {/* Features */}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2">Features</Typography>
              {state.refreshFeatures && (
                <IconButton
                  size="small"
                  onClick={state.refreshFeatures}
                  disabled={state.azureLoading || !state.selectedTeam}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              )}
              {state.azureLoading && <CircularProgress size={14} />}
              {state.azureErr && (
                <Typography color="error" variant="caption">
                  {state.azureErr}
                </Typography>
              )}
            </Stack>
            <TextField
              select
              fullWidth
              size="small"
              label="Azure Features"
              SelectProps={{ multiple: true }}
              value={state.selectedAzureFeatures}
              onChange={(e) =>
                state.setSelectedAzureFeatures(
                  typeof e.target.value === "string"
                    ? e.target.value.split(",")
                    : (e.target.value as string[])
                )
              }
              disabled={!state.selectedTeam} // 🔒 locked until team is chosen
            >
              {state.azureFeatures?.map((f) => (
                <MenuItem key={f} value={f}>
                  {f}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>

        <Stack direction="row" justifyContent="flex-end">
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              // bubble up

              onSave();
              onClose();
            }}
          >
            Done
          </Button>
        </Stack>
      </Stack>
    </Popover>
  );
}
