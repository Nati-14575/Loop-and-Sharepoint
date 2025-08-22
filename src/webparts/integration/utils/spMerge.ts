// Merge helpers: normalize items and merge by a key from each list
export type AnyItem = Record<string, any>;

export function normalizeKeys<T extends AnyItem>(item: T) {
  // optional: make keys case-insensitive-safe
  return Object.keys(item).reduce<AnyItem>((acc, k) => {
    acc[k]; // keep original case to avoid breaking SP fields
    acc[k] = item[k];
    return acc;
  }, {});
}

export type MergeStrategy = "preferA" | "preferB" | "preferDefined";

export function mergeRecords(
  a: AnyItem | undefined,
  b: AnyItem | undefined,
  strategy: MergeStrategy = "preferDefined"
) {
  if (!a) return b ?? {};
  if (!b) return a ?? {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out: AnyItem = {};
  keys.forEach((k) => {
    const av = a[k];
    const bv = b[k];
    switch (strategy) {
      case "preferA":
        out[k] = av !== undefined ? av : bv;
        break;
      case "preferB":
        out[k] = bv !== undefined ? bv : av;
        break;
      default:
        out[k] = av !== undefined ? av : bv; // preferDefined: first defined
    }
  });
  return out;
}

export function mergeByKey(
  listA: AnyItem[],
  listB: AnyItem[],
  keyA: string,
  keyB: string,
  strategy: MergeStrategy = "preferDefined"
) {
  const mapB = new Map<string | number, AnyItem>();
  listB.forEach((b) => {
    const kb = (b?.[keyB] ?? "").toString();
    if (!kb) return;
    mapB.set(kb, b);
  });

  const merged: AnyItem[] = [];
  const seen = new Set<string | number>();

  // Merge where keys match
  listA.forEach((a) => {
    const ka = (a?.[keyA] ?? "").toString();
    const pair = ka ? mapB.get(ka) : undefined;
    if (pair) {
      merged.push({
        __source: ["A", "B"],
        ...mergeRecords(normalizeKeys(a), normalizeKeys(pair), strategy),
      });
      seen.add(ka);
    } else {
      merged.push({ __source: ["A"], ...normalizeKeys(a) });
    }
  });

  // Append B-only
  listB.forEach((b) => {
    const kb = (b?.[keyB] ?? "").toString();
    if (!kb || seen.has(kb)) return;
    merged.push({ __source: ["B"], ...normalizeKeys(b) });
  });

  return merged;
}
