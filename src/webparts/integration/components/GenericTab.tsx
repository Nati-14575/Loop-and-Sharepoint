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
} from "@mui/material";
import { resolvePath } from "../utils/resolve";
import type { TabConfig } from "../utils/dynamicConfig";
import type { BacklogRow } from "../types";

type Props = {
  /** rows: must at least have id + raw; your current BacklogRow works */
  rows: BacklogRow[];
  loading: boolean;
  error?: string | null;
  config: TabConfig;
  onAddToBacklog: (payload: {
    title: string;
    description?: string;
    priority?: string;
    assignee?: string;
    sourceRow: BacklogRow;
  }) => void;
};

export default function GenericTab({
  rows,
  loading,
  error,
  config,
  onAddToBacklog,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<BacklogRow | null>(null);

  const openDetails = (row: BacklogRow) => {
    setSelected(row);
    setOpen(true);
  };

  const closeDetails = () => {
    setOpen(false);
    setSelected(null);
  };

  const cols: GridColDef[] = React.useMemo(() => {
    const defs: GridColDef<any>[] = config.columns.map((col) => ({
      field: col.key,
      headerName: col.header,
      width: col.width,
      flex: col.flex,
      sortable: false,
      // v7 callback: (value, row, column)
      valueGetter: ((_value: unknown, row: BacklogRow | null): any => {
        if (!row) return ""; // <- guard: row can be null during initial render
        return resolvePath(row, col.path, "");
      }) as GridValueGetter<BacklogRow>,
    }));

    defs.push({
      field: "__actions",
      headerName: "Actions",
      width: 280,
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
              onClick={() => {
                const payload = {
                  title: String(resolvePath(row, config.backlog.titlePath, "")),
                  description: String(
                    resolvePath(row, config.backlog.descriptionPath || "", "")
                  ),
                  assignee: String(
                    resolvePath(row, config.backlog.assigneePath || "", "")
                  ),
                  sourceRow: row,
                };
                onAddToBacklog(payload);
              }}
            >
              Add to Backlog
            </Button>
          </Stack>
        );
      },
    });

    return defs;
  }, [config]);
  return (
    <div className="rounded-xl border border-gray-200 p-3">
      {loading && (
        <div className="flex items-center gap-2">
          <CircularProgress size={20} /> Loading...
        </div>
      )}
      {error && <div className="text-red-600">{error}</div>}
      <div style={{ height: 520, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={cols}
          getRowId={(r) => (r as BacklogRow).id}
          disableRowSelectionOnClick
        />
      </div>

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
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetails}>Close</Button>
        </DialogActions>
      </Dialog>
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
