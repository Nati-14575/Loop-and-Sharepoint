// DetailsDialog.tsx
import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Tooltip,
  Divider,
  Stack,
  Box,
  Chip,
  Button,
  Card,
  CardContent,
} from "@mui/material";
import {
  Close,
  Person,
  Description,
  Code,
  CalendarToday,
  Category,
  PriorityHigh,
  Info,
} from "@mui/icons-material";
import type { BacklogRow } from "../types";

type Props = {
  open: boolean;
  row: BacklogRow | null;
  onClose: () => void;
};

// Icon mapping for common field types
const fieldIcons: Record<string, React.ReactNode> = {
  title: <Info fontSize="small" />,
  description: <Description fontSize="small" />,
  creator: <Person fontSize="small" />,
  createdDate: <CalendarToday fontSize="small" />,
  dueDate: <CalendarToday fontSize="small" />,
  status: <Category fontSize="small" />,
  priority: <PriorityHigh fontSize="small" />,
  assignee: <Person fontSize="small" />,
  type: <Category fontSize="small" />,
  category: <Category fontSize="small" />,
};

// Color mapping for common field values
const getValueColor = (
  key: string,
  value: any
):
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info" => {
  if (!value) return "default";

  switch (key.toLowerCase()) {
    case "type":
    case "category":
      return "secondary";

    default:
      return "default";
  }
};

// Format field names for display
const formatFieldName = (key: string): string => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

// Check if value is a date string
const isDateString = (value: any): boolean => {
  if (typeof value !== "string") return false;
  return !isNaN(Date.parse(value)) && !(value.indexOf("{") !== -1);
};

// Format date for display
const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

// Check if value should be excluded from display
const shouldExcludeField = (key: string, value: any): boolean => {
  const excludedFields = ["id", "_id", "__v", "raw", "metadata", "internal"];
  return (
    excludedFields.indexOf(key.toLowerCase()) != -1 ||
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "object" && !Array.isArray(value))
  );
};

export function DetailsDialog({ open, row, onClose }: Props) {
  if (!row) return null;

  // Get all properties from the row object dynamically
  const getDisplayableFields = () => {
    const fields: { key: string; value: any; isDate: boolean }[] = [];

    for (const key in row) {
      if (Object.prototype.hasOwnProperty.call(row, key)) {
        const value = (row as any)[key];

        if (!shouldExcludeField(key, value)) {
          fields.push({
            key,
            value,
            isDate: isDateString(value),
          });
        }
      }
    }

    // Sort fields with common ones first
    const commonFields = [
      "title",
      "description",
      "status",
      "priority",
      "creator",
      "assignee",
      "createdDate",
      "dueDate",
    ];
    return fields.sort((a, b) => {
      const aIndex = commonFields.indexOf(a.key);
      const bIndex = commonFields.indexOf(b.key);
      if (aIndex === -1 && bIndex === -1) return a.key.localeCompare(b.key);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  };

  const displayFields = getDisplayableFields();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          py: 2.5,
          px: 3,
        }}
      >
        <Typography variant="h6" fontWeight="600">
          {row.title || "Item Details"}
        </Typography>
        <Tooltip title="Close">
          <IconButton
            onClick={onClose}
            sx={{
              color: "white",
              "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
            }}
          >
            <Close />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <Divider />

      <DialogContent dividers sx={{ py: 3, px: 3 }}>
        <Stack spacing={3}>
          {/* Dynamic Fields */}
          {displayFields.map(({ key, value, isDate }) => (
            <Card
              key={key}
              variant="outlined"
              sx={{ borderRadius: 2, boxShadow: 1 }}
            >
              <CardContent>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  {fieldIcons[key] || <Info fontSize="small" color="primary" />}
                  <Typography
                    variant="subtitle1"
                    fontWeight="600"
                    color="primary"
                  >
                    {formatFieldName(key)}
                  </Typography>
                </Box>

                <Box sx={{ pl: 3 }}>
                  {isDate ? (
                    <Typography
                      variant="body1"
                      sx={{ color: "text.primary", fontFamily: "monospace" }}
                    >
                      {formatDate(value)}
                    </Typography>
                  ) : typeof value === "boolean" ? (
                    <Chip
                      label={value ? "Yes" : "No"}
                      color={value ? "success" : "default"}
                      size="small"
                      variant="outlined"
                    />
                  ) : Array.isArray(value) ? (
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {value.map((item, index) => (
                        <Chip
                          key={index}
                          label={String(item)}
                          size="small"
                          color={getValueColor(key, item)}
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Typography
                      variant="body1"
                      sx={{
                        lineHeight: 1.6,
                        color: "text.primary",
                        p: 1,
                        bgcolor: "grey.50",
                        borderRadius: 1,
                        borderLeft: "3px solid",
                        borderColor: "primary.main",
                        fontFamily: key === "code" ? "monospace" : "inherit",
                      }}
                    >
                      {String(value)}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}

          {/* Raw Data Card (if exists) */}
          {row.raw && (
            <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 1 }}>
              <CardContent>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <Code color="primary" />
                  <Typography
                    variant="subtitle1"
                    fontWeight="600"
                    color="primary"
                  >
                    Raw Data
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "grey.50",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    maxHeight: 300,
                    overflow: "auto",
                  }}
                >
                  {row.raw && (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "minmax(120px, auto) 1fr",
                        gap: 1,
                        fontFamily: "monospace",
                        fontSize: "0.85rem",
                      }}
                    >
                      {Object.keys(row.raw).map((key) => {
                        const value = (row.raw as any)[key];
                        return (
                          <React.Fragment key={key}>
                            <Typography
                              sx={{
                                color: "primary.main",
                                fontWeight: 600,
                                py: 0.5,
                                px: 1,
                                bgcolor: "primary.50",
                                borderRadius: 1,
                                border: "1px solid",
                                borderColor: "primary.100",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {key}:
                            </Typography>
                            <Typography
                              sx={{
                                color: "text.primary",
                                py: 0.5,
                                px: 1.5,
                                bgcolor: "background.paper",
                                borderRadius: 1,
                                border: "1px solid",
                                borderColor: "grey.200",
                                wordBreak: "break-word",
                                minHeight: "32px",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {value === null ? (
                                "null"
                              ) : value === undefined ? (
                                "undefined"
                              ) : typeof value === "object" ? (
                                <Box
                                  component="pre"
                                  sx={{
                                    m: 0,
                                    whiteSpace: "pre-wrap",
                                    fontFamily: "inherit",
                                    fontSize: "inherit",
                                  }}
                                >
                                  {JSON.stringify(value, null, 2)}
                                </Box>
                              ) : (
                                String(value)
                              )}
                            </Typography>
                          </React.Fragment>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
