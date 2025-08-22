import * as React from "react";
import { BacklogService } from "../utils/BacklogService";
import { Alert, Snackbar } from "@mui/material";
import { BacklogPayload } from "./GenericTab";

export function useBacklogHandler() {
  const [email, setEmail] = React.useState("");
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");
  const backlogService = new BacklogService();

  const handleSubmit = async (payload: BacklogPayload) => {
    try {
      console.log(payload);
      await backlogService.createWorkItem({
        ...payload,
        assigneeEmail: email,
        project: payload.project,
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

  return { email, setEmail, handleSubmit, Toast };
}
