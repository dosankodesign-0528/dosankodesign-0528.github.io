import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import type { Source } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SOURCES_PATH = resolve(__dirname, "..", "sources.json");

export function loadSources(): Source[] {
  const raw = readFileSync(SOURCES_PATH, "utf-8");
  const parsed = JSON.parse(raw) as Source[];
  return parsed.filter((s) => s.enabled);
}
