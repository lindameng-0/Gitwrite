import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { copy, type Project, type StoredProject } from "./model";
import { listLocal, saveLocal } from "./storage";
import { exampleProject } from "./seed";
import {
  cloud,
  createCloud,
  listCloud,
  saveCloud,
  type CloudProject,
} from "./cloud";

export function useWorkspace() {
  const [projects, setProjects] = useState<CloudProject[]>([]);
  const [selected, setSelected] = useState("");
  const [mode, setMode] = useState<"local" | "cloud">("local");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const refs = useRef({ projects, selected, mode });
  refs.current = { projects, selected, mode };
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const current = projects.find((p) => p.project.id === selected);
  const refresh = useCallback(async () => {
    const requestMode = refs.current.mode;
    const list =
      requestMode === "cloud"
        ? await listCloud()
        : (await listLocal()).map((p) => ({ ...p, role: "owner" as const }));
    if (refs.current.mode !== requestMode) return;
    setProjects((previous) =>
      list.map((incoming) => {
        const existing = previous.find(
          (p) => p.project.id === incoming.project.id,
        );
        return existing && existing.version > incoming.version
          ? { ...existing, role: incoming.role }
          : incoming;
      }),
    );
    setSelected((previous) =>
      list.some((p) => p.project.id === previous)
        ? previous
        : (list[0]?.project.id ?? ""),
    );
  }, []);
  useEffect(() => {
    const { data } = cloud?.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user ?? null),
    ) ?? { data: null };
    return () => data?.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setProjects([]);
    (async () => {
      if (mode === "local" && !(await listLocal()).length) {
        try {
          await saveLocal(exampleProject(), 0);
        } catch {
          /* Another tab may have initialized it. */
        }
      }
      if (alive) await refresh();
    })()
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [mode, refresh]);
  useEffect(() => {
    const timer = setInterval(
      () => {
        if (!busy) refresh().catch((e) => setError(e.message));
      },
      mode === "cloud" ? 5000 : 3000,
    );
    return () => clearInterval(timer);
  }, [busy, mode, refresh]);
  const commit = useCallback(
    (mutate: (project: Project) => void, projectId?: string): Promise<void> => {
      const capturedMode = refs.current.mode;
      const id = projectId || refs.current.selected;
      const task = async () => {
        setBusy(true);
        try {
          if (refs.current.mode !== capturedMode)
            throw new Error(
              "Workspace changed. Return to the previous workspace to save your recovered text.",
            );
          const entry = refs.current.projects.find((p) => p.project.id === id);
          if (!entry) throw new Error("Project is no longer available.");
          if (entry.role === "viewer")
            throw new Error("This project is read-only.");
          const project = copy(entry.project);
          mutate(project);
          const stored =
            capturedMode === "cloud"
              ? await saveCloud(project, entry.version)
              : await saveLocal(project, entry.version);
          const next = refs.current.projects.map((p) =>
            p.project.id === id ? { ...stored, role: p.role } : p,
          );
          refs.current.projects = next;
          setProjects(next);
        } finally {
          setBusy(false);
        }
      };
      const result = queue.current.then(task, task);
      queue.current = result.catch(() => {});
      return result;
    },
    [],
  );
  const addProject = async (project: Project) => {
    setBusy(true);
    try {
      const result: StoredProject =
        mode === "cloud"
          ? await createCloud(project)
          : await saveLocal(project, 0);
      setProjects((p) => [{ ...result, role: "owner" }, ...p]);
      setSelected(project.id);
    } finally {
      setBusy(false);
    }
  };
  return {
    projects,
    current,
    selected,
    setSelected,
    mode,
    setMode,
    user,
    loading,
    error,
    setError,
    busy,
    commit,
    addProject,
    refresh,
  };
}
