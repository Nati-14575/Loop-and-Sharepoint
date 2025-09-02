import * as React from "react";
import { BacklogService } from "../utils/BacklogService";
import { Alert, Snackbar } from "@mui/material";
import { BacklogPayload } from "./GenericTab";
import { SharePointService } from "../utils/SharePointService";
import { getSpfxCtx } from "../utils/spfxCtx";

import { ADO_CONFIG } from "../utils/config";
import { checkDuplicateById } from "../utils/azureDevopsFeatures";

export function useBacklogHandler() {
  const [email, setEmail] = React.useState("");
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");
  const backlogService = new BacklogService();
  const spService = new SharePointService(getSpfxCtx());
  const handleSubmit = async (payload: BacklogPayload) => {
    try {
      const exists = await checkDuplicateById(
        {
          org: ADO_CONFIG.org,
          token: ADO_CONFIG.pat,
        },
        payload.project,
        payload.parentFeatureId as number,
        payload.title
      );

      if (exists) {
        throw new Error("❌ Task already exists in backlog");
      } else {
        await backlogService.createWorkItem({
          ...payload,
          assigneeEmail: email,
          project: payload.project,
          businessPOC: payload.businessPOC,
        });
        await spService.createItem(
          getSpfxCtx().pageContext.web.absoluteUrl,
          "BacklogTasks",
          {
            Title: payload.title,
          }
        );
        setToastMessage("Backlog item created successfully.");
      }
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
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert
        onClose={() => setToastOpen(false)}
        severity={toastMessage.indexOf("success") !== -1 ? "success" : "error"}
        sx={{
          width: "400px",
          fontSize: "1.1rem",
          p: 2,
        }}
      >
        {toastMessage}
      </Alert>
    </Snackbar>
  );

  return { email, setEmail, handleSubmit, Toast };
}
