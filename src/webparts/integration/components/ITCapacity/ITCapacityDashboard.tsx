import * as React from "react";
import {
  Box,
  Typography,
  Paper,
  Alert,
  Drawer,
  IconButton,
  TextField,
  Button,
  Stack,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import ITCapacityTable from "./ITCapacityTable";
import ITCapacityHistogram from "./ITCapacityHistogram";
import { ITCapacityService } from "./ITCapacityService";
import {
  ITCapacityData,
  ITCapacityHistogramData,
  ITCapacityRow,
} from "./types";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";

import { getSpfxCtx } from "../../utils/spfxCtx";

interface Props {
  siteUrl?: string;
  embedded?: boolean; // If true, render without header/button/drawer
}

interface SharepointConfig {
  libraryName: string;
  folderPath: string;
  fileName: string;
  annualTeamCapacity: number;
}

// Configuration from requirements
const SHAREPOINT_CONFIG: SharepointConfig = {
  libraryName: "Generative AI - AI Project Mgmt Docs",
  folderPath: "AI Project Management/All demand/05-2025 Demand planning",
  fileName: "2-2025 Capacity.xlsx",
  annualTeamCapacity: 208135,
};

export default function ITCapacityDashboard({ siteUrl, embedded }: Props) {
  const [capacityData, setCapacityData] = React.useState<ITCapacityData[]>([]);
  const [histogramData, setHistogramData] = React.useState<
    ITCapacityHistogramData[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [spConfig, setSpConfig] =
    React.useState<SharepointConfig>(SHAREPOINT_CONFIG);
  const [localFileName, setLocalFileName] = React.useState<string>("");
  const [localFileBuffer, setLocalFileBuffer] =
    React.useState<ArrayBuffer | null>(null);
  const capacityService = React.useMemo(
    () => new ITCapacityService(getSpfxCtx()),
    []
  );

  const EXCEL_YEAR = 2026;

  const [asOfDate, setAsOfDate] = React.useState<Date>(
    new Date(EXCEL_YEAR, 0, 1)
  );

  const [dateError, setDateError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadCapacityData = async () => {
      if (!siteUrl && !localFileBuffer) {
        setError("Site URL is required, or upload a local Excel file.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let rawData: ITCapacityRow[] = [];
        let raw: any[] = [];

        if (localFileBuffer) {
          rawData = await capacityService.parseLocalExcel(localFileBuffer);
          setError(null);
        } else {
          // Step 1: Get Excel file from SharePoint
          const arrayBuffer = await capacityService.getExcelFileBySearch(
            siteUrl!,
            spConfig.libraryName,
            spConfig.folderPath,
            spConfig.fileName
          );

          // Step 2: Parse Excel data using SharePoint Excel REST API
          const { results, rows } = await capacityService.parseExcelData(
            arrayBuffer
          );
          (rawData = results), (raw = rows);
        }

        // If parsing returns empty (not implemented), use mock data for demonstration
        let processedData: ITCapacityData[];
        if (rawData.length === 0) {
          // Mock data for demonstration - replace with actual parsed data
          processedData = [];
        } else {
          // Calculate capacity metrics from parsed data
          processedData = capacityService.calculateCapacityData(
            rawData,
            raw,
            asOfDate
          );
        }

        setCapacityData(processedData);

        // Step 3: Prepare histogram data (total capacity hours to date by team)
        // Calculate cumulative capacity from Jan 1 to current date for each team
        const histogram =
          rawData.length > 0
            ? capacityService.calculateHistogramData(rawData)
            : // Fallback: use annual capacity for mock data
              processedData.reduce((acc, row) => {
                // Use a simple loop instead of Array.prototype.find for ES5 compatibility
                let existing: ITCapacityHistogramData | null = null;
                for (let i = 0; i < acc.length; i++) {
                  if (acc[i].team === row.team) {
                    existing = acc[i];
                    break;
                  }
                }

                if (existing) {
                  existing.totalCapacityHours += row.annualCapacity;
                } else {
                  acc.push({
                    team: row.team,
                    totalCapacityHours: row.annualCapacity,
                  });
                }
                return acc;
              }, [] as ITCapacityHistogramData[]);

        setHistogramData(histogram);
      } catch (err: any) {
        console.error("Failed to load capacity data:", err);
        setError(
          err.message ||
            "Failed to load capacity data. Please check SharePoint file access or upload a local Excel file."
        );
      } finally {
        setLoading(false);
      }
    };

    loadCapacityData();
  }, [
    siteUrl,
    capacityService,
    spConfig,
    localFileBuffer,
    localFileName,
    asOfDate,
  ]);

  const handleLocalFile = (file?: File) => {
    if (!file) return;
    setLocalFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (result && result instanceof ArrayBuffer) {
        setLocalFileBuffer(result);
      } else if (result) {
        // result can be a string if readAsDataURL; we only use array buffer
        const buffer = new TextEncoder().encode(result).buffer;
        setLocalFileBuffer(buffer);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  if (embedded) {
    // Embedded mode: just show table and histogram without header/button/drawer
    return (
      <Box>
        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> {error}
            </Typography>
          </Alert>
        )}
        <Box sx={{ mb: 4 }}>
          <ITCapacityTable
            data={capacityData}
            loading={loading}
            error={error}
          />
        </Box>
        <Box>
          <ITCapacityHistogram
            data={histogramData}
            loading={loading}
            inline={true}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", p: 3 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom fontWeight={600}>
          IT Team Capacity Dashboard
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ flex: 1, minWidth: 280 }}
          >
            Capacity data sourced from SharePoint:{" "}
            <strong>{spConfig.libraryName}</strong> /{" "}
            <strong>{spConfig.folderPath}</strong> /{" "}
            <strong>{spConfig.fileName}</strong>
          </Typography>
          <TextField
            size="small"
            label="File name"
            value={spConfig.fileName}
            onChange={(e: any) =>
              setSpConfig((prev) => ({
                ...prev,
                fileName: e.target.value,
              }))
            }
            sx={{ minWidth: 220 }}
          />
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              component="label"
              sx={{ textTransform: "none" }}
            >
              {localFileName ? "Replace local file" : "Upload local Excel"}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                hidden
                onChange={(e) => handleLocalFile(e.target.files?.[0])}
              />
            </Button>
            {localFileName && (
              <Typography variant="caption" color="text.secondary">
                Using: {localFileName}
              </Typography>
            )}
          </Stack>
          <DatePicker
            label="View capacity as of"
            value={dayjs(asOfDate)}
            minDate={dayjs(new Date(EXCEL_YEAR, 0, 1))}
            maxDate={dayjs(new Date(EXCEL_YEAR, 11, 31))}
            onChange={(value: Dayjs | null) => {
              if (!value) return;

              if (value.year() !== EXCEL_YEAR) {
                setDateError(`Please select a date within ${EXCEL_YEAR}`);
                return;
              }

              setDateError(null);
              setAsOfDate(value.toDate());
            }}
            slotProps={{
              textField: {
                size: "small",
                sx: { minWidth: 220 },
                error: !!dateError,
                helperText: dateError ?? "",
              },
            }}
          />

          <IconButton
            size="small"
            onClick={() => setDrawerOpen(true)}
            sx={{ ml: "auto" }}
            aria-label="View details"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Box>
      </Paper>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Note:</strong> {error}
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Excel file parsing is not yet implemented. Please implement using
            the xlsx library or SharePoint Excel REST API. The current display
            shows mock data for demonstration purposes.
          </Typography>
        </Alert>
      )}

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
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
              onClick={() => setDrawerOpen(false)}
              aria-label="Close drawer"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        <Box sx={{ p: 2, overflow: "auto", height: "calc(100vh - 64px)" }}>
          <Box sx={{ mb: 4 }}>
            <ITCapacityTable
              data={capacityData}
              loading={loading}
              error={error}
            />
          </Box>
          <Box>
            <ITCapacityHistogram
              data={histogramData}
              loading={loading}
              inline={true}
            />
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}
