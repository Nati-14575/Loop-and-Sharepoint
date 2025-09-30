import * as React from "react";
import {
  Button,
  TextField,
  Box,
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

type SystemColumn = {
  key: string;
  displayName: string;
};

interface DynamicFormProps {
  systemColumns: SystemColumn[];
  onAddRow: (row: Record<string, any>) => void;
}

const DynamicForm: React.FC<DynamicFormProps> = ({
  systemColumns,
  onAddRow,
}: DynamicFormProps) => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState<Record<string, any>>({});

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddRow(formData);
    setFormData({});
    setOpen(false);
  };

  const isDateField = (key: string) => key.toLowerCase().indexOf("date") != -1;

  return (
    <Box>
      {/* Trigger button */}
      <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
        Add
      </Button>

      {/* Modal dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>Add New Row</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {systemColumns.map((col: SystemColumn) => (
                <TextField
                  key={col.key}
                  label={col.displayName}
                  type={isDateField(col.key) ? "date" : "text"}
                  value={formData[col.key] || ""}
                  onChange={(e) => handleChange(col.key, e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={
                    isDateField(col.key)
                      ? { shrink: true } // keeps label above for date fields
                      : undefined
                  }
                />
              ))}
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpen(false)} color="secondary">
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary">
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default DynamicForm;
