import * as React from "react";
import { b64 } from "./azureDevopsFeatures";

export function useAzureTeams(org?: string, token?: string, project?: string) {
  const [teams, setTeams] = React.useState<
    { id: string; name: string }[] | undefined
  >();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchTeams = React.useCallback(async () => {
    if (!org || !project) {
      setTeams(undefined);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const scope = `${encodeURIComponent(org)}/${encodeURIComponent(project)}`;
      const base = `https://dev.azure.com/${scope}/_apis`;

      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      if (token) headers["Authorization"] = "Basic " + b64(":" + token);

      const res = await fetch(`${base}/teams?api-version=7.0`, { headers });

      if (!res.ok) {
        throw new Error(
          `Failed to fetch teams: ${res.status} ${res.statusText}`
        );
      }

      const data = await res.json();
      const items =
        data.value?.map((t: any) => ({
          id: t.id,
          name: t.name,
        })) ?? [];

      setTeams(items);
    } catch (err: any) {
      console.error("AzureTeams error:", err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [org, token, project]);

  React.useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return {
    teams,
    loading,
    error,
    refresh: fetchTeams,
  };
}
