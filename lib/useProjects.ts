"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProjectRow } from "./types";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function genId(): string {
  return "p-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function useProjects(seed: ProjectRow[]) {
  const [projects, setProjects] = useState<ProjectRow[]>(seed);
  const [loading, setLoading] = useState(false);
  const [storageOk, setStorageOk] = useState(true);

  // Load latest data from MySQL database API
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/projects");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setProjects(json.data);
          setStorageOk(true);
        }
      }
    } catch (err) {
      console.error("Failed to load projects from MySQL API:", err);
      setStorageOk(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const addProject = useCallback(async (input: Omit<ProjectRow, "id">) => {
    const row: ProjectRow = { ...input, id: genId() };
    // Optimistic UI update
    setProjects((prev) => [row, ...prev]);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
      if (!res.ok) {
        throw new Error("Failed to insert into database");
      }
      setStorageOk(true);
    } catch (err) {
      console.error("Error saving project to database:", err);
      setStorageOk(false);
    }
    return row;
  }, []);

  const updateProject = useCallback(
    async (id: string, patch: Partial<Omit<ProjectRow, "id">>) => {
      let finalStatusUpdatedAt = patch.status_updated_at;

      // Optimistic update
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          const next = { ...p, ...patch };
          if (
            patch.status !== undefined &&
            patch.status !== p.status &&
            patch.status_updated_at === undefined
          ) {
            next.status_updated_at = todayISO();
            finalStatusUpdatedAt = next.status_updated_at;
          }
          return next;
        })
      );

      try {
        const payload = {
          ...patch,
          ...(finalStatusUpdatedAt !== undefined
            ? { status_updated_at: finalStatusUpdatedAt }
            : {}),
        };

        const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error("Failed to update in database");
        }
        setStorageOk(true);
      } catch (err) {
        console.error("Error updating project in database:", err);
        setStorageOk(false);
      }
    },
    []
  );

  const deleteProject = useCallback(async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));

    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete from database");
      }
      setStorageOk(true);
    } catch (err) {
      console.error("Error deleting project in database:", err);
      setStorageOk(false);
    }
  }, []);

  const resetToSeed = useCallback(async () => {
    setProjects(seed);
    await fetchProjects();
  }, [seed, fetchProjects]);

  return {
    projects,
    loading,
    addProject,
    updateProject,
    deleteProject,
    resetToSeed,
    storageOk,
  };
}

export { todayISO };
