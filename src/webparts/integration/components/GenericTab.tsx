import * as React from "react";
import {
  Stack,
  TextField,
  Button,
  Divider,
  IconButton,
  CircularProgress,
  Card,
  CardContent,
  Tooltip,
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
import { TaskListCell } from "./TaskListCell";
import { CheckCircle, ErrorOutline, PersonAdd } from "@mui/icons-material";
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
      editable: true,
      renderEditCell: (params) => <AcceptanceCriteriaEditCell {...params} />,
      renderCell: (params) => (
        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
          {params.row.acceptanceCriteria || ""}
        </div>
      ),
    });

    defs.push({
      field: "__tasks",
      headerName: "Tasks",
      flex: 2,
      sortable: false,
      renderCell: (params) => {
        return (
          <TaskListCell
            siteUrl={config.siteUrl}
            listTitle={"BacklogTasks"}
            title={params.row.Title || ""}
          />
        );
      },
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
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Loading & Error States */}
      {loading && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100 mb-4">
          <CircularProgress size={24} className="text-blue-600" />
          <span className="text-blue-700 font-medium">
            Loading backlog items...
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
          <div className="flex items-center gap-2 text-red-700">
            <ErrorOutline className="text-red-600" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <Card
        variant="outlined"
        className="mb-6 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50"
      >
        <CardContent className="p-4">
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ flexWrap: "wrap", rowGap: 1 }}
          >
            <TextField
              label="Assign to (email)"
              size="small"
              value={bulkEmail}
              onChange={(e) => setBulkEmail(e.target.value)}
              variant="outlined"
              className="bg-white rounded-lg"
              sx={{
                minWidth: 250,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            <Button
              variant="contained"
              disabled={selectedRows.length === 0}
              onClick={handleBulkAdd}
              startIcon={<PersonAdd />}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: 3,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                },
              }}
            >
              Add Selected ({selectedRows.length})
            </Button>

            <Divider flexItem orientation="vertical" sx={{ height: 32 }} />

            <Tooltip title="Settings">
              <IconButton
                size="small"
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  border: "1px solid",
                  borderColor: "grey.300",
                  bgcolor: "white",
                  "&:hover": {
                    bgcolor: "grey.50",
                  },
                }}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </CardContent>
      </Card>

      {/* Grid Container */}
      <Card variant="outlined" className="rounded-xl overflow-hidden">
        <CardContent className="p-0">
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
                border: "none",
                "& .MuiDataGrid-main": {
                  borderRadius: 2,
                },
                "& .MuiDataGrid-columnHeaders": {
                  bgcolor: "grey.50",
                  borderBottom: "2px solid",
                  borderColor: "grey.200",
                },
                "& .MuiDataGrid-cell": {
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  lineHeight: "1.4rem",
                  alignItems: "flex-start",
                  borderColor: "grey.100",
                },
                "& .MuiDataGrid-row": {
                  "&:hover": {
                    bgcolor: "grey.50",
                  },
                  "&.Mui-selected": {
                    bgcolor: "blue.50",
                    "&:hover": {
                      bgcolor: "blue.100",
                    },
                  },
                },
                "& .MuiDataGrid-footerContainer": {
                  borderTop: "1px solid",
                  borderColor: "grey.200",
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
        </CardContent>
      </Card>

      {/* Selection Counter */}
      {selectedRows.length > 0 && (
        <div className="flex items-center gap-2 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <CheckCircle className="text-blue-600" />
          <span className="text-blue-700 font-medium">
            {selectedRows.length} item{selectedRows.length !== 1 ? "s" : ""}{" "}
            selected
          </span>
        </div>
      )}

      {/* Settings Popover */}
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

      {/* Details Dialog */}
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
      style={{
        width: "100%",
        fontSize: "0.9rem",
        outline: "none",
        border: "none",
      }}
      value={value || ""}
      onChange={handleChange}
    />
  );
};
