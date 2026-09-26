import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Clock3,
  GitPullRequest,
  MessageSquare,
  X,
} from "lucide-react";
import {
  accept,
  applyChanges,
  blockText,
  compare,
  copy,
  restore,
  type Block,
  type Change,
  type Chapter,
  type Project,
  type Resolution,
} from "./model";
export type Commit = (fn: (p: Project) => void) => Promise<void>;
const date = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <header>
        <h2>{title}</h2>
        <button aria-label="Close dialog" onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
function describe(value: unknown, kind: Change["kind"]) {
  if (value === null) return "Not present";
  if (kind === "block") return blockText(value as Block) || "(Empty paragraph)";
  if (kind === "chapter")
    return `${(value as Chapter).title}\n\n${(value as Chapter).blocks.map(blockText).join("\n\n")}`;
  if (kind === "order") return "Chapter or paragraph order changed";
  return String(value);
}
export function Review({
  project,
  commit,
  author,
  editable,
  onError,
}: {
  project: Project;
  commit: Commit;
  author: string;
  editable: boolean;
  onError: (error: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>(
    {},
  );
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const proposal = project.proposals.find((p) => p.id === selected);
  const fingerprint = JSON.stringify(project.chapters);
  useEffect(() => {
    setResolutions({});
    setPreview(false);
  }, [selected, fingerprint]);
  const changes = proposal
    ? compare(proposal.base, proposal.chapters, project.chapters)
    : [];
  const unresolved = changes.filter(
    (c) => c.conflict && !resolutions[c.id],
  ).length;
  const applied = changes.filter((c) => resolutions[c.id] !== "current").length;
  const act = async (fn: (p: Project) => void) => {
    setBusy(true);
    try {
      await commit(fn);
      setSelected(null);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (!proposal)
    return (
      <section className="workspace-section">
        <div className="section-heading">
          <div>
            <p className="subtle">Make room for a better version</p>
            <h1>Review changes</h1>
          </div>
          <GitPullRequest size={30} strokeWidth={1.3} />
        </div>
        <p className="intro">
          Thoughtful changes, all in one place. Review a proposal before it
          becomes part of your manuscript.
        </p>
        {!project.proposals.length && (
          <div className="empty">
            <GitPullRequest size={35} />
            <h2>No proposals yet</h2>
            <p>
              Try an alternate draft, make your changes, then propose them here.
            </p>
          </div>
        )}
        {project.proposals.map((p) => (
          <button
            className="proposal-row"
            key={p.id}
            onClick={() => setSelected(p.id)}
          >
            <span className={`proposal-icon ${p.status}`}>
              <GitPullRequest size={20} />
            </span>
            <span>
              <strong>{p.title}</strong>
              <p>{p.note || "Proposed manuscript changes"}</p>
              <small>
                {p.author} · {date(p.createdAt)}
              </small>
            </span>
            <span className="status-pill">
              {p.status === "open" ? "Needs review" : p.status}
            </span>
          </button>
        ))}
      </section>
    );
  return (
    <section className="workspace-section review-detail">
      <button className="back-link" onClick={() => setSelected(null)}>
        <ArrowLeft size={16} /> All proposals
      </button>
      <h1>{proposal.title}</h1>
      <p className="intro">{proposal.note}</p>
      <div className="review-summary">
        <span>{changes.length} changes</span>
        <span>
          {unresolved
            ? `${unresolved} overlapping changes need a decision`
            : "Ready to review"}
        </span>
        <span>From {proposal.author}</span>
      </div>
      {proposal.status !== "open" ? (
        <div className="notice">
          This proposal was {proposal.status}. Its submitted version is
          preserved in Drafts.
        </div>
      ) : (
        <>
          <div className="review-actions">
            <button
              onClick={() => setPreview(!preview)}
              disabled={unresolved > 0}
            >
              {preview ? "Show changes" : "Preview result"}
            </button>
            <button
              disabled={!editable || busy}
              onClick={() =>
                void act((p) => {
                  const found = p.proposals.find((x) => x.id === proposal.id);
                  if (!found || found.status !== "open")
                    throw new Error("Already reviewed.");
                  found.status = "declined";
                  const draft = p.drafts.find((d) => d.id === found.draftId);
                  if (draft) draft.status = "writing";
                })
              }
            >
              Return to draft
            </button>
            <button
              className="primary"
              disabled={!editable || busy || unresolved > 0 || !applied}
              onClick={() => {
                const expected = copy(project.chapters);
                void act((p) =>
                  accept(p, proposal.id, expected, resolutions, author),
                );
              }}
            >
              <CheckCheck size={17} /> Apply {applied} changes
            </button>
          </div>
          {preview ? (
            <div className="preview-document">
              {applyChanges(project.chapters, changes, resolutions).map((c) => (
                <article key={c.id}>
                  <h2>{c.title}</h2>
                  {c.blocks.map((b) => (
                    <p key={b.id}>{blockText(b)}</p>
                  ))}
                </article>
              ))}
            </div>
          ) : (
            changes.map((change, i) => (
              <article
                className={`change ${change.conflict ? "conflict" : ""}`}
                key={change.id}
              >
                <header>
                  <span>
                    {i + 1}. {change.chapterTitle}
                  </span>
                  <span>
                    {change.conflict
                      ? "Both versions changed this passage"
                      : change.kind === "title"
                        ? "Title change"
                        : change.after === null
                          ? "Deletion"
                          : change.before === null
                            ? "Addition"
                            : "Revision"}
                  </span>
                </header>
                <div className="comparison">
                  <div>
                    <small>Current manuscript</small>
                    <p>{describe(change.current, change.kind)}</p>
                  </div>
                  <div>
                    <small>Proposed</small>
                    <p>{describe(change.after, change.kind)}</p>
                  </div>
                </div>
                {change.conflict && (
                  <details>
                    <summary>Show shared starting version</summary>
                    <p>{describe(change.before, change.kind)}</p>
                  </details>
                )}
                <footer>
                  <label>
                    <input
                      type="radio"
                      name={change.id}
                      checked={resolutions[change.id] === "current"}
                      onChange={() =>
                        setResolutions((r) => ({
                          ...r,
                          [change.id]: "current",
                        }))
                      }
                    />{" "}
                    Keep current
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={change.id}
                      checked={
                        resolutions[change.id] === "proposed" ||
                        (!change.conflict && !resolutions[change.id])
                      }
                      onChange={() =>
                        setResolutions((r) => ({
                          ...r,
                          [change.id]: "proposed",
                        }))
                      }
                    />{" "}
                    Use proposed
                  </label>
                  {(change.kind === "block" || change.kind === "title") && (
                    <button
                      onClick={() =>
                        setResolutions((r) => ({
                          ...r,
                          [change.id]: {
                            text: describe(
                              change.after ?? change.current,
                              change.kind,
                            ),
                          },
                        }))
                      }
                    >
                      Write a resolution
                    </button>
                  )}
                </footer>
                {typeof resolutions[change.id] === "object" && (
                  <label className="manual-resolution">
                    Your resolution{" "}
                    <textarea
                      value={(resolutions[change.id] as { text: string }).text}
                      onChange={(e) =>
                        setResolutions((r) => ({
                          ...r,
                          [change.id]: { text: e.target.value },
                        }))
                      }
                    />
                    <small>
                      A written resolution uses plain text for this passage.
                    </small>
                  </label>
                )}
              </article>
            ))
          )}
        </>
      )}
    </section>
  );
}
export function History({
  project,
  target,
  commit,
  author,
  editable,
  onError,
}: {
  project: Project;
  target: string;
  commit: Commit;
  author: string;
  editable: boolean;
  onError: (e: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const revisions = project.history.filter((h) => h.target === target);
  const revision = revisions.find((h) => h.id === selected);
  const current =
    target === "main"
      ? project.chapters
      : (project.drafts.find((d) => d.id === target)?.chapters ?? []);
  const changes = revision ? compare(revision.chapters, current) : [];
  return (
    <section className="workspace-section">
      <div className="section-heading">
        <div>
          <p className="subtle">Nothing good has to be lost</p>
          <h1>Version history</h1>
        </div>
        <Clock3 size={29} strokeWidth={1.3} />
      </div>
      <p className="intro">
        Complete snapshots of{" "}
        {target === "main" ? "your manuscript" : "this alternate draft"}.
        Restoring adds a new version and keeps your history.
      </p>
      <div className="history-layout">
        <div className="timeline">
          {revisions.map((r) => (
            <button
              key={r.id}
              className={r.id === selected ? "selected" : ""}
              onClick={() => {
                setSelected(r.id);
                setConfirm(false);
              }}
            >
              <span
                className={`timeline-dot ${r.milestone ? "milestone" : ""}`}
              />
              <strong>{r.title}</strong>
              <small>
                {date(r.createdAt)} · {r.author}
              </small>
              {r.milestone && (
                <span className="milestone-label">Milestone</span>
              )}
            </button>
          ))}
        </div>
        <div className="revision-preview">
          {revision ? (
            <>
              <div className="section-heading">
                <div>
                  <h2>{revision.title}</h2>
                  <small>{changes.length} changes since this version</small>
                </div>
                <button
                  disabled={!editable || busy}
                  onClick={() => setConfirm(true)}
                >
                  Restore version
                </button>
              </div>
              {confirm && (
                <div className="notice">
                  <span>
                    Make this the current version? Your current writing will
                    remain in history.
                  </span>
                  <button
                    disabled={busy}
                    className="primary"
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await commit((p) => restore(p, revision.id, author));
                        setConfirm(false);
                      } catch (e) {
                        onError((e as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Restore
                  </button>
                  <button onClick={() => setConfirm(false)}>Cancel</button>
                </div>
              )}
              {revision.chapters.map((c) => (
                <article key={c.id}>
                  <h3>{c.title}</h3>
                  {c.blocks.map((b) => (
                    <p key={b.id}>{blockText(b)}</p>
                  ))}
                </article>
              ))}
            </>
          ) : (
            <div className="empty">
              <Clock3 size={30} />
              <h2>A record of your writing</h2>
              <p>Select a version to read it and see how much has changed.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
export function Comments({
  project,
  chapterId,
  target,
  quote,
  clearQuote,
  commit,
  author,
  editable,
  onError,
}: {
  project: Project;
  chapterId: string;
  target: string;
  quote: string;
  clearQuote: () => void;
  commit: Commit;
  author: string;
  editable: boolean;
  onError: (e: string) => void;
}) {
  const [text, setText] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const [busy, setBusy] = useState(false);
  const comments = project.comments.filter(
    (c) =>
      c.chapterId === chapterId &&
      c.target === target &&
      (showResolved || !c.resolved),
  );
  return (
    <aside className="comments-panel">
      <div className="section-heading">
        <h2>Conversation</h2>
        <MessageSquare size={18} />
      </div>
      <p className="subtle">
        Notes for this chapter. Select text to quote a passage.
      </p>
      <label className="checkbox-line">
        <input
          type="checkbox"
          checked={showResolved}
          onChange={(e) => setShowResolved(e.target.checked)}
        />{" "}
        Show resolved
      </label>
      {comments.map((c) => (
        <article
          className={`comment ${c.resolved ? "resolved" : ""}`}
          key={c.id}
        >
          <header>
            <span className="avatar">{c.author[0].toUpperCase()}</span>
            <div>
              <strong>{c.author}</strong>
              <small>{date(c.createdAt)}</small>
            </div>
          </header>
          {c.quote && <blockquote>{c.quote}</blockquote>}
          <p>{c.text}</p>
          <button
            disabled={!editable}
            onClick={() =>
              commit((p) => {
                const comment = p.comments.find((x) => x.id === c.id);
                if (comment) comment.resolved = !comment.resolved;
              }).catch((e) => onError(e.message))
            }
          >
            <Check size={14} /> {c.resolved ? "Reopen" : "Resolve"}
          </button>
        </article>
      ))}
      {!comments.length && (
        <div className="empty compact">
          <MessageSquare size={25} />
          <p>A fresh page for the conversation.</p>
        </div>
      )}
      {editable && (
        <form
          className="comment-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!text.trim()) return;
            setBusy(true);
            try {
              await commit((p) =>
                p.comments.push({
                  id: crypto.randomUUID(),
                  chapterId,
                  target,
                  quote,
                  text: text.trim(),
                  author,
                  createdAt: new Date().toISOString(),
                  resolved: false,
                }),
              );
              setText("");
              clearQuote();
            } catch (err) {
              onError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {quote && (
            <blockquote>
              {quote}
              <button
                type="button"
                aria-label="Remove quoted text"
                onClick={clearQuote}
              >
                <X size={14} />
              </button>
            </blockquote>
          )}
          <label htmlFor="comment-text">Add a note</label>
          <textarea
            id="comment-text"
            placeholder="What are you thinking?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />
          <button className="primary" disabled={!text.trim() || busy}>
            Post note
          </button>
        </form>
      )}
    </aside>
  );
}
