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
  // ✅ Create a new item in a SharePoint list (generic JSON payload)
  async createItem(
    siteUrl: string,
    listTitle: string,
    item: Record<string, any>
  ) {
    const url = `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(
      listTitle
    )}')/items`;

    const body = JSON.stringify(item);

    const res: SPHttpClientResponse = await this.ctx.spHttpClient.post(
      url,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: "application/json;odata=nometadata",
          "Content-Type": "application/json;odata=nometadata",
        },
        body,
      }
    );

    if (!res.ok) {
      throw new Error(`❌ Failed to create item: ${res.status}`);
    }

    return res.json();
  }

  async getItemsByTitle(siteUrl: string, listTitle: string, title: string) {
    const url =
      `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(
        listTitle
      )}')/items` +
      `?$select=Id,Title,Created,Author/Id,Author/Title&$expand=Author&$filter=Title eq '${encodeURIComponent(
        title
      )}'`;

    const res: SPHttpClientResponse = await this.ctx.spHttpClient.get(
      url,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: "application/json;",
          "Content-Type": "application/json;",
        },
      }
    );

    if (!res.ok) throw new Error(`❌ Failed to fetch items: ${res.status}`);
    const json = await res.json();
    return json.value || []; // Use 'value' for nometadata/minimalmetadata
  }

  async saveDefaultConfig(siteUrl: string, configs: any) {
    const url = `${siteUrl}/_api/web/lists/getbytitle('Configuration Manager')/items`;

    const body = JSON.stringify({
      Title: "Default Config", // we can hardcode or allow multiple profiles
      Config: JSON.stringify(configs),
      IsDefault: true,
    });

    const res: SPHttpClientResponse = await this.ctx.spHttpClient.post(
      url,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: "application/json;",
          "Content-Type": "application/json;",
        },
        body,
      }
    );

    if (!res.ok)
      throw new Error(`❌ Failed to save default config: ${res.status}`);
    return res.json();
  }

  // Load configs from default
  async loadDefaultConfig(siteUrl: string) {
    const url =
      `${siteUrl}/_api/web/lists/getbytitle('Configuration Manager')/items` +
      `?$select=Id,Title,Config&$filter=IsDefault eq 1&$top=1`;

    const res: SPHttpClientResponse = await this.ctx.spHttpClient.get(
      url,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: "application/json;",
          "Content-Type": "application/json;",
        },
      }
    );

    if (!res.ok)
      throw new Error(`❌ Failed to load default config: ${res.status}`);
    const json = await res.json();

    if (!json.value || json.value.length === 0) return null;

    try {
      return JSON.parse(json.value[0].Config);
    } catch (err) {
      console.error("❌ Failed to parse default config", err);
      return null;
    }
  }

  // Save or update configs for a specific user
  async saveUserConfig(siteUrl: string, username: string, configs: any) {
    const listTitle = "Configuration Manager";

    // check if user already has a config
    const checkUrl =
      `${siteUrl}/_api/web/lists/getbytitle('${listTitle}')/items` +
      `?$select=Id,Title&$filter=Title eq '${encodeURIComponent(username)}'`;

    const checkRes = await this.ctx.spHttpClient.get(
      checkUrl,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: "application/json;",
          "Content-Type": "application/json;",
        },
      }
    );
    const checkJson = await checkRes.json();
    const existing = checkJson.value?.[0];

    if (existing) {
      // update existing item
      const updateUrl = `${siteUrl}/_api/web/lists/getbytitle('${listTitle}')/items(${existing.Id})`;
      const res = await this.ctx.spHttpClient.post(
        updateUrl,
        SPHttpClient.configurations.v1,
        {
          headers: {
            Accept: "application/json;",
            "Content-Type": "application/json;",
            "IF-MATCH": "*",
            "X-HTTP-Method": "MERGE",
          },
          body: JSON.stringify({
            Config: JSON.stringify(configs),
          }),
        }
      );
      if (!res.ok) throw new Error(`❌ Failed to update user config`);
      return res.json();
    } else {
      // create new item
      const createUrl = `${siteUrl}/_api/web/lists/getbytitle('${listTitle}')/items`;
      const res = await this.ctx.spHttpClient.post(
        createUrl,
        SPHttpClient.configurations.v1,
        {
          headers: {
            Accept: "application/json;",
            "Content-Type": "application/json;",
          },
          body: JSON.stringify({
            Title: username,
            Config: JSON.stringify(configs),
          }),
        }
      );
      if (!res.ok) throw new Error(`❌ Failed to create user config`);
      return res.json();
    }
  }
  async loadUserConfig(siteUrl: string, username: string) {
    const listTitle = "Configuration Manager";
    const url =
      `${siteUrl}/_api/web/lists/getbytitle('${listTitle}')/items` +
      `?$select=Id,Title,Config&$filter=Title eq '${encodeURIComponent(
        username
      )}'&$top=1`;

    const res = await this.ctx.spHttpClient.get(
      url,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: "application/json;",
          "Content-Type": "application/json;",
        },
      }
    );

    if (!res.ok) throw new Error("❌ Failed to load user config");
    const json = await res.json();
    if (!json.value || json.value.length === 0) return null;

    return JSON.parse(json.value[0].Config);
  }

  /**
   * 🔹 Get count of items where a column begins with a value
   * @param siteUrl SharePoint site URL
   * @param listTitle List name
   * @param filterColumn Column name (e.g. "Title")
   * @param startsWith The prefix string to check
   * @returns number of matching items
   */
  async getItemCountByStartsWith(
    siteUrl: string,
    listTitle: string,
    filterColumn: string,
    startsWith: string
  ): Promise<number> {
    const url =
      `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(
        listTitle
      )}')/items/$count` +
      `?$filter=startswith(${filterColumn},'${startsWith}')`;

    const res: SPHttpClientResponse = await this.ctx.spHttpClient.get(
      url,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: "application/json;odata=nometadata",
        },
      }
    );

    if (!res.ok) {
      throw new Error(`❌ Failed to fetch count: ${res.status}`);
    }

    const text = await res.text(); // $count returns plain number
    return parseInt(text, 10) || 0;
  }
}
