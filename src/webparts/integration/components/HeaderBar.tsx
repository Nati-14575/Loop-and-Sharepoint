import * as React from "react";
import { Typography } from "@mui/material";
import ViewKanbanIcon from "@mui/icons-material/ViewKanban";

export default function HeaderBar() {
  return (
    <div className="flex items-center gap-2">
      <ViewKanbanIcon />
      <Typography variant="h6" className="!font-semibold">
        Backlog Hub
      </Typography>
    </div>
  );
}
