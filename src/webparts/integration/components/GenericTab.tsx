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
import { resolvePath } from "../utils/resolve";
import type { TabConfig } from "../utils/dynamicConfig";
import type { BacklogRow } from "../types";

export type BacklogPayload = {
  title: string;
  description: string;
  acceptanceCriteriaField?: string;
  featureNames?: string[];
  assignee?: string;
  sourceRow: BacklogRow;
};

type Props = {
  rows: BacklogRow[];
  loading: boolean;
  error?: string | null;
  config: TabConfig;
  onAddToBacklog: (payload: BacklogPayload) => void;
};

type TitleMode = "column" | "template";

export default function GenericTab({
  rows,
  loading,
  error,
  config,
  onAddToBacklog,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<BacklogRow | null>(null);
  const [selectedRows, setSelectedRows] = React.useState<BacklogRow[]>([]);
  const [bulkEmail, setBulkEmail] = React.useState<string>("");

  // ⚙️ Settings state
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const colPickerOpen = Boolean(anchorEl);
  const openColPicker = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const closeColPicker = () => setAnchorEl(null);

  // Description fields (checkboxes)
  const [descCols, setDescCols] = React.useState<string[]>(() =>
    config.columns.map((c) => c.key)
  );
  // Acceptance Criteria fields (checkboxes)
  const [acCols, setAcCols] = React.useState<string[]>([]);
  // Title builder
  const [titleMode, setTitleMode] = React.useState<TitleMode>("column");
  const [titleColumnKey, setTitleColumnKey] = React.useState<string | "">("");
  const [titleTemplate, setTitleTemplate] = React.useState<string>("");
  // Feature names
  const [featureColumnKey, setFeatureColumnKey] = React.useState<string | "">(
    ""
  );
  const [featureDelimiter, setFeatureDelimiter] = React.useState<string>(","); // used when value is a delimited string

  // helpers
  const allColumnKeys = React.useMemo(
    () => config.columns.map((c) => c.key),
    [config.columns]
  );

  const colByKey = React.useCallback(
    (key: string) => config.columns.filter((c) => c.key === key),
    [config.columns]
  );

  const toggleIn = (
    arrSetter: React.Dispatch<React.SetStateAction<string[]>>,
    key: string
  ) =>
    arrSetter((prev) =>
      prev.indexOf(key) !== -1 ? prev.filter((k) => k !== key) : [...prev, key]
    );

  const setAll = (
    arrSetter: React.Dispatch<React.SetStateAction<string[]>>,
    on: boolean
  ) => arrSetter(on ? [...allColumnKeys] : []);

  const openDetails = (row: BacklogRow) => {
    setSelected(row);
    setOpen(true);
  };
  const closeDetails = () => {
    setOpen(false);
    setSelected(null);
  };

  // ————————— Builders —————————
  const buildFromColumns = React.useCallback(
    (row: BacklogRow, keys: string[]) => {
      if (!keys?.length) return "";
      const lines = keys.map((key) => {
        const def = colByKey(key);
        const label = def?.[0]?.header ?? key;
        const value = resolvePath(row, def?.[0]?.path ?? key, "");
        const pretty =
          value == null
            ? ""
            : typeof value === "object"
            ? "```json\n" + JSON.stringify(value, null, 2) + "\n```"
            : String(value);
        return `- **${label}**: ${pretty}`;
      });
      return lines.join("\n");
    },
    [colByKey]
  );

  const buildTitle = React.useCallback(
    (row: BacklogRow) => {
      if (titleMode === "column") {
        if (titleColumnKey) {
          const def = colByKey(titleColumnKey);
          const v = resolvePath(row, def?.[0].path ?? titleColumnKey, "");
          const s = String(v ?? "");
          return s || String(resolvePath(row, config.backlog.titlePath, ""));
        }
        // fallback to configured title path
        return String(resolvePath(row, config.backlog.titlePath, ""));
      } else {
        // template mode: replace {key} with resolved values
        const tokens = titleTemplate || "";
        const replaced = tokens.replace(/\{([^}]+)\}/g, (_m, key) => {
          const def = colByKey(String(key));
          const v = resolvePath(row, def?.[0].path ?? String(key), "");
          return v == null ? "" : String(v);
        });
        return (
          replaced || String(resolvePath(row, config.backlog.titlePath, ""))
        );
      }
    },
    [
      titleMode,
      titleColumnKey,
      titleTemplate,
      colByKey,
      config.backlog.titlePath,
    ]
  );

  const buildDescription = React.useCallback(
    (row: BacklogRow) => {
      if (!descCols.length && config.backlog.descriptionPath) {
        return String(resolvePath(row, config.backlog.descriptionPath, ""));
      }
      return buildFromColumns(row, descCols);
    },
    [descCols, config.backlog.descriptionPath, buildFromColumns]
  );

  const buildAcceptanceCriteria = React.useCallback(
    (row: BacklogRow) => {
      if (!acCols.length) return undefined;
      // Return as bullet list (you can change format)
      return buildFromColumns(row, acCols);
    },
    [acCols, buildFromColumns]
  );

  // helpers (top of file)
  const escapeRegExp = (str: string) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const uniq = (arr: string[]) => {
    const out: string[] = [];
    for (const v of arr) if (v && !(out.indexOf(v) !== -1)) out.push(v);
    return out;
  };

  const buildFeatureNames = React.useCallback(
    (row: BacklogRow): string[] | undefined => {
      if (!featureColumnKey) return undefined;

      const def = colByKey(featureColumnKey);
      const raw = resolvePath(
        row,
        def?.[0]?.path ?? featureColumnKey,
        undefined
      );

      if (raw == null) return undefined;

      if (Array.isArray(raw)) {
        const names = raw
          .map((x) =>
            typeof x === "string"
              ? x
              : typeof x === "object" && x
              ? x.Name || x.Title || x.name || x.title || JSON.stringify(x)
              : String(x)
          )
          .map((s) => s.trim())
          .filter(Boolean);
        return uniq(names); // no Array.from, no Set
      }

      if (typeof raw === "object") {
        const val =
          raw.Name || raw.Title || raw.name || raw.title || JSON.stringify(raw);
        const s = String(val).trim();
        return s ? [s] : undefined;
      }

      // string/number -> split by delimiter if present
      const s = String(raw).trim();
      const d = (featureDelimiter ?? "").trim();

      if (d) {
        // split on the literal delimiter, ignoring surrounding spaces
        const rx = new RegExp(`\\s*${escapeRegExp(d)}\\s*`);
        const parts = s
          .split(rx)
          .map((x) => x.trim())
          .filter(Boolean);

        if (parts.length > 1) return uniq(parts);
      }

      return s ? [s] : undefined;
    },
    [featureColumnKey, featureDelimiter, colByKey]
  );

  // ————————— Actions —————————
  const pushRow = (row: BacklogRow, assignee?: string) => {
    onAddToBacklog({
      title: buildTitle(row),
      description: buildDescription(row),
      acceptanceCriteriaField: buildAcceptanceCriteria(row),
      featureNames: buildFeatureNames(row),
      assignee,
      sourceRow: row,
    });
  };

  const handleBulkAdd = () => {
    console.log(selectedRows);
    selectedRows.forEach((row) => pushRow(row, bulkEmail || undefined));
    setBulkEmail("");
    setSelectedRows([]);
  };

  const handleSingleAdd = () => {
    if (!selected) return;
    pushRow(selected);
    closeDetails();
  };

  // ————————— Grid —————————
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
            <Button
              size="small"
              variant="contained"
              onClick={() => pushRow(row)}
            >
              Add
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
          getRowId={(r) => (r as BacklogRow).id}
          checkboxSelection
          onRowSelectionModelChange={(ids) => {
            const selected = rows.filter(
              (row) => (ids as (string | number)[]).indexOf(row.id) !== -1
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
        <Stack spacing={2} sx={{ p: 2, width: 420, maxWidth: "100%" }}>
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
                {config.columns.map((c) => (
                  <MenuItem key={c.key} value={c.key}>
                    {c.header}
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
              {config.columns.map((c) => (
                <FormControlLabel
                  key={c.key}
                  control={
                    <Checkbox
                      size="small"
                      checked={descCols.indexOf(c.key) !== -1}
                      onChange={() => toggleIn(setDescCols, c.key)}
                    />
                  }
                  label={c.header}
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
              {config.columns.map((c) => (
                <FormControlLabel
                  key={c.key}
                  control={
                    <Checkbox
                      size="small"
                      checked={acCols.indexOf(c.key) !== -1}
                      onChange={() => toggleIn(setAcCols, c.key)}
                    />
                  }
                  label={c.header}
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
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField
                select
                fullWidth
                size="small"
                label="Feature column"
                value={featureColumnKey}
                onChange={(e) => setFeatureColumnKey(e.target.value)}
                helperText="Can be a string, array, or object (Name/Title)."
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
                helperText="Used if value is a delimited string"
                sx={{ minWidth: 140 }}
              />
            </Stack>
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

            {/* Preview built fields */}
            {selected && (
              <div className="mt-4 space-y-2">
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
                  value={buildFeatureNames(selected)?.join(", ")}
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
