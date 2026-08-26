"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProjectRow } from "./types";

const STORAGE_KEY = "monitoring-proyek:projects:v1";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function genId(): string {
  return "p-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function isStorageAvailable(): boolean {
  try {
    const testKey = "__storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function useProjects(seed: ProjectRow[]) {
  const [projects, setProjects] = useState<ProjectRow[]>(seed);
  // `ready` is React state (not a ref) on purpose: setting it together with
  // setProjects() in the same effect batches both updates into a single
  // re-render, so the persist effect below only ever runs with a fully
  // up-to-date `projects` closure. Using a ref here previously caused a
  // race — the ref flipped to "hydrated" synchronously before React
  // re-rendered with the loaded data, so the persist effect could fire once
  // with the stale seed value and briefly overwrite saved edits in
  // localStorage.
  const [ready, setReady] = useState(false);
  // True once we've confirmed localStorage.setItem actually succeeds. If
  // it's false, edits still work for the current session but will NOT
  // survive a refresh/navigation (e.g. private browsing mode, storage
  // disabled by browser settings, storage quota exceeded).
  const [storageOk, setStorageOk] = useState(true);

  // Load any saved edits/additions from localStorage on mount (client only)
  useEffect(() => {
    if (!isStorageAvailable()) {
      setStorageOk(false);
      setReady(true);
      return;
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ProjectRow[];
        if (Array.isArray(parsed)) setProjects(parsed);
      }
    } catch {
      // ignore corrupt storage, fall back to seed
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist every change, but only once the initial load above has settled.
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      setStorageOk(true);
    } catch {
      // storage full or unavailable — edits still work for this session
      setStorageOk(false);
    }
  }, [projects, ready]);

  const addProject = useCallback((input: Omit<ProjectRow, "id">) => {
    const row: ProjectRow = { ...input, id: genId() };
    setProjects((prev) => [...prev, row]);
    return row;
  }, []);

  const updateProject = useCallback(
    (id: string, patch: Partial<Omit<ProjectRow, "id">>) => {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          const next = { ...p, ...patch };
          // If status changed and caller didn't explicitly set status_updated_at,
          // stamp today's date automatically.
          if (
            patch.status !== undefined &&
            patch.status !== p.status &&
            patch.status_updated_at === undefined
          ) {
            next.status_updated_at = todayISO();
          }
          return next;
        })
      );
    },
    []
  );

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const resetToSeed = useCallback(() => {
    setProjects(seed);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  return { projects, addProject, updateProject, deleteProject, resetToSeed, storageOk };
}

export { todayISO };
