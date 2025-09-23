import * as React from "react";
import { BacklogService } from "../utils/BacklogService";
import { BacklogPayload } from "./GenericTab";
import { SharePointService } from "../utils/SharePointService";
import { getSpfxCtx } from "../utils/spfxCtx";

import { ADO_CONFIG } from "../utils/config";
import { checkDuplicateById } from "../utils/azureDevopsFeatures";
import { toast } from "react-toastify";

export function useBacklogHandler() {
  const [email, setEmail] = React.useState("");
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
        toast.success("Backlog item created successfully.");
      }
    } catch {
      toast.success("Failed to create backlog item.");
    } 
  };

  

  return { email, setEmail, handleSubmit };
}
