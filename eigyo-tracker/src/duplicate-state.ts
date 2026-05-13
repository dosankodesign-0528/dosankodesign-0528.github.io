import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { DuplicateGroup } from "./duplicates.js";

// 「前回検知済みの重複グループ」を保存して、新規発生時だけ通知するための状態ファイル。
// GH Actions が変更があれば自動 commit する。

const __dirname = dirname(fileURLToPath(import.meta.url));
export const STATE_PATH = join(__dirname, "..", "duplicate-state.json");

interface DuplicateState {
  schemaVersion: 1;
  lastCheckedAt: string;
  /** グループの「メンバー pageId のソート済み文字列」セット */
  knownGroupKeys: string[];
}

function groupKey(g: DuplicateGroup): string {
  return [...g.members.map((m) => m.pageId)].sort().join("|");
}

export function loadState(): DuplicateState {
  if (!existsSync(STATE_PATH)) {
    return { schemaVersion: 1, lastCheckedAt: new Date(0).toISOString(), knownGroupKeys: [] };
  }
  try {
    return JSON.parse(readFileSync(STATE_PATH, "utf8"));
  } catch {
    return { schemaVersion: 1, lastCheckedAt: new Date(0).toISOString(), knownGroupKeys: [] };
  }
}

export function saveState(groups: DuplicateGroup[]): boolean {
  const current = new Set(groups.map(groupKey));
  const prev = new Set(loadState().knownGroupKeys);
  const same = prev.size === current.size && [...current].every((k) => prev.has(k));
  if (same) return false;
  const next: DuplicateState = {
    schemaVersion: 1,
    lastCheckedAt: new Date().toISOString(),
    knownGroupKeys: [...current].sort(),
  };
  writeFileSync(STATE_PATH, JSON.stringify(next, null, 2) + "\n", "utf8");
  return true;
}

export function findNewGroups(groups: DuplicateGroup[]): DuplicateGroup[] {
  const prev = new Set(loadState().knownGroupKeys);
  return groups.filter((g) => !prev.has(groupKey(g)));
}
