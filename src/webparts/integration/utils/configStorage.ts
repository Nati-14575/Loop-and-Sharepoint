const STORAGE_PREFIX = "config_";
export interface SettingConfig {
  listTitle: string;
  titleColumnKey: string;
  descCols: string[];
  acCols: string[];
  businessPocCol: string;
}
// // Save a single config
export function saveConfig(cfg: SettingConfig) {
  if (!cfg.listTitle) throw new Error("Config must have an id");
  localStorage.setItem(STORAGE_PREFIX + cfg.listTitle, JSON.stringify(cfg));
}

// // Load a single config
export function loadConfig(listTitle: string): SettingConfig | null {
  const raw = localStorage.getItem(STORAGE_PREFIX + listTitle);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SettingConfig;
  } catch {
    return null;
  }
}
