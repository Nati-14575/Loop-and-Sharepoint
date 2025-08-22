// utils/SharePointService.ts
import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { resolvePath } from "./resolve";
import type { BacklogRow } from "../types";
import { LIST_FIELD_CONFIG } from "./dynamicConfig";

/** helpers to combine multiple list columns into one string */
const toArr = (p?: string | string[]): string[] =>
  !p ? [] : Array.isArray(p) ? p : [p];

const stringify = (v: any): string => {
  if (v == null) return "";
  if (Array.isArray(v)) {
    const out: string[] = [];
    for (const item of v) {
      const s = stringify(item);
      if (s) out.push(s);
    }
    return out.join(", ");
  }
  if (typeof v === "object") {
    const o = v as any;
    const guess =
      o?.Title ??
      o?.Name ??
      o?.title ??
      o?.name ??
      o?.DisplayName ??
      o?.displayName;
    return guess != null ? String(guess) : JSON.stringify(o);
  }
  return String(v);
};

const combineFrom = (
  item: any,
  paths: string | string[] | undefined,
  joiner: string
): string => {
  const parts: string[] = [];
  for (const p of toArr(paths)) {
    const v = resolvePath(item, p, undefined);
    const s = stringify(v).trim();
    if (s) parts.push(s);
  }
  return parts.join(joiner).trim();
};

export class SharePointService {
  constructor(private ctx: WebPartContext) {}

  async getItems(): Promise<BacklogRow[]> {
    const all: BacklogRow[] = [];

    for (const cfg of LIST_FIELD_CONFIG) {
      // build select/expand (core + extras)
      const baseSelect = ["Id", "Title", "Created"];
      const select =
        [...baseSelect, ...(cfg.selectExtra ?? [])]
          .map((s) => encodeURIComponent(s))
          .join(",") || encodeURIComponent("Id,Title,Created");
      const expand = (cfg.expand ?? []).map(encodeURIComponent).join(",");

      const url =
        `${cfg.siteUrl}` +
        `/_api/web/lists/getbytitle('${encodeURIComponent(
          cfg.listTitle
        )}')/items` +
        `?$select=*,${select}` +
        (expand ? `&$expand=${expand}` : "");

      const res: SPHttpClientResponse = await this.ctx.spHttpClient.get(
        url,
        SPHttpClient.configurations.v1
      );
      if (!res.ok) {
        // soft-fail this list and continue
        // eslint-disable-next-line no-console
        console.warn("SP fetch failed", cfg.listTitle, res.status);
        continue;
      }
      const json = await res.json();

      const rows: BacklogRow[] = (json.value || []).map((it: any) => {
        const title = combineFrom(it, cfg.titlePath, "\n");
        const description = combineFrom(it, cfg.descriptionPath, "\n");
        const creator = combineFrom(it, cfg.creatorPath, "\n");

        return {
          id: String(it.Id),
          title, // 👈 combined per config
          description, // 👈 combined per config
          creator, // 👈 combined per config
          businessPoc: creator,
          created: it.Created,
          raw: it, // keep original SP item
          __source: cfg.listTitle, // tag which list it came from
        } as BacklogRow;
      });

      // avoid .flat() for older targets
      for (const r of rows) all.push(r);
    }

    return all;
  }
}
