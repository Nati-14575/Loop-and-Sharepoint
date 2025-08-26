import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";
import type { BacklogRow } from "../types";
import { UserListConfig } from "./dynamicConfig";

// helper to safely extract multiple paths
function combineFrom(it: any, paths?: string[], sep = "\n"): string {
  if (!paths || paths.length === 0) return "";
  const vals: string[] = [];
  for (const path of paths) {
    const val = path
      .split("/")
      .reduce((obj: any, key: string) => obj?.[key], it);
    if (val != null && String(val).trim()) {
      vals.push(String(val));
    }
  }
  return vals.join(sep);
}

export class SharePointService {
  constructor(private ctx: any) {}

  async getItems(cfg: UserListConfig): Promise<BacklogRow[]> {
    const { siteUrl, listTitle, mapping, extraFields, systemColumns } = cfg;

    const baseSelect = ["Id", "Created"];

    // flatten mapping values manually
    const mappingValues: string[] = [];
    if (mapping) {
      for (const key in mapping) {
        const arr = mapping[key as keyof typeof mapping];
        if (arr && Array.isArray(arr)) {
          for (let i = 0; i < arr.length; i++) {
            mappingValues.push(arr[i]);
          }
        }
      }
    }

    const allFields = [...mappingValues, ...(extraFields ?? [])];

    const selectParts: string[] = [...baseSelect];
    const expandSet: Record<string, boolean> = {};

    for (let i = 0; i < allFields.length; i++) {
      const f = allFields[i];
      if (!f) continue;

      if (f.indexOf("/") !== -1) {
        // e.g. "Author/Title"
        selectParts.push(f);
        expandSet[f.split("/")[0]] = true;
      } else {
        selectParts.push(f);
      }
    }

    const select = selectParts.join(",");
    const expand = Object.keys(expandSet).join(",");

    const url =
      `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(
        listTitle
      )}')/items` +
      `?$select=${select}` +
      (expand ? `&$expand=${expand}` : "");

    const res: SPHttpClientResponse = await this.ctx.spHttpClient.get(
      url,
      SPHttpClient.configurations.v1
    );

    if (!res.ok) {
      console.warn("SP fetch failed", listTitle, res.status);
      return [];
    }

    const json = await res.json();

    const rows: BacklogRow[] = (json.value || []).map((it: any) => {
      const row: BacklogRow = {
        id: String(it.Id),
        created: it.Created,
        raw: it,
        __source: listTitle,
      } as BacklogRow;

      // dynamically fill systemColumns from mapping
      for (let i = 0; i < systemColumns.length; i++) {
        const sysCol = systemColumns[i];
        const mappedPaths = mapping?.[sysCol.key] ?? [];
        row[sysCol.key] = combineFrom(it, mappedPaths, "\n");
      }

      return row;
    });

    return rows;
  }

  // 🔹 Fetch columns for the selected list
  fetchSpColumns = async (siteUrl: string, listTitle: string) => {
    try {
      const url = `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(
        listTitle
      )}')/fields?$filter=Hidden eq false`;
      const res: SPHttpClientResponse = await this.ctx.spHttpClient.get(
        url,
        SPHttpClient.configurations.v1
      );

      if (!res.ok) {
        console.warn("SP fetch failed", listTitle, res.status);
        return [];
      }

      const json = await res.json();
      return json;
    } catch (err) {
      console.error("Failed to fetch SP columns", err);
    }
  };
}
