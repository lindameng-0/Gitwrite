import { createClient } from "@supabase/supabase-js";
import { parseProject } from "./storage";
import type { Project, StoredProject } from "./model";

const url = import.meta.env.VITE_SUPABASE_URL;
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;
export const cloud = url && key ? createClient(url, key) : null;
export type CloudProject = StoredProject & {
  role: "owner" | "editor" | "viewer";
};
export async function listCloud(): Promise<CloudProject[]> {
  if (!cloud)
    throw new Error("Configure Supabase before connecting a team workspace.");
  const { data, error } = await cloud.rpc("gw_list_projects");
  if (error)
    throw new Error(
      `Team workspace unavailable: ${error.message}. See README for database setup.`,
    );
  return (data ?? []).map(
    (row: { state: unknown; version: number; role: CloudProject["role"] }) => ({
      project: parseProject(row.state),
      version: row.version,
      role: row.role,
    }),
  );
}
export async function createCloud(project: Project): Promise<StoredProject> {
  if (!cloud) throw new Error("Cloud is not configured.");
  const { data, error } = await cloud.rpc("gw_create_project", {
    p_state: project,
  });
  if (error) throw new Error(error.message);
  return { project, version: Number(data) };
}
export async function saveCloud(
  project: Project,
  expected: number,
): Promise<StoredProject> {
  if (!cloud) throw new Error("Cloud is not configured.");
  const { data, error } = await cloud.rpc("gw_save_project", {
    p_id: project.id,
    p_expected: expected,
    p_state: project,
  });
  if (error)
    throw new Error(
      error.message.includes("stale_revision")
        ? "Someone saved a newer revision. Refresh and retry; your unsaved writing is kept here."
        : error.message,
    );
  return { project, version: Number(data) };
}
