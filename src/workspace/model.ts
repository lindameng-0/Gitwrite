import type { JSONContent } from "@tiptap/react";

export type Block = { id: string; node: JSONContent };
export type Chapter = { id: string; title: string; blocks: Block[] };
export type Draft = {
  id: string;
  name: string;
  author: string;
  base: Chapter[];
  chapters: Chapter[];
  createdAt: string;
  status: "writing" | "proposed" | "applied" | "archived";
};
export type Proposal = {
  id: string;
  draftId: string;
  title: string;
  note: string;
  author: string;
  base: Chapter[];
  chapters: Chapter[];
  createdAt: string;
  status: "open" | "applied" | "declined";
};
export type Revision = {
  id: string;
  target: string;
  title: string;
  author: string;
  createdAt: string;
  chapters: Chapter[];
  milestone: boolean;
};
export type Comment = {
  id: string;
  chapterId: string;
  target: string;
  quote: string;
  text: string;
  author: string;
  createdAt: string;
  resolved: boolean;
};
export type Project = {
  schema: 2;
  id: string;
  title: string;
  description: string;
  chapters: Chapter[];
  drafts: Draft[];
  proposals: Proposal[];
  history: Revision[];
  comments: Comment[];
};
export type StoredProject = { project: Project; version: number };
export type Change = {
  id: string;
  chapterId: string;
  chapterTitle: string;
  kind: "chapter" | "title" | "block" | "order";
  before: unknown;
  after: unknown;
  blockId?: string;
  afterId?: string;
  conflict: boolean;
  current: unknown;
};
export type Resolution = "current" | "proposed" | { text: string };
export const uid = () => crypto.randomUUID();
export const copy = <T>(value: T): T => structuredClone(value);
// JSONB and backup validation may reorder object keys. Order is meaningful for
// arrays (paragraphs), but must not manufacture conflicts for object properties.
export function equal(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) || Array.isArray(b))
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((v, i) => equal(v, b[i]))
    );
  const left = a as Record<string, unknown>,
    right = b as Record<string, unknown>;
  const keys = Object.keys(left).filter((k) => left[k] !== undefined);
  return (
    keys.length ===
      Object.keys(right).filter((k) => right[k] !== undefined).length &&
    keys.every((k) => equal(left[k], right[k]))
  );
}
export const textOf = (node: JSONContent): string =>
  node.text ??
  (node.type === "hardBreak"
    ? "\n"
    : (node.content ?? [])
        .map(textOf)
        .join(
          [
            "doc",
            "bulletList",
            "orderedList",
            "blockquote",
            "listItem",
          ].includes(node.type ?? "")
            ? "\n\n"
            : "",
        ));
export const blockText = (block: Block) => textOf(block.node);
export const wordCount = (chapters: Chapter[]) =>
  chapters
    .flatMap((c) => c.blocks.map(blockText))
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
export const paragraph = (text: string): Block => ({
  id: uid(),
  node: { type: "paragraph", content: text ? [{ type: "text", text }] : [] },
});
export const blankChapter = (title = "Untitled chapter"): Chapter => ({
  id: uid(),
  title,
  blocks: [paragraph("")],
});
export function record(
  project: Project,
  title: string,
  author: string,
  target = "main",
  milestone = false,
) {
  if (!title.trim()) throw new Error("Give this version a name.");
  const chapters =
    target === "main"
      ? project.chapters
      : project.drafts.find((d) => d.id === target)?.chapters;
  if (!chapters) throw new Error("This draft is no longer available.");
  project.history.unshift({
    id: uid(),
    target,
    title,
    author,
    createdAt: new Date().toISOString(),
    chapters: copy(chapters),
    milestone,
  });
}
export function createProject(title: string): Project {
  if (!title.trim()) throw new Error("Give your project a title.");
  const project: Project = {
    schema: 2,
    id: uid(),
    title,
    description: "A place for your next story.",
    chapters: [blankChapter("Chapter 1")],
    drafts: [],
    proposals: [],
    history: [],
    comments: [],
  };
  record(project, "Manuscript created", "You", "main", true);
  return project;
}
// An immutable base distinguishes proposed edits from unrelated work.
export function compare(
  base: Chapter[],
  proposed: Chapter[],
  current: Chapter[] = base,
): Change[] {
  const changes: Change[] = [];
  const add = (change: Omit<Change, "conflict">) =>
    changes.push({
      ...change,
      conflict:
        !equal(change.current, change.before) &&
        !equal(change.current, change.after),
    });
  for (const id of new Set([...base, ...proposed].map((c) => c.id))) {
    const b = base.find((c) => c.id === id),
      p = proposed.find((c) => c.id === id),
      c = current.find((c) => c.id === id);
    const common = {
      chapterId: id,
      chapterTitle: p?.title ?? b?.title ?? "Chapter",
    };
    if (!b || !p) {
      if (!equal(b, p))
        add({
          ...common,
          id: `chapter:${id}`,
          kind: "chapter",
          before: b ?? null,
          after: p ?? null,
          current: c ?? null,
          afterId: proposed[proposed.findIndex((x) => x.id === id) - 1]?.id,
        });
      continue;
    }
    if (!c && !equal(b, p)) {
      add({
        ...common,
        id: `chapter:${id}`,
        kind: "chapter",
        before: b,
        after: p,
        current: null,
      });
      continue;
    }
    if (b.title !== p.title)
      add({
        ...common,
        id: `title:${id}`,
        kind: "title",
        before: b.title,
        after: p.title,
        current: c?.title ?? null,
      });
    for (const blockId of new Set(
      [...b.blocks, ...p.blocks].map((x) => x.id),
    )) {
      const before = b.blocks.find((x) => x.id === blockId),
        after = p.blocks.find((x) => x.id === blockId),
        now = c?.blocks.find((x) => x.id === blockId);
      if (!equal(before, after))
        add({
          ...common,
          id: `block:${id}:${blockId}`,
          kind: "block",
          blockId,
          before: before ?? null,
          after: after ?? null,
          current: now ?? null,
          afterId:
            p.blocks[p.blocks.findIndex((x) => x.id === blockId) - 1]?.id,
        });
    }
    const shared = b.blocks
      .filter((x) => p.blocks.some((y) => y.id === x.id))
      .map((x) => x.id);
    const reordered = p.blocks
      .filter((x) => shared.includes(x.id))
      .map((x) => x.id);
    if (!equal(shared, reordered))
      add({
        ...common,
        id: `order:${id}`,
        kind: "order",
        before: shared,
        after: reordered,
        current:
          c?.blocks.filter((x) => shared.includes(x.id)).map((x) => x.id) ?? [],
      });
  }
  const commonIds = base
    .filter((c) => proposed.some((p) => p.id === c.id))
    .map((c) => c.id);
  const nextIds = proposed
    .filter((c) => commonIds.includes(c.id))
    .map((c) => c.id);
  if (!equal(commonIds, nextIds))
    add({
      id: "order:chapters",
      chapterId: "",
      chapterTitle: "Manuscript order",
      kind: "order",
      before: commonIds,
      after: nextIds,
      current: current.filter((c) => commonIds.includes(c.id)).map((c) => c.id),
    });
  return changes;
}
function reorder<T extends { id: string }>(items: T[], ids: string[]) {
  const existing = ids
    .map((id) => items.find((x) => x.id === id))
    .filter((x): x is T => !!x);
  let index = 0;
  return items.map((item) =>
    ids.includes(item.id) ? existing[index++] : item,
  );
}
export function applyChanges(
  current: Chapter[],
  changes: Change[],
  resolutions: Record<string, Resolution>,
): Chapter[] {
  let result = copy(current);
  for (const change of changes) {
    const resolution = resolutions[change.id];
    if (resolution === "current") continue;
    if (change.conflict && !resolution)
      throw new Error("Choose a resolution for every overlapping change.");
    if (change.kind === "chapter") {
      const chapter = change.after as Chapter | null;
      const index = result.findIndex((c) => c.id === change.chapterId);
      if (!chapter) result = result.filter((c) => c.id !== change.chapterId);
      else if (index >= 0) result[index] = copy(chapter);
      else
        result.splice(
          change.afterId
            ? result.findIndex((c) => c.id === change.afterId) + 1
            : 0,
          0,
          copy(chapter),
        );
      continue;
    }
    if (change.kind === "order" && !change.chapterId) {
      result = reorder(result, change.after as string[]);
      continue;
    }
    const chapter = result.find((c) => c.id === change.chapterId);
    if (!chapter)
      throw new Error(
        "A chapter was removed. Refresh the comparison before applying.",
      );
    if (change.kind === "title")
      chapter.title =
        typeof resolution === "object"
          ? resolution.text
          : (change.after as string);
    else if (change.kind === "order")
      chapter.blocks = reorder(chapter.blocks, change.after as string[]);
    else {
      let block = change.after as Block | null;
      if (typeof resolution === "object")
        block = { ...paragraph(resolution.text), id: change.blockId! };
      const index = chapter.blocks.findIndex((b) => b.id === change.blockId);
      if (!block)
        chapter.blocks = chapter.blocks.filter((b) => b.id !== change.blockId);
      else if (index >= 0) chapter.blocks[index] = copy(block);
      else
        chapter.blocks.splice(
          change.afterId
            ? chapter.blocks.findIndex((b) => b.id === change.afterId) + 1
            : 0,
          0,
          copy(block),
        );
    }
  }
  return result;
}
export function startDraft(
  project: Project,
  name: string,
  author: string,
  chapterId?: string,
) {
  if (!name.trim()) throw new Error("Give your alternate draft a name.");
  const chapters = chapterId
    ? project.chapters.filter((c) => c.id === chapterId)
    : project.chapters;
  if (chapterId && !chapters.length)
    throw new Error(
      "Choose a chapter from the working manuscript, or start with the entire manuscript.",
    );
  const draft: Draft = {
    id: uid(),
    name,
    author,
    base: copy(chapters),
    chapters: copy(chapters),
    status: "writing",
    createdAt: new Date().toISOString(),
  };
  project.drafts.unshift(draft);
  record(project, "Draft started", author, draft.id, true);
  return draft.id;
}
export function propose(
  project: Project,
  draftId: string,
  note: string,
  author: string,
) {
  const draft = project.drafts.find((d) => d.id === draftId);
  if (!draft || draft.status !== "writing")
    throw new Error("This draft is not open for editing.");
  if (!compare(draft.base, draft.chapters).length)
    throw new Error("Make a change to your draft before proposing it.");
  project.proposals.unshift({
    id: uid(),
    draftId,
    title: draft.name,
    note,
    author,
    base: copy(draft.base),
    chapters: copy(draft.chapters),
    createdAt: new Date().toISOString(),
    status: "open",
  });
  draft.status = "proposed";
}
export function accept(
  project: Project,
  proposalId: string,
  expected: Chapter[],
  resolutions: Record<string, Resolution>,
  author: string,
) {
  const proposal = project.proposals.find((p) => p.id === proposalId);
  if (!proposal || proposal.status !== "open")
    throw new Error("This proposal has already been reviewed.");
  if (!equal(project.chapters, expected))
    throw new Error(
      "The manuscript changed while you were reviewing. Review the updated comparison first.",
    );
  const changes = compare(proposal.base, proposal.chapters, project.chapters);
  if (changes.every((c) => resolutions[c.id] === "current"))
    throw new Error(
      "Select at least one proposed change, or decline this proposal.",
    );
  project.chapters = applyChanges(project.chapters, changes, resolutions);
  proposal.status = "applied";
  const draft = project.drafts.find((d) => d.id === proposal.draftId);
  if (draft) draft.status = "applied";
  record(project, `Applied: ${proposal.title}`, author, "main", true);
}
export function restore(project: Project, revisionId: string, author: string) {
  const revision = project.history.find((r) => r.id === revisionId);
  if (!revision) throw new Error("Revision not found.");
  if (revision.target === "main") project.chapters = copy(revision.chapters);
  else {
    const draft = project.drafts.find((d) => d.id === revision.target);
    if (!draft || draft.status !== "writing")
      throw new Error("Only an editable draft can be restored.");
    draft.chapters = copy(revision.chapters);
  }
  record(project, `Restored: ${revision.title}`, author, revision.target, true);
}
