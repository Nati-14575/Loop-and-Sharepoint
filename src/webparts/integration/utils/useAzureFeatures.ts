// hooks/useAzureFeatures.ts
import * as React from "react";
import { AzureConfig, b64 } from "./azureDevopsFeatures";

type WiqlResponse = { workItems: Array<{ id: number }> };
type WorkItemBatch = {
  value: Array<{ id: number; fields: Record<string, any> }>;
};

const uniq = (arr: string[]) =>
  arr.filter((v, i, a) => v && a.indexOf(v) === i);

async function fetchAzureFeatureNames(cfg: AzureConfig): Promise<string[]> {
  const { org, project, team, token, top = 200 } = cfg;
  if (project) {
    const scope = `${encodeURIComponent(org)}/${encodeURIComponent(project)}`;
    const base = `https://dev.azure.com/${scope}/${
      team ? encodeURIComponent(team) + "/" : ""
    }_apis`;

    const wiql = `
    Select [System.Id]
    From WorkItems
    Where [System.TeamProject] = '${project.replace(/'/g, "''")}'
      And [System.WorkItemType] = 'Feature'
      And [System.State] <> 'Removed'
    Order By [System.ChangedDate] Desc
  `.trim();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = "Basic " + b64(":" + token);

    // 1) WIQL → IDs
    const wiqlRes = await fetch(`${base}/wit/wiql?api-version=7.0`, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: wiql }),
    });
    if (!wiqlRes.ok) {
      const msg = await wiqlRes.text().catch(() => "");
      throw new Error(`WIQL failed: ${wiqlRes.status} ${msg}`);
    }
    const wiqlData = (await wiqlRes.json()) as WiqlResponse;
    const ids = (wiqlData.workItems || []).map((w) => w.id).slice(0, top);

    if (!ids.length) return [];

    // 2) Fetch work items in chunks (<=200 per call)
    const chunks: number[][] = [];
    {
      const size = 200;
      for (let i = 0; i < ids.length; i += size)
        chunks.push(ids.slice(i, i + size));
    }

    const titles: string[] = [];
    for (const chunk of chunks) {
      const url =
        `${base}/wit/workitems?ids=${chunk.join(",")}` +
        `&fields=${encodeURIComponent("System.Title")}` +
        `&api-version=7.0`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`Work items fetch failed: ${res.status} ${msg}`);
      }
      const data = (await res.json()) as WorkItemBatch;
      const batchTitles = (data.value || [])
        .map((it) => String(it.fields?.["System.Title"] ?? "").trim())
        .filter((s) => s.length > 0);
      // push while preserving order
      for (const t of batchTitles) titles.push(t);
    }

    return uniq(titles);
  } else {
    return [];
  }
}

export function useAzureFeatures(cfg?: AzureConfig) {
  const [data, setData] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!cfg || !cfg.org || !cfg.project) return;
    try {
      setLoading(true);
      setError(null);
      const names = await fetchAzureFeatureNames(cfg);
      setData(names);
    } catch (e: any) {
      setError(
        e?.message ? String(e.message) : "Failed to load Azure features"
      );
    } finally {
      setLoading(false);
    }
  }, [cfg?.org, cfg?.project, cfg?.team, cfg?.token, cfg?.top]);

  React.useEffect(() => {
    load();
  }, [load]);

  return {
    data, // string[] of unique Feature titles
    loading,
    error,
    refresh: load,
    setData, // in case you want to seed/override manually
  };
}

// utils/useAzureFeatures.ts (append these exports)
import type { AzureFeature } from "./azureDevopsFeatures";

async function fetchAzureFeaturesWithIds(
  cfg: AzureConfig
): Promise<AzureFeature[] | null> {
  const { org, project, team, token, top = 200 } = cfg;
  if (project) {
    const scope = `${encodeURIComponent(org)}/${encodeURIComponent(project)}`;
    const base = `https://dev.azure.com/${scope}/${
      team ? encodeURIComponent(team) + "/" : ""
    }_apis`;

    const wiql = `
    Select [System.Id]
    From WorkItems
    Where [System.TeamProject] = '${project.replace(/'/g, "''")}'
      And [System.WorkItemType] = 'Feature'
      And [System.State] <> 'Removed'
    Order By [System.ChangedDate] Desc
  `.trim();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = "Basic " + b64(":" + token);

    const wiqlRes = await fetch(`${base}/wit/wiql?api-version=7.0`, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: wiql }),
    });
    if (!wiqlRes.ok) throw new Error(`WIQL failed: ${wiqlRes.status}`);

    const wiqlData = await wiqlRes.json();
    const ids: number[] = (wiqlData.workItems || [])
      .map((w: any) => w.id)
      .slice(0, top);
    if (!ids.length) return [];

    const res = await fetch(
      `${base}/wit/workitems?ids=${ids.join(",")}&fields=${encodeURIComponent(
        "System.Title"
      )}&api-version=7.0`,
      { headers }
    );
    if (!res.ok) throw new Error(`Work items fetch failed: ${res.status}`);

    const data = await res.json();
    return (data.value || []).map((it: any) => ({
      id: it.id as number,
      title: String(it.fields?.["System.Title"] ?? "").trim(),
    }));
  } else {
    return null;
  }
}

export function useAzureFeaturesWithIds(cfg?: AzureConfig) {
  const [features, setFeatures] = React.useState<AzureFeature[] | null>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!cfg || !cfg.org || !cfg.project) return;
    try {
      setLoading(true);
      setError(null);
      const list = await fetchAzureFeaturesWithIds(cfg);
      setFeatures(list);
    } catch (e: any) {
      setError(e?.message || "Failed to load Azure features");
    } finally {
      setLoading(false);
    }
  }, [cfg?.org, cfg?.project, cfg?.team, cfg?.token, cfg?.top]);

  React.useEffect(() => {
    load();
  }, [load]);

  const titles = React.useMemo(() => features?.map((f) => f.title), [features]);
  const idByTitle = React.useMemo(() => {
    if (features) {
      const m: Record<string, number> = {};
      for (const f of features) m[f.title] = f.id;
      return m;
    }
  }, [features]);

  return {
    features,
    titles,
    idByTitle,
    loading,
    error,
    refresh: load,
    setFeatures,
  };
}
