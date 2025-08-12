import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";
import { BacklogRow } from "../types";
import { SP_LIST_TITLE } from "./config";
import { WebPartContext } from "@microsoft/sp-webpart-base";

export class SharePointService {
  constructor(private ctx: WebPartContext) {}

  async getItems(): Promise<BacklogRow[]> {
    const url = `${
      this.ctx.pageContext.web.absoluteUrl
    }/_api/web/lists/getbytitle('${encodeURIComponent(
      SP_LIST_TITLE
    )}')/items?$select=Id,Title,Created,Author/Title&$expand=Author`;
    const res: SPHttpClientResponse = await this.ctx.spHttpClient.get(
      url,
      SPHttpClient.configurations.v1
    );
    const data = await res.json();

    return (data.value || []).map((it: any) => ({
      id: String(it.Id),
      title: it.Title,
      description: "",
      creator: it.Author?.Title,
      created: it.Created,
      raw: it,
    }));
  }
}
