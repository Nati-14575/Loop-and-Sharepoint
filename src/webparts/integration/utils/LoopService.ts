// src/webparts/integration/utils/LoopService.ts
import type { WebPartContext } from "@microsoft/sp-webpart-base";
import {
  AadHttpClient,
  HttpClientResponse,
  MSGraphClientV3,
} from "@microsoft/sp-http";
import { BacklogRow } from "../types";
import { LOOP_PAGE_TITLE } from "./config";

/**
 * Reads a Loop PAGE (not Planner), grabs its HTML, parses the first <table>, and maps to BacklogRow[].
 * Prefers Loop beta API: /beta/loop/... ; falls back to DriveItem HTML (/content?format=html).
 *
 * Permissions:
 *  - Preferred:  Microsoft Graph (beta)  Loop.Read.All
 *  - Fallback:   Microsoft Graph Files.Read.All  (to fetch the .loop DriveItem as HTML)
 */
export class LoopService {
  constructor(private ctx: WebPartContext) {}

  public async getItems(): Promise<BacklogRow[]> {
    const graph: MSGraphClientV3 =
      await this.ctx.msGraphClientFactory.getClient("3");

    // 1) find the .loop item via Graph search
    const query = {
      requests: [
        {
          entityTypes: ["driveItem"],
          query: { queryString: `${LOOP_PAGE_TITLE}.loop` },
          from: 0,
          size: 5,
        },
      ],
    };
    const search = await graph.api("/search/query").post(query);
    const hits = search?.value?.[0]?.hitsContainers?.[0]?.hits || [];
    const hit = hits.find((h: any) =>
      (h?.resource?.name || "").toLowerCase().endsWith(".loop")
    );
    if (!hit) return [];

    const r = hit.resource;
    const driveId = r?.parentReference?.driveId;
    const itemId = r?.id;
    if (!driveId || !itemId) return [];

    // 2) try HTML render (many Loop pages return empty table…)
    const aad: AadHttpClient = await this.ctx.aadHttpClientFactory.getClient(
      "https://graph.microsoft.com"
    );
    const base = `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(
      driveId
    )}/items/${encodeURIComponent(itemId)}/content`;

    // HTML first
    const htmlRes: HttpClientResponse = await aad.get(
      base + "?format=html",
      AadHttpClient.configurations.v1
    );
    const html = await htmlRes.text();
    const htmlRows = this._parseFirstTableHtml(html);
    if (htmlRows.length > 0) return htmlRows;

    // 3) fallback: markdown render → parse markdown table (✅ works with Loop tables)
    const mdRes: HttpClientResponse = await aad.get(
      base + "?format=markdown",
      AadHttpClient.configurations.v1
    );
    const markdown = await mdRes.text();
    const mdRows = this._parseFirstMarkdownTable(markdown);
    return mdRows;
  }

  private _parseFirstTableHtml(html: string): BacklogRow[] {
    const container = document.createElement("div");
    container.innerHTML = html;

    const tables = container.getElementsByTagName("table");
    if (!tables || tables.length === 0) return [];

    const trs = tables[0].getElementsByTagName("tr");
    if (!trs || trs.length === 0) return [];

    // try to get headers from th, if not found use first row td as headers
    const headers: string[] = [];
    let ths = trs[0].getElementsByTagName("th");
    if (!ths || ths.length === 0) {
      ths = trs[0].getElementsByTagName("td");
    }
    for (let i = 0; i < ths.length; i++) {
      headers.push((ths[i].textContent || "").trim().toLowerCase());
    }

    const titleIdx = this._findHeaderIndex(headers, ["task", "title"]);
    const descIdx = this._findHeaderIndex(headers, ["description", "desc"]);
    const startRow = headers.length > 0 ? 1 : 0;

    const out: BacklogRow[] = [];
    for (let r = startRow; r < trs.length; r++) {
      const tds = trs[r].getElementsByTagName("td");
      if (!tds || tds.length === 0) continue;

      const tCell = tds[titleIdx >= 0 ? titleIdx : 0];
      const dCell = tds[descIdx >= 0 ? descIdx : Math.min(1, tds.length - 1)];

      const title = (
        tCell && tCell.textContent ? tCell.textContent : ""
      ).trim();
      const desc = (dCell && dCell.textContent ? dCell.textContent : "").trim();
      if (!title && !desc) continue;

      out.push({
        id: "loop-h-" + r,
        title,
        description: desc,
        created: new Date().toISOString(),
        raw: {},
      });
    }
    return out;
  }

  private _parseFirstMarkdownTable(md: string): BacklogRow[] {
    // Find first markdown table block:
    // | Col1 | Col2 |
    // | ---- | ---- |
    // | v1   | v2   |
    const lines = this._splitLines(md);
    let start = -1,
      sep = -1,
      end = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (
        this._looksLikeMdHeader(line) &&
        i + 1 < lines.length &&
        this._looksLikeMdSeparator(lines[i + 1])
      ) {
        start = i;
        sep = i + 1;
        // find end
        end = sep + 1;
        while (end < lines.length && this._looksLikeMdRow(lines[end])) end++;
        break;
      }
    }
    if (start === -1) return [];

    const headerCells = this._splitMdRow(lines[start]);
    const titleIdx = this._findHeaderIndex(headerCells, ["task", "title"]);
    const descIdx = this._findHeaderIndex(headerCells, ["description", "desc"]);

    const out: BacklogRow[] = [];
    for (let i = sep + 1; i < end; i++) {
      const cells = this._splitMdRow(lines[i]);
      const title = this._cell(cells, titleIdx >= 0 ? titleIdx : 0);
      const desc = this._cell(cells, descIdx >= 0 ? descIdx : 1);
      if (!title && !desc) continue;

      out.push({
        id: "loop-md-" + i,
        title,
        description: desc,
        created: new Date().toISOString(),
        raw: { cells },
      });
    }
    return out;
  }

  // --------- tiny helpers ---------
  private _findHeaderIndex(headers: string[], keys: string[]): number {
    for (let i = 0; i < headers.length; i++) {
      const h = (headers[i] || "").toLowerCase();
      for (let k = 0; k < keys.length; k++)
        if (h.indexOf(keys[k]) !== -1) return i;
    }
    return -1;
  }

  private _splitLines(s: string): string[] {
    const arr: string[] = [];
    let cur = "",
      i = 0;
    for (i = 0; i < s.length; i++) {
      const ch = s.charAt(i);
      if (ch === "\n" || ch === "\r") {
        if (cur.length) arr.push(cur);
        cur = "";
        // swallow \r\n pairs
        if (ch === "\r" && i + 1 < s.length && s.charAt(i + 1) === "\n") i++;
      } else {
        cur += ch;
      }
    }
    if (cur.length) arr.push(cur);
    return arr;
  }

  private _looksLikeMdHeader(line: string): boolean {
    // starts/ends with | and has at least one more |
    return line.trim().indexOf("|") !== -1;
  }
  private _looksLikeMdSeparator(line: string): boolean {
    // e.g., | --- | ---- | :-: |
    const t = line.trim();
    if (t.length === 0) return false;
    // a crude check: at least two pipes and contains - or : between pipes
    let pipes = 0;
    for (let i = 0; i < t.length; i++) if (t.charAt(i) === "|") pipes++;
    return pipes >= 2 && t.indexOf("-") !== -1;
  }
  private _looksLikeMdRow(line: string): boolean {
    return line.indexOf("|") !== -1;
  }
  private _splitMdRow(line: string): string[] {
    // split on |, trim each cell
    const raw: string[] = [];
    let cur = "",
      i = 0;
    for (i = 0; i < line.length; i++) {
      const ch = line.charAt(i);
      if (ch === "|") {
        raw.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    raw.push(cur.trim());
    // remove empty first/last if the row starts/ends with |
    if (raw.length && raw[0] === "") raw.shift();
    if (raw.length && raw[raw.length - 1] === "") raw.pop();
    // normalize to lowercase for header detection later only
    for (let j = 0; j < raw.length; j++) raw[j] = raw[j];
    return raw;
  }
  private _cell(cells: string[], idx: number): string {
    if (idx < 0 || idx >= cells.length) return "";
    return cells[idx] || "";
  }
}
