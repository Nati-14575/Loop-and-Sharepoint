import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { closeDetails } from "../store/uiSlice";
import { useAppDispatch, useAppSelector } from "../hooks";

export default function DetailsDialog() {
  const { detailsOpen, selected } = useAppSelector((s) => s.ui);
  const dispatch = useAppDispatch();

  return (
    <Dialog
      open={detailsOpen}
      onClose={() => dispatch(closeDetails())}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Item Details</DialogTitle>
      <DialogContent dividers>
        <div className="space-y-2">
          <Typography variant="subtitle1" className="!font-semibold">
            {selected?.title}
          </Typography>
          {selected?.description && (
            <Typography variant="body2">{selected?.description}</Typography>
          )}
          <div className="flex gap-4 text-sm">
            {selected?.creator && (
              <span>
                <b>Created by:</b> {selected?.creator}
              </span>
            )}
          </div>
          <pre className="bg-gray-50 p-3 rounded-lg overflow-auto text-xs">
            {JSON.stringify(selected?.raw, null, 2)}
          </pre>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => dispatch(closeDetails())}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
