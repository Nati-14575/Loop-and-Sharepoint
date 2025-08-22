export type AzureFeature = { id: number; title: string; areaPath?: string };

export type AzureConfig = {
  org: string; // e.g. "myorg"
  project: string; // e.g. "MyProject"
  team?: string; // optional team
  token: string; // PAT (recommend proxying via your backend)
  top?: number; // cap result count
};

export const b64 = (s: string) => {
  if (typeof btoa !== "undefined") {
    return btoa(s);
  }

  // Fallback implementation for Node.js and browsers
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let output = "";

  for (let i = 0; i < s.length; i += 3) {
    const a = s.charCodeAt(i);
    const b = s.charCodeAt(i + 1);
    const c = s.charCodeAt(i + 2);

    const enc1 = a >> 2;
    const enc2 = ((a & 3) << 4) | (b >> 4);
    const enc3 = isNaN(b) ? 64 : ((b & 15) << 2) | (c >> 6);
    const enc4 = isNaN(c) ? 64 : c & 63;

    output +=
      chars.charAt(enc1) +
      chars.charAt(enc2) +
      chars.charAt(enc3) +
      chars.charAt(enc4);
  }

  return output;
};
export async function fetchAzureFeatures(
  cfg: AzureConfig
): Promise<AzureFeature[]> {
  const { org, project, team, token, top = 200 } = cfg;

  const base = `https://dev.azure.com/${encodeURIComponent(
    org
  )}/${encodeURIComponent(project)}/${
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

  const auth = "Basic " + b64(":" + token);

  const wiqlRes = await fetch(`${base}/wit/wiql?api-version=7.0`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: auth },
    body: JSON.stringify({ query: wiql }),
  });
  if (!wiqlRes.ok) throw new Error(`WIQL failed: ${wiqlRes.status}`);

  const wiqlData = await wiqlRes.json();
  const ids: number[] = (wiqlData.workItems || [])
    .map((w: any) => w.id)
    .slice(0, top);
  if (!ids.length) return [];

  const fields = ["System.Id", "System.Title", "System.AreaPath"];
  const workRes = await fetch(
    `${base}/wit/workitems?ids=${ids.join(",")}&fields=${encodeURIComponent(
      fields.join(",")
    )}&api-version=7.0`,
    { headers: { Authorization: auth } }
  );
  if (!workRes.ok)
    throw new Error(`Work items fetch failed: ${workRes.status}`);

  const workData = await workRes.json();
  return (workData.value || []).map((it: any) => ({
    id: it.id,
    title: it.fields["System.Title"],
    areaPath: it.fields["System.AreaPath"],
  }));
}
