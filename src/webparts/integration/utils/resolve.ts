export function resolvePath(obj: any, path: string, fallback?: any): any {
  if (!obj || !path) return fallback;
  // supports: a.b.c, a[0].b, raw.cells[1], etc.
  let cur = obj;
  let token = "";
  for (let i = 0; i < path.length; i++) {
    const ch = path[i];
    if (ch === "." || ch === "[" || ch === "]") {
      if (token) {
        cur = cur?.[token];
        token = "";
        if (cur === undefined || cur === null) return fallback;
      }
      if (ch === "[") {
        // parse index
        let j = i + 1,
          idxStr = "";
        while (j < path.length && path[j] !== "]") {
          idxStr += path[j++];
        }
        const idx = parseInt(idxStr, 10);
        if (isNaN(idx)) return fallback;
        cur = Array.isArray(cur) ? cur[idx] : cur?.[idx];
        if (cur === undefined || cur === null) return fallback;
        i = j; // skip to ']'
      }
    } else {
      token += ch;
    }
  }
  if (token) cur = cur?.[token];
  return cur === undefined ? fallback : cur;
}
