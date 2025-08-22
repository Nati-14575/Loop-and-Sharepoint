import { BacklogRow } from "../types";
import { ADO_CONFIG } from "./config";
export interface WorkItemService {
  title: string;
  description?: string;
  priority?: number;
  project?: string;
  tags?: string[];
  areaPath?: string;
  iterationPath?: string;
  assigneeEmail?: string;
  acceptanceCriteriaField?: string;
  sourceRow: BacklogRow;
  parentFeatureId?: number;
}
export class BacklogService {
  async createWorkItem(payload: WorkItemService): Promise<any> {
    const {
      org,
      pat,
      apiVersion,
      defaultType,
      areaPath,
      iterationPath,
      defaultTags,
    } = ADO_CONFIG;

    const url = `https://dev.azure.com/${org}/${payload.project}/_apis/wit/workitems/$${defaultType}?api-version=${apiVersion}`;

    const patchData = [
      { op: "add", path: "/fields/System.Title", value: payload.title },
      payload.description && {
        op: "add",
        path: "/fields/System.Description",
        value: payload.description,
      },
      payload.priority && {
        op: "add",
        path: "/fields/Microsoft.VSTS.Common.Priority",
        value: payload.priority,
      },
      {
        op: "add",
        path: "/fields/System.AreaPath",
        value: payload.areaPath || areaPath,
      },
      {
        op: "add",
        path: "/fields/System.IterationPath",
        value: payload.iterationPath || iterationPath,
      },
      payload.assigneeEmail && {
        op: "add",
        path: "/fields/System.AssignedTo",
        value: payload.assigneeEmail,
      },
      {
        op: "add",
        path: "/fields/System.Tags",
        value: [...(defaultTags || []), ...(payload.tags || [])].join("; "),
      },
      payload.acceptanceCriteriaField && {
        op: "add",
        path: "/fields/Microsoft.VSTS.Common.AcceptanceCriteria",
        value: payload.acceptanceCriteriaField,
      },
      payload.parentFeatureId &&
        payload.project && {
          op: "add",
          path: "/relations/-",
          value: {
            rel: "System.LinkTypes.Hierarchy-Reverse",
            url: `https://dev.azure.com/${encodeURIComponent(
              org
            )}/${encodeURIComponent(payload.project)}/_apis/wit/workItems/${
              payload.parentFeatureId
            }`,
            attributes: { comment: "Linked to parent Feature" },
          },
        },
    ].filter(Boolean);

    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json-patch+json",
        Authorization: "Basic " + btoa(":" + pat),
      },
      body: JSON.stringify(patchData),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to create work item: ${text}`);
    }

    return res.json();
  }
}
