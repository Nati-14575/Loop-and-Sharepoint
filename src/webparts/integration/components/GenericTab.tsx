// GenericTab.tsx
import * as React from "react";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridValueGetter,
} from "@mui/x-data-grid";
import {
  Button,
  Stack,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Popover,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
  Typography,
  Chip,
  Box,
  MenuItem,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import RefreshIcon from "@mui/icons-material/Refresh";
import Autocomplete from "@mui/material/Autocomplete";

import { resolvePath } from "../utils/resolve";
import type { TabConfig } from "../utils/dynamicConfig";
import type { BacklogRow } from "../types";
import type { AzureConfig } from "../utils/azureDevopsFeatures";
import { useAzureProjects } from "../utils/ueAzureProjects";
import { useAzureFeaturesWithIds } from "../utils/useAzureFeatures";
export type BacklogPayload = {
  title: string;
  description: string;
  acceptanceCriteriaField?: string;
  featureNames?: string[];
  parentFeatureId?: number;
  assignee?: string;
  sourceRow: BacklogRow;
  project: string;
  businessPOC?: string;
};

type TitleMode = "column" | "template";
type FeatureSource = "azure" | "column";

type Props = {
  rows: BacklogRow[];
  loading: boolean;
  error?: string | null;
  config: TabConfig;
  onAddToBacklog: (payload: BacklogPayload) => void;
  azureConfig?: AzureConfig; // ⬅️ pass org/token; project chosen via UI
};

const escapeRegExp = (str: string) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const uniq = (arr: string[]) =>
  arr.filter((v, i, a) => v && a.indexOf(v) === i);

export default function GenericTab({
  rows,
  loading,
  error,
  config,
  onAddToBacklog,
  azureConfig,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<BacklogRow | null>(null);
  const [selectedRows, setSelectedRows] = React.useState<BacklogRow[]>([]);
  const [bulkEmail, setBulkEmail] = React.useState<string>("");

  // ⚙️ Settings
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const colPickerOpen = Boolean(anchorEl);
  const openColPicker = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const closeColPicker = () => setAnchorEl(null);

  // Builders config
  const [descCols, setDescCols] = React.useState<string[]>(() =>
    config.columns.map((c) => c.key)
  );
  const [acCols, setAcCols] = React.useState<string[]>([]);
  const [titleMode, setTitleMode] = React.useState<TitleMode>("column");
  const [titleColumnKey, setTitleColumnKey] = React.useState<string | "">("");
  const [titleTemplate, setTitleTemplate] = React.useState<string>("");

  // ── Azure: project → features flow
  const [featureSource, setFeatureSource] =
    React.useState<FeatureSource>("azure");
  const [selectedProject, setSelectedProject] = React.useState<string>("");
  const [featureColumnKey, setFeatureColumnKey] = React.useState<string | "">(
    ""
  );
  const [featureDelimiter, setFeatureDelimiter] = React.useState<string>(",");
  const [selectedAzureFeatures, setSelectedAzureFeatures] = React.useState<
    string[]
  >([]);

  // load projects by org
  const {
    projects,
    loading: projLoading,
    error: projErr,
    refresh: refreshProjects,
  } = useAzureProjects(azureConfig?.org, azureConfig?.token);

  // build cfg for features only when project chosen
  const featureCfg = React.useMemo<AzureConfig | undefined>(() => {
    if (!azureConfig || !selectedProject) return undefined;
    return { ...azureConfig, project: selectedProject as string };
  }, [azureConfig, selectedProject]);

  const {
    titles: azureFeatures, // string[] for the Autocomplete
    idByTitle, // Record<title, id> to resolve parent
    loading: azureLoading,
    error: azureErr,
    refresh,
  } = useAzureFeaturesWithIds(featureCfg);

  // clear previously picked features when project changes
  React.useEffect(() => {
    setSelectedAzureFeatures([]);
  }, [selectedProject]);

  const allColumnKeys = React.useMemo(
    () => config.columns.map((c) => c.key),
    [config.columns]
  );

  // ✅ use filter (not find) and pick first safely
  const colByKey = React.useCallback(
    (key: string) => config.columns.filter((c) => c.key === key),
    [config.columns]
  );
  const firstCol = React.useCallback(
    (key: string) => {
      const arr = colByKey(key);
      return arr.length ? arr[0] : undefined;
    },
    [colByKey]
  );

  const toggleIn = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    key: string
  ) =>
    setter((prev) =>
      prev.indexOf(key) !== -1 ? prev.filter((k) => k !== key) : [...prev, key]
    );
  const setAll = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    on: boolean
  ) => setter(on ? [...allColumnKeys] : []);

  const openDetails = (row: BacklogRow) => {
    setSelected(row);
    setOpen(true);
  };
  const closeDetails = () => {
    setOpen(false);
    setSelected(null);
  };

  // ——— Builders ———
  // replace your buildFromColumns with this “plain merge” version
  const buildFromColumns = React.useCallback(
    (row: BacklogRow, keys: string[]) => {
      if (!keys?.length) return "";

      const parts: string[] = [];

      const push = (val: unknown) => {
        const s = val == null ? "" : String(val).trim();
        if (s) parts.push(s);
      };

      for (const key of keys) {
        // 👇 just resolve directly on the row — no raw.* paths anymore
        const v = resolvePath(row, key, undefined);

        if (v == null) continue;

        if (Array.isArray(v)) {
          for (const item of v) {
            if (item == null) continue;
            if (typeof item === "object") {
              const o = item as any;
              push(
                o?.Title ??
                  o?.Name ??
                  o?.title ??
                  o?.name ??
                  o?.DisplayName ??
                  o?.displayName ??
                  JSON.stringify(o)
              );
            } else {
              push(item);
            }
          }
          continue;
        }

        if (typeof v === "object") {
          const o = v as any;
          push(
            o?.Title ??
              o?.Name ??
              o?.title ??
              o?.name ??
              o?.DisplayName ??
              o?.displayName ??
              JSON.stringify(o)
          );
          continue;
        }

        // primitive
        push(v);
      }

      // no labels, no bullets — just values joined
      return uniq(parts).join("\n");
    },
    [] // firstCol is no longer needed, we just use row props
  );

  const buildTitle = React.useCallback(
    (row: BacklogRow) => {
      if (titleMode === "column") {
        if (titleColumnKey) {
          const def = firstCol(titleColumnKey);
          const v = resolvePath(row, def?.path ?? titleColumnKey, "");
          const s = String(v ?? "");
          return s || String(resolvePath(row, ""));
        }
        return "";
      } else {
        const tokens = titleTemplate || "";
        return (
          tokens.replace(/\{([^}]+)\}/g, (_m, key) => {
            const def = firstCol(String(key));
            const v = resolvePath(row, def?.path ?? String(key), "");
            return v == null ? "" : String(v);
          }) || ""
        );
      }
    },
    [titleMode, titleColumnKey, titleTemplate, firstCol]
  );

  const buildDescription = React.useCallback(
    (row: BacklogRow) => {
      if (!descCols.length) {
        return "";
      }
      return buildFromColumns(row, descCols);
    },
    [descCols, buildFromColumns]
  );

  const buildAcceptanceCriteria = React.useCallback(
    (row: BacklogRow) => {
      if (!acCols.length) return undefined;
      return buildFromColumns(row, acCols);
    },
    [acCols, buildFromColumns]
  );

  // Column-mode feature name extraction (fallback)
  const buildFeatureNamesFromColumn = React.useCallback(
    (row: BacklogRow): string[] | undefined => {
      if (!featureColumnKey) return undefined;
      const def = firstCol(featureColumnKey);
      const raw = resolvePath(row, def?.path ?? featureColumnKey, undefined);
      if (raw == null) return undefined;

      if (Array.isArray(raw)) {
        const names = raw
          .map((x) =>
            typeof x === "string"
              ? x
              : typeof x === "object" && x
              ? (x as any).Name ||
                (x as any).Title ||
                (x as any).name ||
                (x as any).title ||
                JSON.stringify(x)
              : String(x)
          )
          .map((s) => s.trim())
          .filter(Boolean);
        return uniq(names);
      }

      if (typeof raw === "object") {
        const val =
          (raw as any).Name ||
          (raw as any).Title ||
          (raw as any).name ||
          (raw as any).title ||
          JSON.stringify(raw);
        const s = String(val).trim();
        return s ? [s] : undefined;
      }

      const s = String(raw).trim();
      const d = (featureDelimiter ?? "").trim();
      if (d) {
        const rx = new RegExp(`\\s*${escapeRegExp(d)}\\s*`);
        const parts = s
          .split(rx)
          .map((x) => x.trim())
          .filter(Boolean);
        if (parts.length > 1) return uniq(parts);
      }
      return s ? [s] : undefined;
    },
    [featureColumnKey, featureDelimiter, firstCol]
  );

  const buildFeatureNames = React.useCallback(
    (row: BacklogRow): string[] | undefined => {
      if (featureSource === "azure") {
        const names = selectedAzureFeatures
          .map((s) => s.trim())
          .filter(Boolean);
        return names.length ? uniq(names) : undefined;
      }
      return buildFeatureNamesFromColumn(row);
    },
    [featureSource, selectedAzureFeatures, buildFeatureNamesFromColumn]
  );

  const pushRow = (row: BacklogRow, assignee?: string) => {
    let parentFeatureId: number | undefined;
    if (featureSource === "azure" && selectedAzureFeatures.length > 0) {
      const firstTitle = selectedAzureFeatures[0];
      parentFeatureId = idByTitle?.[firstTitle]; // resolve title -> id
    }
    onAddToBacklog({
      title: buildTitle(row),
      description: buildDescription(row),
      acceptanceCriteriaField: buildAcceptanceCriteria(row),
      featureNames: buildFeatureNames(row),
      assignee,
      parentFeatureId: parentFeatureId ?? undefined,
      sourceRow: row,
      project: selectedProject,
      businessPOC: row.businessPoc,
    });
  };

  const handleBulkAdd = () => {
    selectedRows.forEach((row) => pushRow(row, bulkEmail || undefined));
    setBulkEmail("");
    setSelectedRows([]);
  };

  const handleSingleAdd = () => {
    if (!selected) return;
    pushRow(selected);
    closeDetails();
  };

  // ——— Grid ———
  const cols: GridColDef[] = React.useMemo(() => {
    const defs: GridColDef<any>[] = config.columns.map((col) => ({
      field: col.key,
      headerName: col.header,
      width: col.width,
      flex: col.flex,
      sortable: false,
      valueGetter: ((_value: unknown, row: BacklogRow | null): any => {
        if (!row) return "";
        return resolvePath(row, col.path, "");
      }) as GridValueGetter<BacklogRow>,
    }));

    defs.push({
      field: "__actions",
      headerName: "Actions",
      width: 320,
      renderCell: (params: GridRenderCellParams) => {
        const row = (params.row ?? {}) as BacklogRow;
        return (
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => openDetails(row)}
            >
              View Details
            </Button>
          </Stack>
        );
      },
    });

    return defs;
  }, [config.columns, pushRow]);

  return (
    <div className="rounded-xl border border-gray-200 p-3">
      {loading && (
        <div className="flex items-center gap-2">
          <CircularProgress size={20} /> Loading...
        </div>
      )}
      {error && <div className="text-red-600">{error}</div>}

      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        className="mb-3"
        sx={{ flexWrap: "wrap", rowGap: 1 }}
      >
        <TextField
          label="Assign to (optional email)"
          size="small"
          value={bulkEmail}
          onChange={(e) => setBulkEmail(e.target.value)}
        />
        <Button
          variant="contained"
          disabled={selectedRows.length === 0}
          onClick={handleBulkAdd}
        >
          Add Selected to Backlog
        </Button>

        <Divider flexItem orientation="vertical" />

        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2">Backlog mapping</Typography>
          <IconButton size="small" onClick={openColPicker}>
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>

      <div style={{ height: 520, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={cols}
          getRowId={(r) => `${(r as BacklogRow).id} ${(r as BacklogRow).title}`}
          checkboxSelection
          onRowSelectionModelChange={(ids) => {
            const selected = rows.filter(
              (row) =>
                (ids as (string | number)[]).indexOf(
                  `${(row as BacklogRow).id} ${(row as BacklogRow).title}`
                ) !== -1
            );
            setSelectedRows(selected);
          }}
          disableRowSelectionOnClick
        />
      </div>

      {/* Settings / Mapping */}
      <Popover
        open={colPickerOpen}
        anchorEl={anchorEl}
        onClose={closeColPicker}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Stack spacing={2} sx={{ p: 2, width: 560, maxWidth: "100%" }}>
          {/* Title */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Title
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Chip
                label="From Column"
                color={titleMode === "column" ? "primary" : "default"}
                size="small"
                onClick={() => setTitleMode("column")}
              />
              <Chip
                label="Template"
                color={titleMode === "template" ? "primary" : "default"}
                size="small"
                onClick={() => setTitleMode("template")}
              />
            </Stack>

            {titleMode === "column" ? (
              <TextField
                select
                fullWidth
                size="small"
                label="Title column"
                value={titleColumnKey}
                onChange={(e) => setTitleColumnKey(e.target.value)}
                helperText="Fallbacks to config.backlog.titlePath if empty."
              >
                <MenuItem value="">(none)</MenuItem>
                {config.optionColumns.map((c) => (
                  <MenuItem key={c.internalName} value={c.internalName}>
                    {c.displayName}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <Stack spacing={1}>
                <TextField
                  fullWidth
                  size="small"
                  label="Title template"
                  value={titleTemplate}
                  onChange={(e) => setTitleTemplate(e.target.value)}
                  placeholder="e.g. {RefId} - {Title}"
                  helperText="Use {columnKey} tokens. Click a chip to insert."
                />
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ flexWrap: "wrap", rowGap: 1 }}
                >
                  {config.columns.map((c) => (
                    <Chip
                      key={c.key}
                      label={`{${c.key}}`}
                      size="small"
                      onClick={() => setTitleTemplate((t) => t + `{${c.key}}`)}
                    />
                  ))}
                </Stack>
              </Stack>
            )}
          </Box>

          <Divider />

          {/* Description fields */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Description fields
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Button size="small" onClick={() => setAll(setDescCols, true)}>
                Select All
              </Button>
              <Button size="small" onClick={() => setAll(setDescCols, false)}>
                Clear
              </Button>
            </Stack>
            <FormGroup>
              {config.optionColumns.map((c) => (
                <FormControlLabel
                  key={c.internalName}
                  control={
                    <Checkbox
                      size="small"
                      checked={descCols.indexOf(c.internalName) !== -1}
                      onChange={() => toggleIn(setDescCols, c.internalName)}
                    />
                  }
                  label={c.displayName}
                />
              ))}
            </FormGroup>
          </Box>

          <Divider />

          {/* Acceptance Criteria fields */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Acceptance Criteria fields
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Button size="small" onClick={() => setAll(setAcCols, true)}>
                Select All
              </Button>
              <Button size="small" onClick={() => setAll(setAcCols, false)}>
                Clear
              </Button>
            </Stack>
            <FormGroup>
              {config.optionColumns.map((c) => (
                <FormControlLabel
                  key={c.internalName}
                  control={
                    <Checkbox
                      size="small"
                      checked={acCols.indexOf(c.internalName) !== -1}
                      onChange={() => toggleIn(setAcCols, c.internalName)}
                    />
                  }
                  label={c.displayName}
                />
              ))}
            </FormGroup>
          </Box>

          <Divider />

          {/* Feature names */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Feature names
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Chip
                label="From Azure"
                color={featureSource === "azure" ? "primary" : "default"}
                size="small"
                onClick={() => setFeatureSource("azure")}
              />
              <Chip
                label="From Column"
                color={featureSource === "column" ? "primary" : "default"}
                size="small"
                onClick={() => setFeatureSource("column")}
              />
            </Stack>

            {featureSource === "azure" ? (
              <Stack spacing={1}>
                {/* Project selection */}
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2">
                    {azureConfig
                      ? "Select Azure Project"
                      : "Provide azureConfig to enable"}
                  </Typography>
                  {azureConfig && (
                    <IconButton
                      size="small"
                      onClick={() => refreshProjects()}
                      disabled={projLoading}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  )}
                  {projLoading && <CircularProgress size={16} />}
                  {projErr && (
                    <Typography variant="caption" color="error">
                      {projErr}
                    </Typography>
                  )}
                </Stack>

                <Autocomplete<string, false, false, false>
                  options={(projects || []).map((p) => p.name)}
                  value={selectedProject || ""}
                  onChange={(_e, val) => setSelectedProject(val || "")}
                  disableClearable={false}
                  disabled={!azureConfig}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Project"
                      placeholder="Choose project"
                    />
                  )}
                />

                {/* Feature selection */}
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2">
                    {selectedProject
                      ? `Features in ${selectedProject}`
                      : "Pick a project to load features"}
                  </Typography>
                  {selectedProject && azureConfig && (
                    <IconButton
                      size="small"
                      onClick={() => refresh()}
                      disabled={azureLoading}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  )}
                  {azureLoading && <CircularProgress size={16} />}
                  {azureErr && (
                    <Typography variant="caption" color="error">
                      {azureErr}
                    </Typography>
                  )}
                </Stack>

                <Autocomplete<string, true, false, false>
                  multiple
                  options={azureFeatures ?? []}
                  value={selectedAzureFeatures}
                  onChange={(_e, val) => setSelectedAzureFeatures(val)}
                  disableCloseOnSelect
                  isOptionEqualToValue={(o, v) => o === v}
                  getOptionLabel={(o) => o}
                  disabled={!selectedProject}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Features"
                      placeholder={
                        selectedProject ? "Search..." : "Select a project first"
                      }
                    />
                  )}
                />
              </Stack>
            ) : (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Feature column"
                  value={featureColumnKey}
                  onChange={(e) => setFeatureColumnKey(e.target.value)}
                  helperText="Can be string/array/object."
                >
                  <MenuItem value="">(none)</MenuItem>
                  {config.columns.map((c) => (
                    <MenuItem key={c.key} value={c.key}>
                      {c.header}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  size="small"
                  label="Delimiter"
                  value={featureDelimiter}
                  onChange={(e) => setFeatureDelimiter(e.target.value)}
                  helperText="Used for delimited strings"
                  sx={{ minWidth: 140 }}
                />
              </Stack>
            )}
          </Box>

          <Stack direction="row" justifyContent="flex-end">
            <Button variant="contained" size="small" onClick={closeColPicker}>
              Done
            </Button>
          </Stack>
        </Stack>
      </Popover>

      {/* Details Dialog */}
      <Dialog open={open} onClose={closeDetails} maxWidth="sm" fullWidth>
        <DialogTitle>Item Details</DialogTitle>
        <DialogContent dividers>
          <div className="space-y-3">
            {config.details.map((d, i) => (
              <div key={i} className="text-sm">
                <div className="font-semibold">{d.label}</div>
                <div className="break-words">
                  {formatValue(resolvePath(selected, d.path, ""))}
                </div>
              </div>
            ))}

            {/* Quick preview */}
            {selected && (
              <div className="mt-4 space-y-2 text-xs">
                <Preview label="Built Title" value={buildTitle(selected)} />
                <Preview
                  label="Description (preview)"
                  value={buildDescription(selected)}
                />
                <Preview
                  label="Acceptance Criteria (preview)"
                  value={buildAcceptanceCriteria(selected)}
                />
                <Preview
                  label="Feature Names (preview)"
                  value={(buildFeatureNames(selected) || []).join(", ")}
                />
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSingleAdd} variant="contained">
            Add to Backlog
          </Button>
          <Button onClick={closeDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

function Preview({ label, value }: { label: string; value?: string }) {
  if (value == null || value === "") return null;
  const isBlock = String(value).indexOf("\n") !== -1;
  return (
    <div className="text-xs">
      <div className="font-semibold mb-1">{label}</div>
      {isBlock ? (
        <pre className="bg-gray-50 p-2 rounded-md overflow-auto text-xs">
          {value}
        </pre>
      ) : (
        <div>{value}</div>
      )}
    </div>
  );
}

function formatValue(v: any) {
  if (v === null || v === undefined) return "";
  if (typeof v === "object")
    return (
      <pre className="bg-gray-50 p-2 rounded-md overflow-auto text-xs">
        {JSON.stringify(v, null, 2)}
      </pre>
    );
  return String(v);
}
