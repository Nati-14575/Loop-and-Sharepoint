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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CodeIcon from "@mui/icons-material/Code";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { BacklogRow } from "../types";

type Props = {
  open: boolean;
  row: BacklogRow | null;
  onClose: () => void;
};

export function DetailsDialog({ open, row, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6">{row?.title || "Item Details"}</Typography>
        <Tooltip title="Close">
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <Divider />

      <DialogContent dividers sx={{ bgcolor: "grey.50" }}>
        <Stack spacing={3}>
          {row?.description && (
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                <InfoOutlinedIcon fontSize="small" /> Description
              </Typography>
              <Typography variant="body1">{row.description}</Typography>
            </Box>
          )}

          {row?.creator && (
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                <PersonIcon fontSize="small" /> Metadata
              </Typography>
              <Chip
                icon={<PersonIcon />}
                label={`Created by: ${row.creator}`}
              />
            </Box>
          )}

          {row?.raw && (
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                <CodeIcon fontSize="small" /> Raw JSON
              </Typography>
              <SyntaxHighlighter language="json" style={materialDark}>
                {JSON.stringify(row.raw, null, 2)}
              </SyntaxHighlighter>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
