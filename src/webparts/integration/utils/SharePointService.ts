import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";
import { BacklogRow } from "../types";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { resolvePath } from "./resolve";
import { LIST_FIELD_CONFIG } from "./dynamicConfig";

export class SharePointService {
  constructor(private ctx: WebPartContext) {}

  async getItems(): Promise<BacklogRow[]> {
    const allResults: BacklogRow[] = [];

    for (const list of LIST_FIELD_CONFIG) {
      const url = `${
        list.siteUrl
      }/_api/web/lists/getbytitle('${encodeURIComponent(
        list.listTitle
      )}')/items?$expand=Author&$select=*,Author/Title`;

      const res: SPHttpClientResponse = await this.ctx.spHttpClient.get(
        url,
        SPHttpClient.configurations.v1
      );

      const json = await res.json();

      const rows: BacklogRow[] = (json.value || []).map((item: any) => ({
        id: String(item.Id),
        title: resolvePath(item, list.titlePath, ""),
        description: resolvePath(item, list.descriptionPath ?? "", ""),
        creator: resolvePath(item, list.creatorPath, ""),
        created: item.Created,
        raw: item,
      }));

      allResults.push(...rows);
    }

    return allResults;
  }
}
