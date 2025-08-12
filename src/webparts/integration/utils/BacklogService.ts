import { AadHttpClient, HttpClientResponse } from "@microsoft/sp-http";
import { AZDO_PROXY_URL } from "./config";

export class BacklogService {
  constructor(private ctx: any) {}

  async createWorkItem(payload: {
    title: string;
    description?: string;
    priority?: string;
    assignee?: string;
    sourceId?: string;
    source?: "Loop" | "SharePoint" | string;
  }) {
    const client: AadHttpClient = await this.ctx.aadHttpClientFactory.getClient(
      this.ctx.manifest.id
    );
    const res: HttpClientResponse = await client.post(
      AZDO_PROXY_URL,
      AadHttpClient.configurations.v1,
      {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Backlog API failed: ${res.status} ${text}`);
    }
  }
}
