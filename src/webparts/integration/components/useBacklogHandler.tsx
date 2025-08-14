import * as React from "react";
import { BacklogService, WorkItemService } from "../utils/BacklogService";
import { Alert, Snackbar } from "@mui/material";

export function useBacklogHandler() {
  const [email, setEmail] = React.useState("");
  const [selectedPayload, setSelectedPayload] = React.useState<any>(null);
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");
  const backlogService = new BacklogService();
  const handleAdd = (p: WorkItemService) => {
    setSelectedPayload(p);
  };

  const handleSubmit = async () => {
    try {
      await backlogService.createWorkItem({
        ...selectedPayload,
        assigneeEmail: email,
      });
      setToastMessage("Backlog item created successfully.");
    } catch {
      setToastMessage("Failed to create backlog item.");
    } finally {
      setToastOpen(true);
    }
  };

  const Toast = () => (
    <Snackbar
      open={toastOpen}
      autoHideDuration={4000}
      onClose={() => setToastOpen(false)}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        onClose={() => setToastOpen(false)}
        severity={toastMessage.indexOf("success") !== -1 ? "success" : "error"}
        sx={{ width: "100%" }}
      >
        {toastMessage}
      </Alert>
    </Snackbar>
  );

  return { email, setEmail, selectedPayload, handleAdd, handleSubmit, Toast };
}
