import { BacklogRow } from "../../types";
import { resolvePath } from "../../utils/resolve";

const uniq = (arr: string[]) => {
  const seen: Record<string, boolean> = {};
  const result: string[] = [];
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (v && !seen[v]) {
      seen[v] = true;
      result.push(v);
    }
  }
  return result;
};

const escapeRegExp = (str: string) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// 🔹 flatten any value into string[]
function flattenValue(val: unknown): string[] {
  if (val == null) return [];

  if (Array.isArray(val)) {
    const out: string[] = [];
    for (let i = 0; i < val.length; i++) {
      const nested = flattenValue(val[i]);
      for (let j = 0; j < nested.length; j++) {
        out.push(nested[j]);
      }
    }
    return out;
  }

  if (typeof val === "object") {
    const o = val as any;
    return [
      o?.Title ??
        o?.Name ??
        o?.title ??
        o?.name ??
        o?.DisplayName ??
        o?.displayName ??
        JSON.stringify(o),
    ];
  }

  return [String(val).trim()];
}

// 🔹 merge multiple columns into a single string
export function buildFromColumns(row: BacklogRow, keys: string[]): string {
  if (!keys || keys.length === 0) return "";
  const parts: string[] = [];

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const v = resolvePath(row, key, undefined);
    if (v != null) {
      const flat = flattenValue(v);
      for (let j = 0; j < flat.length; j++) {
        parts.push(flat[j]);
      }
    }
  }

  return uniq(parts).join("\n");
}

// 🔹 build title
export function buildTitle(row: BacklogRow, titleColumnKey: string): string {
  return buildFromColumns(row, [titleColumnKey]);
}

// 🔹 build description
export function buildDescription(row: BacklogRow, descCols: string[]): string {
  return buildFromColumns(row, descCols || []);
}

// 🔹 build acceptance criteria
export function buildAcceptanceCriteria(
  row: BacklogRow,
  acCols: string[]
): string | undefined {
  if (!acCols || acCols.length === 0) return undefined;
  return buildFromColumns(row, acCols);
}

// 🔹 build feature names
export function buildFeatureNames(
  row: BacklogRow,
  opts: {
    source: string;
    azureFeatures?: string[];
    columnKey?: string;
    delimiter?: string;
  }
): string[] | undefined {
  if (opts.source === "azure") {
    const azure = opts.azureFeatures || [];
    const names: string[] = [];
    for (let i = 0; i < azure.length; i++) {
      const s = azure[i] ? azure[i].trim() : "";
      if (s && names.indexOf(s) === -1) {
        names.push(s);
      }
    }
    return names.length ? names : undefined;
  }

  // fallback to column mode
  if (!opts.columnKey) return undefined;
  const raw = resolvePath(row, opts.columnKey, undefined);
  if (raw == null) return undefined;

  if (Array.isArray(raw)) {
    let names: string[] = [];
    for (let i = 0; i < raw.length; i++) {
      const val = raw[i];
      const flat = flattenValue(val);
      for (let j = 0; j < flat.length; j++) {
        const s = flat[j].trim();
        if (s && names.indexOf(s) === -1) {
          names.push(s);
        }
      }
    }
    return names;
  }

  if (typeof raw === "object") {
    return flattenValue(raw);
  }

  const s = String(raw).trim();
  if (!s) return undefined;

  if (opts.delimiter) {
    const rx = new RegExp("\\s*" + escapeRegExp(opts.delimiter) + "\\s*");
    const parts = s.split(rx);
    const names: string[] = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (part && names.indexOf(part) === -1) {
        names.push(part);
      }
    }
    if (names.length > 1) return names;
  }

  return [s];
}
