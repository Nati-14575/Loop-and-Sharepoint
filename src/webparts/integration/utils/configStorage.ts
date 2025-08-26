// utils/configStorage.ts

import { UserListConfig } from "./dynamicConfig";

const STORAGE_PREFIX = "config_";
export interface SettingConfig {
  listTitle: string;
  titleColumnKey: string;
  descCols: string[];
  acCols: string[];
  businessPocCol: string;
}
// Save a single config
export function saveConfig(cfg: SettingConfig) {
  if (!cfg.listTitle) throw new Error("Config must have an id");
  localStorage.setItem(STORAGE_PREFIX + cfg.listTitle, JSON.stringify(cfg));
}

// Load a single config
export function loadConfig(listTitle: string): SettingConfig | null {
  const raw = localStorage.getItem(STORAGE_PREFIX + listTitle);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SettingConfig;
  } catch {
    return null;
  }
}

export function deleteConfig(listTitle: string) {
  localStorage.removeItem(STORAGE_PREFIX + listTitle);
}

// Load all configs
export function loadAllConfigs(): UserListConfig[] {
  if (localStorage.getItem("listConfigs"))
    return JSON.parse(
      localStorage.getItem("listConfigs") as string
    ) as UserListConfig[];
  else return [];
}

// Load all configs
export function loadAllBackLogConfigs(): SettingConfig[] {
  const configs: SettingConfig[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.indexOf(STORAGE_PREFIX) === 0) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          configs.push(JSON.parse(raw));
        } catch {
          // skip invalid
        }
      }
    }
  }
  return configs;
}
