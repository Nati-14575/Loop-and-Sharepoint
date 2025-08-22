import * as React from "react";
import { b64 } from "./azureDevopsFeatures";

export type AzureProject = {
  id: string;
  name: string;
  state: string;
};

export async function fetchAzureProjects(
  org: string,
  token?: string
): Promise<AzureProject[]> {
  const base = `https://dev.azure.com/${encodeURIComponent(
    org
  )}/_apis/projects?api-version=7.0`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = "Basic " + b64(":" + token);

  const res = await fetch(base, { headers });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Project fetch failed: ${res.status} ${msg}`);
  }

  const json = await res.json();
  return (json.value || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    state: p.state,
  }));
}

export function useAzureProjects(org?: string, token?: string) {
  const [projects, setProjects] = React.useState<AzureProject[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!org) return;
    try {
      setLoading(true);
      setError(null);
      const result = await fetchAzureProjects(org, token);
      setProjects(result);
    } catch (e: any) {
      setError(
        e?.message ? String(e.message) : "Failed to load Azure projects"
      );
    } finally {
      setLoading(false);
    }
  }, [org, token]);

  React.useEffect(() => {
    load();
  }, [load]);

  return {
    projects,
    loading,
    error,
    refresh: load,
    setProjects, // optional: to override manually
  };
}
