import * as React from "react";
import {
  Button,
  TextField,
  Box,
  Paper,
  Stack,
  Typography,
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
  const [showForm, setShowForm] = React.useState(false);
  const [formData, setFormData] = React.useState<Record<string, any>>({});

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddRow(formData);
    setFormData({});
    setShowForm(false);
  };

  return (
    <Box>
      {!showForm ? (
        <Button
          variant="contained"
          color="primary"
          onClick={() => setShowForm(true)}
        >
          Add
        </Button>
      ) : (
        <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <Typography variant="h6">Add New Row</Typography>

              {systemColumns.map((col: SystemColumn) => (
                <TextField
                  key={col.key}
                  label={col.displayName}
                  value={formData[col.key] || ""}
                  onChange={(e) => handleChange(col.key, e.target.value)}
                  fullWidth
                  size="small"
                />
              ))}

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="contained" color="primary">
                  Save
                </Button>
              </Stack>
            </Stack>
          </form>
        </Paper>
      )}
    </Box>
  );
};

export default DynamicForm;
