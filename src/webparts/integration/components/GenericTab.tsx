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
  buildAcceptanceCriteria,
  buildFeatureNames,
  buildFromColumns,
} from "./helpers/builders";
import { SettingsPopover } from "./SettingsPopover";
import { DetailsDialog } from "./DetailsDialog";
import { resolvePath } from "../utils/resolve";
import { loadConfig, saveConfig, SettingConfig } from "../utils/configStorage";

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
        acceptanceCriteriaField: buildAcceptanceCriteria(row, acCols),
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

    for (let i = 0; i < config.systemColumns?.length; i++) {
      const col = config.systemColumns[i];

      defs.push({
        field: col.key,
        headerName: col.displayName || col.key,
        flex: 1,
        sortable: false,
        valueGetter: (_v, row) => (row ? resolvePath(row, col.key, "") : ""),
      });
    }

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
  }, [config.systemColumns]);

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
          rows={rows}
          columns={cols}
          getRowId={(r) => `${(r as BacklogRow).id}`}
          checkboxSelection
          onRowSelectionModelChange={(ids) => {
            const selected = rows.filter(
              (row) => (ids as (string | number)[]).indexOf(row.id) != -1
            );
            setSelectedRows(selected);
          }}
          disableRowSelectionOnClick
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
