export type AzureFeature = { id: number; title: string; areaPath?: string };

export type AzureConfig = {
  org: string; // e.g. "myorg"
  project?: string;
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
  cfg: AzureConfig,
  project: string
): Promise<AzureFeature[]> {
  const { org, team, token, top = 200 } = cfg;

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

export async function checkDuplicateFeature(
  cfg: AzureConfig,
  project: string,
  taskTitle: string
): Promise<void> {
  const features = await fetchAzureFeatures(cfg, project);

  const exists = features.some(
    (f) => f.title.trim().toLowerCase() === taskTitle.trim().toLowerCase()
  );

  if (exists) {
    throw new Error(
      `❌ A task with the title "${taskTitle}" already exists in the backlog.`
    );
  }
}

export async function checkDuplicateById(
  cfg: AzureConfig,
  project: string,
  featureId: number,
  taskTitle: string
): Promise<boolean> {
  const { org, team, token } = cfg;

  try {
    const base = `https://dev.azure.com/${encodeURIComponent(
      org
    )}/${encodeURIComponent(project)}/${
      team ? `${encodeURIComponent(team)}/` : ""
    }_apis`;

    const auth = "Basic " + btoa(":" + token);

    // 🔹 Step 1: Get all relations for the feature
    const res = await fetch(
      `${base}/wit/workitems/${featureId}?$expand=relations&api-version=7.1`,
      {
        headers: {
          Authorization: auth,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      throw new Error(
        `Failed to fetch feature: ${res.status} ${res.statusText}`
      );
    }

    const featureData = await res.json();

    if (!featureData.relations) {
      return false;
    }

    // 🔹 Step 2: Extract all child IDs (Hierarchy-Forward = children)
    const childIds = featureData.relations
      .filter(
        (relation: any) => relation.rel === "System.LinkTypes.Hierarchy-Forward"
      )
      .map((relation: any) => relation.url.split("/").pop())
      .filter(Boolean)
      .map((id: string) => parseInt(id, 10));

    if (childIds.length === 0) {
      return false;
    }

    // 🔹 Step 3: Fetch all children in one batch request
    const batchRes = await fetch(
      `${base}/wit/workitemsbatch?api-version=7.1-preview.3`,
      {
        method: "POST",
        headers: {
          Authorization: auth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: childIds,
          fields: [
            "System.Id",
            "System.Title",
            "System.State",
            "System.WorkItemType",
          ],
          errorPolicy: "Omit",
        }),
      }
    );

    if (!batchRes.ok) {
      throw new Error(
        `Failed to fetch child tasks: ${batchRes.status} ${batchRes.statusText}`
      );
    }

    const batchData = await batchRes.json();

    // 🔹 Step 4: Check for duplicate title
    const exists = (batchData.value || []).some((child: any) => {
      const fields = child.fields || {};
      return (
        fields["System.WorkItemType"] === "Task" &&
        fields["System.State"] !== "Removed" &&
        fields["System.Title"]?.trim().toLowerCase() ===
          taskTitle.trim().toLowerCase()
      );
    });

    return exists;
  } catch (error) {
    console.error("Error checking for duplicate task:", error);
    throw error;
  }
}
