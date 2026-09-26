import { z } from "zod";
import { type Project, type StoredProject } from "./model";

const nodeSchema: z.ZodType = z.lazy(() =>
  z.object({
    type: z.enum([
      "doc",
      "paragraph",
      "text",
      "heading",
      "bulletList",
      "orderedList",
      "listItem",
      "blockquote",
      "codeBlock",
      "horizontalRule",
      "hardBreak",
    ]),
    text: z.string().optional(),
    attrs: z.record(z.unknown()).optional(),
    marks: z
      .array(
        z.object({
          type: z.enum([
            "bold",
            "italic",
            "strike",
            "code",
            "underline",
            "link",
          ]),
          attrs: z.record(z.unknown()).optional(),
        }),
      )
      .optional(),
    content: z.array(nodeSchema).optional(),
  }),
);
const chapterSchema = z.object({
  id: z.string(),
  title: z.string(),
  blocks: z.array(z.object({ id: z.string(), node: nodeSchema })),
});
const chapters = z.array(chapterSchema);
const projectSchema = z.object({
  schema: z.literal(2),
  id: z.string(),
  title: z.string().min(1),
  description: z.string(),
  chapters,
  drafts: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      author: z.string(),
      base: chapters,
      chapters,
      createdAt: z.string(),
      status: z.enum(["writing", "proposed", "applied", "archived"]),
    }),
  ),
  proposals: z.array(
    z.object({
      id: z.string(),
      draftId: z.string(),
      title: z.string(),
      note: z.string(),
      author: z.string(),
      base: chapters,
      chapters,
      createdAt: z.string(),
      status: z.enum(["open", "applied", "declined"]),
    }),
  ),
  history: z.array(
    z.object({
      id: z.string(),
      target: z.string(),
      title: z.string(),
      author: z.string(),
      createdAt: z.string(),
      chapters,
      milestone: z.boolean(),
    }),
  ),
  comments: z.array(
    z.object({
      id: z.string(),
      chapterId: z.string(),
      target: z.string(),
      quote: z.string(),
      text: z.string(),
      author: z.string(),
      createdAt: z.string(),
      resolved: z.boolean(),
    }),
  ),
});
export function parseProject(value: unknown): Project {
  const p = projectSchema.parse(value) as Project;
  for (const list of [
    p.chapters,
    ...p.drafts.flatMap((d) => [d.chapters, d.base]),
    ...p.proposals.flatMap((d) => [d.chapters, d.base]),
    ...p.history.map((h) => h.chapters),
  ]) {
    if (new Set(list.map((c) => c.id)).size !== list.length)
      throw new Error("Duplicate chapter identities in backup.");
    for (const c of list)
      if (new Set(c.blocks.map((b) => b.id)).size !== c.blocks.length)
        throw new Error("Duplicate paragraph identities in backup.");
  }
  return p;
}
let dbPromise: Promise<IDBDatabase>;
function database() {
  return (dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open("gitwrite-v2", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("projects", { keyPath: "project.id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          "Browser storage is unavailable. Enable storage to use a local workspace.",
        ),
      );
  }));
}
export async function listLocal(): Promise<StoredProject[]> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction("projects").objectStore("projects").getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function saveLocal(
  project: Project,
  expected: number,
): Promise<StoredProject> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("projects", "readwrite");
    const store = tx.objectStore("projects");
    const get = store.get(project.id);
    let stale = false;
    const result = { project, version: expected + 1 };
    get.onsuccess = () => {
      if ((get.result?.version ?? 0) !== expected) {
        stale = true;
        tx.abort();
        return;
      }
      store.put(result);
    };
    tx.oncomplete = () => resolve(result);
    tx.onabort = () =>
      reject(
        new Error(
          stale
            ? "This workspace changed in another tab. Refresh and retry; your unsaved writing is kept here."
            : "Could not save to browser storage. Export a backup before closing.",
        ),
      );
    tx.onerror = () =>
      reject(
        new Error(
          "Storage is full or unavailable. Export a backup before closing.",
        ),
      );
  });
}
export function download(
  name: string,
  content: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
