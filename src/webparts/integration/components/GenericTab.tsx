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
} from "@mui/material";
import { resolvePath } from "../utils/resolve";
import type { TabConfig } from "../utils/dynamicConfig";
import type { BacklogRow } from "../types";
import { WorkItemService } from "../utils/BacklogService";

type Props = {
  rows: BacklogRow[];
  loading: boolean;
  error?: string | null;
  config: TabConfig;
  onAddToBacklog: (payload: WorkItemService) => void;
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
  const [selectedRows, setSelectedRows] = React.useState<BacklogRow[]>([]);
  const [bulkEmail, setBulkEmail] = React.useState<string>("");

  const openDetails = (row: BacklogRow) => {
    setSelected(row);
    setOpen(true);
  };

  const closeDetails = () => {
    setOpen(false);
    setSelected(null);
  };

  const handleBulkAdd = () => {
    console.log(selectedRows);
    selectedRows.forEach((row) => {
      const payload = {
        title: String(resolvePath(row, config.backlog.titlePath, "")),
        description: String(
          resolvePath(row, config.backlog.descriptionPath || "", "")
        ),
        assignee: bulkEmail || undefined,
        sourceRow: row,
      };
      console.log(payload);
      onAddToBacklog(payload);
    });
    setBulkEmail("");
    setSelectedRows([]);
  };

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

      <Stack direction="row" spacing={2} alignItems="center" className="mb-3">
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
      </Stack>

      <div style={{ height: 520, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={cols}
          getRowId={(r) => (r as BacklogRow).id}
          checkboxSelection
          onRowSelectionModelChange={(ids) => {
            const selected = rows.filter((row) => ids.indexOf(row.id) !== -1);
            setSelectedRows(selected);
          }}
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
