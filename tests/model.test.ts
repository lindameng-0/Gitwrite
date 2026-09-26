import { test } from "node:test";
import assert from "node:assert/strict";
import {
  accept,
  applyChanges,
  compare,
  copy,
  createProject,
  equal,
  paragraph,
  propose,
  record,
  restore,
  startDraft,
} from "../src/workspace/model";
import { parseProject } from "../src/workspace/storage";

function fixture() {
  const p = createProject("Test manuscript");
  p.chapters[0].blocks = [
    paragraph("The tide came in."),
    paragraph("Mara waited by the harbor."),
  ];
  p.chapters.push({
    id: "second",
    title: "Chapter 2",
    blocks: [paragraph("Elias arrived.")],
  });
  p.history = [];
  record(p, "Before editing", "Author", "main", true);
  return p;
}
test("applying a scoped draft preserves unrelated chapter and paragraph edits", () => {
  const p = fixture(),
    id = startDraft(p, "New opening", "Writer", p.chapters[0].id);
  p.drafts[0].chapters[0].blocks[0].node = paragraph(
    "The tide had already turned.",
  ).node;
  propose(p, id, "A stronger opening", "Writer");
  p.chapters[0].blocks[1].node = paragraph("Mara waited in the rain.").node;
  p.chapters[1].title = "An unexpected visitor";
  const expected = copy(p.chapters);
  accept(p, p.proposals[0].id, expected, {}, "Editor");
  assert.equal(
    p.chapters[0].blocks[0].node.content![0].text,
    "The tide had already turned.",
  );
  assert.equal(
    p.chapters[0].blocks[1].node.content![0].text,
    "Mara waited in the rain.",
  );
  assert.equal(p.chapters[1].title, "An unexpected visitor");
  assert.equal(p.history[0].milestone, true);
});
test("overlapping edits require an explicit decision and can keep current text", () => {
  const p = fixture(),
    base = copy(p.chapters),
    proposed = copy(base);
  proposed[0].blocks[0].node = paragraph("Proposed ending").node;
  p.chapters[0].blocks[0].node = paragraph("Current ending").node;
  const changes = compare(base, proposed, p.chapters);
  assert.equal(changes[0].conflict, true);
  assert.throws(() => applyChanges(p.chapters, changes, {}), /resolution/);
  assert.deepEqual(
    applyChanges(p.chapters, changes, { [changes[0].id]: "current" }),
    p.chapters,
  );
  const result = applyChanges(p.chapters, changes, {
    [changes[0].id]: { text: "Together, a better ending." },
  });
  assert.equal(result[0].blocks[0].id, base[0].blocks[0].id);
  assert.equal(
    result[0].blocks[0].node.content![0].text,
    "Together, a better ending.",
  );
});
test("restoration preserves full formatting, identities, order, and previous history", () => {
  const p = fixture();
  p.chapters[0].blocks[0].node.content![0].marks = [{ type: "bold" }];
  record(p, "Formatted milestone", "Author", "main", true);
  const revision = copy(p.history[0]),
    length = p.history.length;
  p.chapters.reverse();
  p.chapters[0].blocks = [];
  restore(p, revision.id, "Author");
  assert.deepEqual(p.chapters, revision.chapters);
  assert.equal(p.history.length, length + 1);
  assert.deepEqual(p.history[1], revision);
});
test("submitted proposals are immutable copies; duplicate and stale acceptance fail", () => {
  const p = fixture(),
    id = startDraft(p, "Edit", "Writer");
  p.drafts[0].chapters[0].title = "Changed title";
  propose(p, id, "Title revision", "Writer");
  p.drafts[0].chapters[0].title = "Later mutation";
  assert.equal(p.proposals[0].chapters[0].title, "Changed title");
  const expected = copy(p.chapters);
  p.chapters[1].title = "Concurrent change";
  assert.throws(
    () => accept(p, p.proposals[0].id, expected, {}, "Editor"),
    /changed while/,
  );
  accept(p, p.proposals[0].id, copy(p.chapters), {}, "Editor");
  assert.throws(
    () => accept(p, p.proposals[0].id, copy(p.chapters), {}, "Editor"),
    /already been reviewed/,
  );
});
test("deleting a concurrently edited chapter is a conflict", () => {
  const p = fixture(),
    base = copy(p.chapters),
    proposed = [copy(base[1])];
  p.chapters[0].blocks.push(paragraph("Do not lose this paragraph."));
  const changes = compare(base, proposed, p.chapters);
  assert.equal(changes.find((c) => c.kind === "chapter")?.conflict, true);
  assert.throws(() => applyChanges(p.chapters, changes, {}));
});
test("new paragraphs retain order and existing unrelated insertions survive", () => {
  const p = fixture(),
    base = copy(p.chapters),
    proposed = copy(base);
  const a = paragraph("First new paragraph"),
    b = paragraph("Second new paragraph");
  proposed[0].blocks.splice(1, 0, a, b);
  const other = paragraph("An unrelated addition");
  p.chapters[0].blocks.push(other);
  const result = applyChanges(
    p.chapters,
    compare(base, proposed, p.chapters),
    {},
  );
  assert.deepEqual(
    result[0].blocks.map((b) => b.id),
    [base[0].blocks[0].id, a.id, b.id, base[0].blocks[1].id, other.id],
  );
});
test("reorders are preserved and a competing reorder requires review", () => {
  const p = fixture();
  p.chapters.push({ id: "third", title: "Third", blocks: [] });
  const base = copy(p.chapters),
    proposed = [base[2], base[0], base[1]];
  assert.deepEqual(
    applyChanges(base, compare(base, proposed), {}).map((c) => c.id),
    proposed.map((c) => c.id),
  );
  assert.equal(
    compare(base, proposed, [base[1], base[0], base[2]])[0].conflict,
    true,
  );
});
test("a backup round-trip preserves all content and rejects malformed identities", () => {
  const p = fixture();
  startDraft(p, "Alternative", "Writer");
  assert.ok(equal(parseProject(JSON.parse(JSON.stringify(p))), p));
  const bad = copy(p);
  bad.chapters.push(copy(bad.chapters[0]));
  assert.throws(() => parseProject(bad), /Duplicate chapter/);
  assert.throws(() => parseProject({ schema: 1, chapters: [] }));
});
test("an unchanged draft cannot be proposed", () => {
  const p = fixture(),
    id = startDraft(p, "Unchanged", "Writer");
  assert.throws(() => propose(p, id, "", "Writer"), /Make a change/);
});
