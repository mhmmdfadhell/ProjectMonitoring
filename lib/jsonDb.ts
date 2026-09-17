import fs from "fs";
import path from "path";
import type { ProjectRow } from "./types";

const jsonFilePath = path.join(process.cwd(), "data", "monitoring.json");

export function readJsonData() {
  try {
    const raw = fs.readFileSync(jsonFilePath, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading monitoring.json:", e);
    return { projects: [], cashin: [], monthly_totals: {}, month_order: [] };
  }
}

export function writeJsonData(data: any) {
  try {
    fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing monitoring.json:", e);
  }
}

export function updateJsonProject(id: string, patch: Partial<ProjectRow>) {
  const data = readJsonData();
  let updated = false;
  if (Array.isArray(data.projects)) {
    data.projects = data.projects.map((p: ProjectRow) => {
      if (p.id === id) {
        updated = true;
        return { ...p, ...patch };
      }
      return p;
    });
    if (updated) {
      writeJsonData(data);
    }
  }
  return updated;
}

export function addJsonProject(row: ProjectRow) {
  const data = readJsonData();
  if (Array.isArray(data.projects)) {
    data.projects.unshift(row);
    writeJsonData(data);
  }
}

export function deleteJsonProject(id: string) {
  const data = readJsonData();
  if (Array.isArray(data.projects)) {
    data.projects = data.projects.filter((p: ProjectRow) => p.id !== id);
    writeJsonData(data);
  }
}
