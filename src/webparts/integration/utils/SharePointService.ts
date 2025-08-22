import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";
import { BacklogRow } from "../types";
import { SP_LIST_TITLE, SP_LIST_TITLE2 } from "./config";
import { WebPartContext } from "@microsoft/sp-webpart-base";

export class SharePointService {
  constructor(private ctx: WebPartContext) {}

  async getItems(): Promise<BacklogRow[]> {
    const url = `${
      this.ctx.pageContext.web.absoluteUrl
    }/_api/web/lists/getbytitle('${encodeURIComponent(
      SP_LIST_TITLE
    )}')/items?$select=Id,Title,Created,Author/Title&$expand=Author`;
    const url2 = `${
      this.ctx.pageContext.web.absoluteUrl
    }/_api/web/lists/getbytitle('${encodeURIComponent(
      SP_LIST_TITLE2
    )}')/items?$select=Id,Title,Created,Author/Title&$expand=Author`;
    const res: SPHttpClientResponse = await this.ctx.spHttpClient.get(
      url,
      SPHttpClient.configurations.v1
    );
    const res2: SPHttpClientResponse = await this.ctx.spHttpClient.get(
      url2,
      SPHttpClient.configurations.v1
    );
    const data1 = await res.json();
    const data2 = await res2.json();
    const finalData = [...data1.value, ...data2.value];

    return (finalData || []).map((it: any) => ({
      id: String(it.Id),
      title: it.Title,
      description: "",
      creator: it.Author?.Title,
      created: it.Created,
      raw: it,
    }));
  }
}
