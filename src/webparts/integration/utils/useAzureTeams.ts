import * as React from "react";

export function useAzureTeams(org?: string, token?: string, project?: string) {
  const [teams, setTeams] = React.useState<{ name: string }[] | undefined>();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchTeams = React.useCallback(async () => {
    if (!org || !token || !project) {
      setTeams(undefined);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const auth = "Basic " + btoa(":" + token);
      const res = await fetch(
        `https://dev.azure.com/${encodeURIComponent(org)}/${encodeURIComponent(
          project
        )}/_apis/teams?api-version=7.0`,
        {
          headers: {
            Authorization: auth,
            Accept: "application/json",
          },
        }
      );

      if (!res.ok) {
        throw new Error(
          `Failed to fetch teams: ${res.status} ${res.statusText}`
        );
      }

      const data = await res.json();
      const items = data.value?.map((t: any) => ({ name: t.name })) ?? [];
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
