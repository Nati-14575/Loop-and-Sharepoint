import * as React from "react";
import {
  Stack,
  TextField,
  Button,
  Divider,
  IconButton,
  CircularProgress,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import type { UserListConfig } from "../utils/dynamicConfig";
import type { BacklogRow } from "../types";
import type { AzureConfig } from "../utils/azureDevopsFeatures";

import { useAzureProjects } from "../utils/ueAzureProjects";
import { useAzureFeaturesWithIds } from "../utils/useAzureFeatures";

import {
  buildTitle,
  buildDescription,
  buildFeatureNames,
  buildFromColumns,
} from "./helpers/builders";
import { SettingsPopover } from "./SettingsPopover";
import { DetailsDialog } from "./DetailsDialog";
import { resolvePath } from "../utils/resolve";
import { loadConfig, saveConfig, SettingConfig } from "../utils/configStorage";
import { TextareaAutosize } from "@mui/material";
import { GridRenderEditCellParams, useGridApiContext } from "@mui/x-data-grid";
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

type Props = {
  rows: BacklogRow[];
  loading: boolean;
  error?: string | null;
  config: UserListConfig;
  onAddToBacklog: (payload: BacklogPayload) => void;
  azureConfig?: AzureConfig;
  tab: number;
};

export default function GenericTab({
  rows,
  loading,
  error,
  config,
  onAddToBacklog,
  azureConfig,
  tab,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<BacklogRow | null>(null);
  const [selectedRows, setSelectedRows] = React.useState<BacklogRow[]>([]);
  const [bulkEmail, setBulkEmail] = React.useState<string>("");
  const [backLogConfig, setBackLogConfig] =
    React.useState<SettingConfig | null>(() => loadConfig(config.listTitle));
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  const [titleColumnKey, setTitleColumnKey] = React.useState<string>(
    backLogConfig?.titleColumnKey ?? ""
  );

  const [descCols, setDescCols] = React.useState<string[]>(
    backLogConfig?.descCols ?? []
  );
  const [acCols, setAcCols] = React.useState<string[]>(
    backLogConfig?.acCols ?? []
  );
  const [businessPocCol, setBusinessPocCol] = React.useState<string>(
    backLogConfig?.businessPocCol ?? ""
  );
  // inside GenericTab
  const [localRows, setLocalRows] = React.useState<BacklogRow[]>([]);

  React.useEffect(() => {
    if (!loading) {
      setLocalRows(
        rows.map((row) => {
          return {
            ...row,
            acceptanceCriteria: row.acceptanceCriteria ?? "",
          };
        })
      );
    }
  }, [loading]);

  // azure integration
  const [featureSource] = React.useState<string>("azure");
  const [selectedProject, setSelectedProject] = React.useState<string>("");
  const [featureColumnKey, setFeatureColumnKey] = React.useState<string>("");
  const [featureDelimiter, setFeatureDelimiter] = React.useState<string>(",");
  const [selectedAzureFeatures, setSelectedAzureFeatures] = React.useState<
    string[]
  >([]);

  const {
    projects,
    loading: projLoading,
    error: projErr,
    refresh: refreshProjects,
  } = useAzureProjects(azureConfig?.org, azureConfig?.token);

  const featureCfg = React.useMemo<AzureConfig | undefined>(() => {
    if (!azureConfig || !selectedProject) return undefined;
    return { ...azureConfig, project: selectedProject };
  }, [azureConfig, selectedProject]);

  const {
    titles: azureFeatures,
    idByTitle,
    loading: azureLoading,
    error: azureErr,
    refresh: refreshFeatures,
  } = useAzureFeaturesWithIds(featureCfg);

  React.useEffect(() => {
    setSelectedAzureFeatures([]);
  }, [selectedProject]);

  // push selected rows
  const handleBulkAdd = () => {
    selectedRows.forEach((row) =>
      onAddToBacklog({
        title: buildTitle(row, titleColumnKey),
        description: buildDescription(row, descCols),
        acceptanceCriteriaField: row.acceptanceCriteria,
        featureNames: buildFeatureNames(row, {
          source: featureSource,
          azureFeatures: selectedAzureFeatures,
          columnKey: featureColumnKey,
          delimiter: featureDelimiter,
        }),
        assignee: bulkEmail || undefined,
        parentFeatureId:
          featureSource === "azure" && selectedAzureFeatures.length > 0
            ? idByTitle?.[selectedAzureFeatures[0]]
            : undefined,
        sourceRow: row,
        project: selectedProject,
        businessPOC: row.businessPoc ?? buildFromColumns(row, [businessPocCol]),
      })
    );
    setBulkEmail("");
    setSelectedRows([]);
  };

  const cols: GridColDef[] = React.useMemo(() => {
    const defs: GridColDef<BacklogRow>[] = [];
    const systemColumns = config.systemColumns.filter(
      (s) => s.key !== "acceptanceCriteria"
    );
    for (let i = 0; i < systemColumns.length; i++) {
      const col = systemColumns[i];

      defs.push({
        field: col.key,
        headerName: col.displayName || col.key,
        flex: 1,
        sortable: false,
        valueGetter: (_v, row) => (row ? resolvePath(row, col.key, "") : ""),
      });
    }

    defs.push({
      field: "acceptanceCriteria",
      headerName: "Acceptance Criteria",
      flex: 2,
      sortable: false,
      // editable: true,
      // renderCell: (params) => {
      //   const row = params.row;
      //   return (
      //     <textarea
      //       style={{
      //         width: "100%",
      //         height: "100%",
      //         resize: "none",
      //         fontSize: "0.875rem",
      //         padding: "4px",
      //         border: "1px solid #ccc",
      //         borderRadius: "4px",
      //       }}
      //       value={row.acceptanceCriteria || ""}
      //       onChange={(e) => {
      //         console.log(e.target.value);
      //         setLocalRows((prev) =>
      //           prev.map((r) =>
      //             r.id === row.id
      //               ? { ...r, acceptanceCriteria: e.target.value }
      //               : r
      //           )
      //         );
      //       }}
      //       // stop DataGrid from stealing space/ctrl/shift keys
      //       onKeyDown={(e) => {
      //         e.stopPropagation();
      //       }}
      //     />
      //   );
      // },
      editable: true,
      renderEditCell: (params) => <AcceptanceCriteriaEditCell {...params} />,
      renderCell: (params) => (
        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
          {params.row.acceptanceCriteria || ""}
        </div>
      ),
    });

    // actions column
    defs.push({
      field: "__actions",
      headerName: "Actions",
      width: 220,
      renderCell: (params: GridRenderCellParams<BacklogRow>) => {
        const row = params.row;
        return (
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setOpen(true);
              setSelected(row);
            }}
          >
            View Details
          </Button>
        );
      },
    });

    return defs;
  }, [config.systemColumns, localRows]);
  return (
    <div className="rounded-xl border border-gray-200 p-3">
      {loading && (
        <div className="flex items-center gap-2">
          <CircularProgress size={20} /> Loading...
        </div>
      )}
      {error && <div className="text-red-600">{error}</div>}

      {/* toolbar */}
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
          Add Selected
        </Button>
        <Divider flexItem orientation="vertical" />
        <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* grid */}
      <div style={{ height: 520, width: "100%" }}>
        <DataGrid
          rows={localRows}
          columns={cols}
          getRowId={(r) => `${(r as BacklogRow).id}`}
          checkboxSelection
          disableRowSelectionOnClick
          processRowUpdate={(newRow) => {
            setLocalRows((prev) =>
              prev.map((r) => (r.id === newRow.id ? newRow : r))
            );
            return newRow;
          }}
          experimentalFeatures={{}}
          getRowHeight={() => "auto"}
          sx={{
            "& .MuiDataGrid-cell": {
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              lineHeight: "1.4rem",
              alignItems: "flex-start",
            },
          }}
          onRowSelectionModelChange={(ids) => {
            const selected = localRows.filter(
              (row) => (ids as (string | number)[]).indexOf(row.id) !== -1
            );
            setSelectedRows(selected);
          }}
        />
      </div>

      {/* settings */}
      <SettingsPopover
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        config={config}
        onSave={() => {
          const backlogConfigUpdated = {
            listTitle: config.listTitle,
            titleColumnKey: titleColumnKey,
            acCols: acCols,
            descCols: descCols,
            businessPocCol: businessPocCol,
          };
          saveConfig(backlogConfigUpdated);
          setBackLogConfig(backlogConfigUpdated);
        }}
        state={{
          titleColumnKey,
          setTitleColumnKey,
          descCols,
          setDescCols,
          acCols,
          setAcCols,
          setBusinessPocCol,
          businessPocCol,
          selectedProject,
          setSelectedProject,
          featureColumnKey,
          setFeatureColumnKey,
          featureDelimiter,
          setFeatureDelimiter,
          selectedAzureFeatures,
          setSelectedAzureFeatures,
          projects,
          projLoading,
          projErr,
          refreshProjects,
          azureFeatures,
          azureLoading,
          azureErr,
          refreshFeatures,
        }}
      />

      {/* details dialog */}
      <DetailsDialog
        open={open}
        row={selected}
        onClose={() => {
          setOpen(false);
          setSelected(null);
        }}
      />
    </div>
  );
}

// custom editor component
const AcceptanceCriteriaEditCell = (props: GridRenderEditCellParams) => {
  const { id, field, value } = props;
  const apiRef = useGridApiContext();

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    apiRef.current.setEditCellValue({ id, field, value: event.target.value });
  };

  return (
    <TextareaAutosize
      autoFocus
      minRows={3}
      style={{ width: "100%", fontSize: "0.9rem" }}
      value={value || ""}
      onChange={handleChange}
    />
  );
};
