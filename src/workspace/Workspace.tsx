import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Download,
  Feather,
  FileText,
  GitBranch,
  GitPullRequest,
  History as HistoryIcon,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  Share2,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import {
  accept,
  blankChapter,
  blockText,
  compare,
  copy,
  createProject,
  paragraph,
  propose,
  record,
  startDraft,
  uid,
  wordCount,
  type Project,
} from "./model";
import { useWorkspace } from "./useWorkspace";
import { cloud, createCloud } from "./cloud";
import { download, parseProject } from "./storage";
import ChapterPane from "./ChapterPane";
import { Comments, History, Modal, Review } from "./Panels";
import "./workspace.css";

type View = "write" | "drafts" | "review" | "history";
type Dialog =
  | "draft"
  | "milestone"
  | "propose"
  | "project"
  | "share"
  | "export"
  | "account"
  | "settings"
  | null;
export default function Workspace() {
  const ws = useWorkspace();
  const [view, setView] = useState<View>("write");
  const [target, setTarget] = useState("main");
  const [chapterId, setChapterId] = useState("");
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [quote, setQuote] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [dirty, setDirty] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [name, setName] = useState(
    () => localStorage.getItem("gitwrite-name") || "You",
  );
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState<
    { user_id: string; email: string; role: string }[]
  >([]);
  const upload = useRef<HTMLInputElement>(null);
  const project = ws.current?.project;
  const role = ws.current?.role ?? "owner";
  const author =
    ws.mode === "cloud" ? ws.user?.email?.split("@")[0] || name : name;
  const draft = project?.drafts.find((d) => d.id === target);
  const chapters =
    target === "main" ? (project?.chapters ?? []) : (draft?.chapters ?? []);
  const chapter = chapters.find((c) => c.id === chapterId) ?? chapters[0];
  const editable =
    role !== "viewer" && (target === "main" || draft?.status === "writing");
  const pending =
    project?.proposals.filter((p) => p.status === "open").length ?? 0;
  const navigate = (fn: () => void) => {
    if (dirty) {
      ws.setError(
        "Your writing has not finished saving. Use “Save now” or keep it as an alternate draft before navigating.",
      );
      return;
    }
    fn();
    setQuote("");
    setSidebarOpen(false);
  };
  const open = (next: Dialog) => {
    setFormError("");
    setDialog(next);
  };
  const run = async (fn: () => Promise<void>, message?: string) => {
    try {
      await fn();
      if (message) setNotice(message);
    } catch (e) {
      ws.setError((e as Error).message);
    }
  };
  const submit = async (fn: () => Promise<void>, message?: string) => {
    setSubmitting(true);
    setFormError("");
    try {
      await fn();
      setDialog(null);
      if (message) setNotice(message);
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };
  useEffect(() => {
    setTarget("main");
    setChapterId("");
    setView("write");
    setDirty(false);
  }, [ws.selected]);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 4500);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  const setMode = ws.setMode;
  useEffect(() => {
    if (ws.mode === "cloud" && !ws.user && !ws.loading) {
      setMode("local");
    }
  }, [ws.user, ws.mode, ws.loading, setMode]);
  const refreshMembers = useCallback(async () => {
    if (!project || !cloud) return;
    const { data, error } = await cloud.rpc("gw_list_members", {
      p_id: project.id,
    });
    if (error) throw error;
    setMembers(data ?? []);
  }, [project]);
  useEffect(() => {
    if (dialog === "share" && ws.mode === "cloud")
      refreshMembers().catch((e) => setFormError(e.message));
  }, [dialog, ws.mode, refreshMembers]);
  const createChapter = () =>
    navigate(() => {
      void run(async () => {
        const c = blankChapter(`Chapter ${chapters.length + 1}`);
        await ws.commit((p) => {
          const list =
            target === "main"
              ? p.chapters
              : p.drafts.find((d) => d.id === target)!.chapters;
          list.push(c);
          record(p, `Added “${c.title}”`, author, target);
        });
        setChapterId(c.id);
        setView("write");
      });
    });
  const exportText = () =>
    chapters
      .map((c) => `# ${c.title}\n\n${c.blocks.map(blockText).join("\n\n")}`)
      .join("\n\n---\n\n");
  const changeChapterOrder = (direction: number) =>
    navigate(
      () =>
        void run(() =>
          ws.commit((p) => {
            const list =
              target === "main"
                ? p.chapters
                : p.drafts.find((d) => d.id === target)!.chapters;
            const index = list.findIndex((c) => c.id === chapter?.id);
            const next = index + direction;
            if (index < 0 || next < 0 || next >= list.length) return;
            [list[index], list[next]] = [list[next], list[index]];
            record(p, "Reordered chapters", author, target);
          }),
        ),
    );
  const importFile = async (file: File) => {
    if (file.size > 15_000_000)
      throw new Error("Choose a file smaller than 15 MB.");
    const text = await file.text();
    let next: Project;
    if (file.name.endsWith(".json")) {
      next = parseProject(JSON.parse(text));
      next.id = uid();
      next.title += " (imported)";
    } else {
      next = createProject(file.name.replace(/\.[^.]+$/, ""));
      next.chapters[0].title = "Imported writing";
      next.chapters[0].blocks = text.split(/\r?\n\s*\r?\n/).map(paragraph);
      next.history = [];
      record(next, "Imported writing", author, "main", true);
    }
    await ws.addProject(next);
    setNotice("Imported as a separate project.");
  };
  if (ws.loading)
    return (
      <div className="loading-screen">
        <Feather size={36} />
        <h1>Gitwrite</h1>
        <p>Opening your writing desk…</p>
      </div>
    );
  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <Feather size={22} />
          </span>
          <strong>gitwrite</strong>
          <button
            className="mobile-only"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <div className="project-switcher">
          <label htmlFor="project-select">Your writing desk</label>
          <div>
            <select
              id="project-select"
              value={ws.selected}
              onChange={(e) => navigate(() => ws.setSelected(e.target.value))}
            >
              {ws.projects.map((p) => (
                <option key={p.project.id} value={p.project.id}>
                  {p.project.title}
                </option>
              ))}
              {!ws.projects.length && <option value="">No projects yet</option>}
            </select>
            <ChevronDown size={15} />
          </div>
        </div>
        <nav className="main-nav" aria-label="Workspace">
          <button
            className={view === "write" ? "active" : ""}
            onClick={() => navigate(() => setView("write"))}
          >
            <BookOpen size={18} />
            Manuscript
          </button>
          <button
            className={view === "drafts" ? "active" : ""}
            onClick={() => navigate(() => setView("drafts"))}
          >
            <GitBranch size={18} />
            Alternate drafts
            <span>
              {project?.drafts.filter((d) => d.status === "writing").length ||
                ""}
            </span>
          </button>
          <button
            className={view === "review" ? "active" : ""}
            onClick={() => navigate(() => setView("review"))}
          >
            <GitPullRequest size={18} />
            Review changes
            {pending > 0 && <span className="count">{pending}</span>}
          </button>
          <button
            className={view === "history" ? "active" : ""}
            onClick={() => navigate(() => setView("history"))}
          >
            <HistoryIcon size={18} />
            Version history
          </button>
        </nav>
        <div className="outline-heading">
          <span>
            {target === "main" ? "Manuscript outline" : "Draft outline"}
          </span>
          <button
            title="Add chapter"
            aria-label="Add chapter"
            disabled={!project || !editable}
            onClick={createChapter}
          >
            <Plus size={17} />
          </button>
        </div>
        <label className="outline-search">
          <Search size={14} />
          <input
            aria-label="Search chapters"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a chapter"
          />
        </label>
        <div className="chapter-list">
          {chapters
            .filter((c) =>
              `${c.title} ${c.blocks.map(blockText).join(" ")}`
                .toLowerCase()
                .includes(search.toLowerCase()),
            )
            .map((c) => (
              <button
                key={c.id}
                className={
                  chapter?.id === c.id && view === "write" ? "selected" : ""
                }
                onClick={() =>
                  navigate(() => {
                    setChapterId(c.id);
                    setView("write");
                  })
                }
              >
                <span className="chapter-number">
                  {String(chapters.indexOf(c) + 1).padStart(2, "0")}
                </span>
                <span>{c.title || "Untitled chapter"}</span>
                {chapter?.id === c.id && <span className="chapter-dot" />}
              </button>
            ))}
          {search &&
            !chapters.some((c) =>
              `${c.title} ${c.blocks.map(blockText).join(" ")}`
                .toLowerCase()
                .includes(search.toLowerCase()),
            ) && <p className="subtle search-empty">No matching chapters.</p>}
        </div>
        <div className="sidebar-bottom">
          <button onClick={() => navigate(() => open("project"))}>
            <Plus size={17} />
            New project
          </button>
          <button onClick={() => navigate(() => upload.current?.click())}>
            <Upload size={17} />
            Import writing
          </button>
          <button onClick={() => open("settings")}>
            <Settings2 size={17} />
            Workspace settings
          </button>
          <div className="local-indicator">
            <span className={ws.mode} />
            {ws.mode === "local" ? "Local workspace" : "Team workspace"}
            <button onClick={() => navigate(() => open("account"))}>
              {ws.mode === "local" ? "Connect" : "Account"}
            </button>
          </div>
          <button className="profile-button" onClick={() => open("settings")}>
            <span className="avatar">{author[0]?.toUpperCase()}</span>
            <span>
              <strong>{author}</strong>
              <small>
                {ws.mode === "local" ? "Writing on this device" : role}
              </small>
            </span>
            <MoreHorizontal size={17} />
          </button>
        </div>
      </aside>
      {sidebarOpen && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-only"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <BookOpen size={16} />
            <span>{project?.title || "Your writing desk"}</span>
            <ChevronRight size={14} />
            <strong>
              {view === "write"
                ? "Manuscript"
                : view === "drafts"
                  ? "Alternate drafts"
                  : view === "review"
                    ? "Review"
                    : "History"}
            </strong>
          </div>
          <div className="topbar-actions">
            <button disabled={!project || dirty} onClick={() => open("export")}>
              <Download size={16} />
              <span>Export</span>
            </button>
            <button
              className="share-button"
              disabled={!project || dirty}
              onClick={() => open("share")}
            >
              <Share2 size={16} />
              <span>Share project</span>
            </button>
          </div>
        </header>
        {project?.id === "local-example" && (
          <div className="sample-banner">
            <span>Sample manuscript</span> Explore the editor and review a
            sample proposal.
            <button onClick={() => navigate(() => open("project"))}>
              Start your own project <Plus size={13} />
            </button>
          </div>
        )}
        {ws.error && (
          <div className="error-banner" role="alert">
            <span>{ws.error}</span>
            <button
              onClick={() =>
                void run(async () => {
                  await ws.refresh();
                  ws.setError("");
                })
              }
            >
              Refresh
            </button>
            <button aria-label="Dismiss error" onClick={() => ws.setError("")}>
              <X size={16} />
            </button>
          </div>
        )}
        {!project ? (
          <div className="empty welcome">
            <Feather size={42} />
            <h1>Your next chapter starts here.</h1>
            <p>
              A shared manuscript. Room to explore. A history you can trust.
            </p>
            <button className="primary" onClick={() => open("project")}>
              <Plus size={17} />
              Create a project
            </button>
          </div>
        ) : (
          <>
            {view === "write" && (
              <>
                <div className="document-context">
                  <div>
                    <span
                      className={`context-dot ${target !== "main" ? "draft" : ""}`}
                    />
                    <select
                      aria-label="Current version"
                      value={target}
                      onChange={(e) =>
                        navigate(() => {
                          setTarget(e.target.value);
                          setChapterId("");
                        })
                      }
                    >
                      <option value="main">Working manuscript</option>
                      {project.drafts
                        .filter((d) => d.status !== "archived")
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.status})
                          </option>
                        ))}
                    </select>
                    <span className="context-caption">
                      {target === "main"
                        ? "Your shared source of truth"
                        : draft?.status === "writing"
                          ? "A separate space to explore"
                          : "Submitted version · read-only"}
                    </span>
                  </div>
                  <div>
                    {target === "main" ? (
                      <button
                        disabled={!editable}
                        onClick={() => navigate(() => open("draft"))}
                      >
                        <GitBranch size={15} />
                        Try another version
                      </button>
                    ) : draft?.status === "writing" ? (
                      <button
                        className="primary small"
                        onClick={() => navigate(() => open("propose"))}
                      >
                        <GitPullRequest size={15} />
                        Propose changes
                      </button>
                    ) : (
                      <button onClick={() => navigate(() => setView("review"))}>
                        View proposals
                      </button>
                    )}
                    <button
                      className={commentsOpen ? "active-tool" : ""}
                      aria-label="Toggle comments"
                      onClick={() => setCommentsOpen(!commentsOpen)}
                    >
                      <MessageSquare size={18} />
                    </button>
                  </div>
                </div>
                <div className="writing-layout">
                  <div className="document-scroll">
                    {chapter ? (
                      <>
                        <div className="chapter-meta">
                          <span>
                            Chapter {chapters.indexOf(chapter) + 1} of{" "}
                            {chapters.length}
                          </span>
                          <div>
                            <button
                              aria-label="Move chapter earlier"
                              title="Move chapter earlier"
                              disabled={
                                !editable || chapters.indexOf(chapter) === 0
                              }
                              onClick={() => changeChapterOrder(-1)}
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              aria-label="Move chapter later"
                              title="Move chapter later"
                              disabled={
                                !editable ||
                                chapters.indexOf(chapter) ===
                                  chapters.length - 1
                              }
                              onClick={() => changeChapterOrder(1)}
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button
                              onClick={() => navigate(() => open("milestone"))}
                              disabled={role === "viewer"}
                            >
                              Save milestone
                            </button>
                          </div>
                        </div>
                        <ChapterPane
                          key={`${ws.mode}:${project.id}:${target}:${chapter.id}`}
                          chapter={chapter}
                          projectId={project.id}
                          target={target}
                          author={author}
                          editable={editable}
                          cloud={ws.mode === "cloud"}
                          commit={ws.commit}
                          onQuote={setQuote}
                          onDirty={setDirty}
                        />
                      </>
                    ) : (
                      <div className="empty">
                        <FileText size={35} />
                        <h2>A blank page awaits</h2>
                        <button
                          className="primary"
                          disabled={!editable}
                          onClick={createChapter}
                        >
                          Add your first chapter
                        </button>
                      </div>
                    )}
                  </div>
                  {commentsOpen && chapter && (
                    <Comments
                      project={project}
                      chapterId={chapter.id}
                      target={target}
                      quote={quote}
                      clearQuote={() => setQuote("")}
                      commit={ws.commit}
                      author={author}
                      editable={role !== "viewer"}
                      onError={ws.setError}
                    />
                  )}
                </div>
                <footer className="document-footer">
                  <span>
                    {wordCount(chapter ? [chapter] : []).toLocaleString()} words
                    in chapter
                  </span>
                  <span>
                    {Math.max(
                      1,
                      Math.ceil(wordCount(chapter ? [chapter] : []) / 230),
                    )}{" "}
                    min read
                  </span>
                  <span className="footer-end">
                    {dirty
                      ? "Changes pending"
                      : ws.mode === "local"
                        ? "Stored in this browser · export a backup regularly"
                        : "Team updates every 5 seconds"}
                  </span>
                </footer>
              </>
            )}
            {view === "drafts" && (
              <section className="workspace-section">
                <div className="section-heading">
                  <div>
                    <p className="subtle">Give an idea a little room</p>
                    <h1>Alternate drafts</h1>
                  </div>
                  <button
                    className="primary"
                    disabled={role === "viewer"}
                    onClick={() => open("draft")}
                  >
                    <Plus size={17} />
                    New alternate draft
                  </button>
                </div>
                <p className="intro">
                  Explore a different direction without changing the working
                  manuscript. Bring back the parts that work.
                </p>
                <div className="draft-grid">
                  {project.drafts.map((d) => (
                    <article className="draft-card" key={d.id}>
                      <div className="draft-card-top">
                        <GitBranch size={23} strokeWidth={1.5} />
                        <span className="status-pill">{d.status}</span>
                      </div>
                      <h2>{d.name}</h2>
                      <p>
                        {d.chapters.length === 1
                          ? d.chapters[0].title
                          : `${d.chapters.length} chapters`}
                      </p>
                      <small>
                        {compare(d.base, d.chapters).length} changes ·{" "}
                        {d.author}
                      </small>
                      <footer>
                        <button
                          onClick={() =>
                            navigate(() => {
                              setTarget(d.id);
                              setChapterId("");
                              setView("write");
                            })
                          }
                        >
                          {d.status === "writing"
                            ? "Continue writing"
                            : "Read draft"}
                          <ChevronRight size={16} />
                        </button>
                        {d.status === "writing" && (
                          <button
                            disabled={role === "viewer"}
                            title="Archive draft"
                            onClick={() =>
                              void run(
                                () =>
                                  ws.commit((p) => {
                                    p.drafts.find(
                                      (x) => x.id === d.id,
                                    )!.status = "archived";
                                  }),
                                "Draft archived. Its writing and history are preserved.",
                              )
                            }
                          >
                            Archive
                          </button>
                        )}
                      </footer>
                    </article>
                  ))}
                </div>
                {!project.drafts.length && (
                  <div className="empty">
                    <GitBranch size={36} />
                    <h2>What if you tried it another way?</h2>
                    <p>
                      Start with a chapter or the entire manuscript. Your
                      current writing stays exactly where it is.
                    </p>
                    <button
                      onClick={() => open("draft")}
                      disabled={role === "viewer"}
                    >
                      Try another version
                    </button>
                  </div>
                )}
              </section>
            )}
            {view === "review" && (
              <Review
                project={project}
                commit={ws.commit}
                author={author}
                editable={role !== "viewer"}
                onError={ws.setError}
              />
            )}
            {view === "history" && (
              <>
                <div className="history-target">
                  <label>
                    History for{" "}
                    <select
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                    >
                      <option value="main">Working manuscript</option>
                      {project.drafts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <History
                  key={target}
                  project={project}
                  target={target}
                  commit={ws.commit}
                  author={author}
                  editable={editable}
                  onError={ws.setError}
                />
              </>
            )}
          </>
        )}
      </main>
      <input
        ref={upload}
        className="sr-only"
        type="file"
        accept=".json,.txt,.md"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void run(() => importFile(file));
          e.target.value = "";
        }}
      />
      {notice && (
        <div className="toast" role="status">
          <Sparkles size={16} />
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {dialog && (
        <Modal
          title={
            {
              draft: "Try another version",
              milestone: "Name this moment",
              propose: "Propose your changes",
              project: "Start a new project",
              share: "Share your writing space",
              export: "Take your writing with you",
              account: "Your team workspace",
              settings: "Workspace settings",
            }[dialog]
          }
          onClose={() => !submitting && setDialog(null)}
        >
          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}
          {dialog === "draft" && project && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                void submit(async () => {
                  let id = "";
                  await ws.commit((p) => {
                    id = startDraft(
                      p,
                      String(data.get("name")).trim(),
                      author,
                      data.get("scope") === "chapter" ? chapter?.id : undefined,
                    );
                  });
                  setTarget(id);
                  setChapterId("");
                  setView("write");
                }, "Your alternate draft is ready.");
              }}
            >
              <p>
                Keep your manuscript intact while you explore. Team drafts are
                visible to everyone with project access.
              </p>
              <label>
                Draft name
                <input
                  name="name"
                  placeholder="A different ending"
                  required
                  maxLength={100}
                  autoFocus
                />
              </label>
              <label>
                Start with
                <select name="scope">
                  <option value="chapter" disabled={!chapter}>
                    This chapter: {chapter?.title}
                  </option>
                  <option value="all">Entire manuscript</option>
                </select>
              </label>
              <div className="modal-footer">
                <button type="button" onClick={() => setDialog(null)}>
                  Cancel
                </button>
                <button className="primary" disabled={submitting}>
                  Create alternate draft
                </button>
              </div>
            </form>
          )}
          {dialog === "project" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                void submit(
                  () =>
                    ws.addProject(
                      createProject(String(data.get("title")).trim()),
                    ),
                  "Your project is ready.",
                );
              }}
            >
              <p>
                Start with a blank manuscript. Invite collaborators whenever
                you’re ready.
              </p>
              <label>
                Project title
                <input
                  name="title"
                  placeholder="The next great story"
                  required
                  maxLength={120}
                  autoFocus
                />
              </label>
              <small>
                {ws.mode === "local"
                  ? "Saved privately in this browser. You can upload it to a team workspace later."
                  : "Created in your team workspace."}
              </small>
              <div className="modal-footer">
                <button className="primary" disabled={submitting}>
                  Create project
                </button>
              </div>
            </form>
          )}
          {dialog === "milestone" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                void submit(
                  () =>
                    ws.commit((p) =>
                      record(
                        p,
                        String(data.get("title")).trim(),
                        author,
                        target,
                        true,
                      ),
                    ),
                  "Milestone saved with a complete copy of your writing.",
                );
              }}
            >
              <p>Give this version a name you’ll recognize later.</p>
              <label>
                Milestone name
                <input
                  name="title"
                  placeholder="Ready for the first reader"
                  required
                  maxLength={120}
                  autoFocus
                />
              </label>
              <div className="modal-footer">
                <button className="primary" disabled={submitting}>
                  Save milestone
                </button>
              </div>
            </form>
          )}
          {dialog === "propose" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                void submit(async () => {
                  await ws.commit((p) =>
                    propose(p, target, String(data.get("note")).trim(), author),
                  );
                  setView("review");
                }, "Proposal submitted. This draft is frozen while it is reviewed.");
              }}
            >
              <p>
                Explain what you changed and why. Reviewers can accept
                individual changes before applying them to the manuscript.
              </p>
              <label>
                Note to reviewers
                <textarea
                  name="note"
                  placeholder="I wanted the opening to feel more…"
                  required
                  rows={4}
                />
              </label>
              <small>
                Your submitted version will be read-only. Return it to a draft
                if you need to revise it.
              </small>
              <div className="modal-footer">
                <button className="primary" disabled={submitting}>
                  Submit for review
                </button>
              </div>
            </form>
          )}
          {dialog === "export" && project && (
            <div className="export-options">
              <p>
                Keep a complete backup, or take the current version into another
                writing tool.
              </p>
              <button
                onClick={() => {
                  download(
                    `${project.title}.gitwrite.json`,
                    JSON.stringify(project, null, 2),
                  );
                  setNotice("Backup downloaded.");
                }}
              >
                <Download size={21} />
                <span>
                  <strong>Complete project backup</strong>
                  <small>
                    Writing, drafts, proposals, comments, and full history.
                    Import this JSON file to restore a project.
                  </small>
                </span>
              </button>
              <button
                onClick={() =>
                  download(`${project.title}.md`, exportText(), "text/markdown")
                }
              >
                <FileText size={21} />
                <span>
                  <strong>Current version as plain Markdown</strong>
                  <small>
                    Chapter headings and text. Rich formatting is not included.
                  </small>
                </span>
              </button>
            </div>
          )}
          {dialog === "settings" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                void submit(async () => {
                  const value = String(data.get("name")).trim();
                  localStorage.setItem("gitwrite-name", value);
                  setName(value);
                  if (project && role !== "viewer")
                    await ws.commit((p) => {
                      p.title = String(data.get("title")).trim();
                    });
                }, "Settings saved.");
              }}
            >
              <label>
                Your local display name
                <input
                  name="name"
                  defaultValue={name}
                  required
                  maxLength={60}
                />
              </label>
              {project && (
                <label>
                  Project title
                  <input
                    name="title"
                    defaultValue={project.title}
                    required
                    disabled={role === "viewer"}
                    maxLength={120}
                  />
                </label>
              )}
              <p>
                Local work stays in this browser. Team projects synchronize
                saved revisions and are visible to their members.
              </p>
              <div className="modal-footer">
                <button className="primary" disabled={submitting}>
                  Save settings
                </button>
              </div>
            </form>
          )}
          {dialog === "account" &&
            (!ws.user ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  const action = (
                    e.nativeEvent as SubmitEvent
                  ).submitter?.getAttribute("value");
                  void submit(async () => {
                    if (!cloud)
                      throw new Error(
                        "Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then restart the app.",
                      );
                    const credentials = {
                      email: String(data.get("email")),
                      password: String(data.get("password")),
                    };
                    const result =
                      action === "signup"
                        ? await cloud.auth.signUp(credentials)
                        : await cloud.auth.signInWithPassword(credentials);
                    if (result.error) throw result.error;
                    if (result.data.session) ws.setMode("cloud");
                    else
                      setNotice(
                        "Check your email to confirm your account, then sign in.",
                      );
                  });
                }}
              >
                <p>
                  Connect to collaborate. Your local projects stay on this
                  device until you explicitly upload a copy.
                </p>
                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    name="password"
                    minLength={8}
                    autoComplete="current-password"
                    required
                  />
                </label>
                <div className="modal-footer">
                  <button name="action" value="signup" disabled={submitting}>
                    Create account
                  </button>
                  <button
                    className="primary"
                    name="action"
                    value="signin"
                    disabled={submitting}
                  >
                    Sign in
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <p>
                  Signed in as <strong>{ws.user.email}</strong>.
                </p>
                <div className="modal-stack">
                  <button
                    className="primary"
                    onClick={() => {
                      ws.setMode("cloud");
                      setDialog(null);
                    }}
                  >
                    Open team projects
                  </button>
                  <button
                    onClick={() => {
                      ws.setMode("local");
                      setDialog(null);
                    }}
                  >
                    Open local projects
                  </button>
                  <button
                    onClick={() =>
                      void submit(async () => {
                        await cloud!.auth.signOut();
                        ws.setMode("local");
                      })
                    }
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ))}
          {dialog === "share" &&
            project &&
            (ws.mode === "local" ? (
              <div>
                <p>
                  This project is saved only on this device. Upload a copy to a
                  team workspace to invite collaborators.
                </p>
                <p className="subtle">
                  The uploaded copy will include all drafts, notes, and history.
                </p>
                <div className="modal-footer">
                  <button
                    className="primary"
                    disabled={submitting}
                    onClick={() => {
                      if (!ws.user) {
                        open("account");
                        return;
                      }
                      void submit(async () => {
                        const next = copy(project);
                        next.id = uid();
                        await createCloud(next);
                        ws.setMode("cloud");
                      }, "Uploaded a copy to your team workspace.");
                    }}
                  >
                    {ws.user ? "Upload project copy" : "Sign in to collaborate"}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p>
                  Editors can write, comment, and apply proposals. Viewers can
                  read. All project members can see its drafts and history.
                </p>
                <div className="member-list">
                  {members.map((m) => (
                    <div key={m.user_id}>
                      <span>
                        <strong>{m.email}</strong>
                        <small>{m.role}</small>
                      </span>
                      {role === "owner" && m.role !== "owner" && (
                        <button
                          onClick={() =>
                            void run(async () => {
                              const { error } = await cloud!.rpc(
                                "gw_remove_member",
                                { p_id: project.id, p_user: m.user_id },
                              );
                              if (error) throw error;
                              await refreshMembers();
                            })
                          }
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {role === "owner" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const data = new FormData(e.currentTarget);
                      void submit(async () => {
                        const { error } = await cloud!.rpc("gw_add_member", {
                          p_id: project.id,
                          p_email: data.get("email"),
                          p_role: data.get("role"),
                        });
                        if (error) throw error;
                      }, "Project access updated.");
                    }}
                  >
                    <label>
                      Collaborator email
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="writer@example.com"
                      />
                    </label>
                    <label>
                      Access
                      <select name="role">
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </label>
                    <small>
                      They must create a Gitwrite account first. The project
                      will appear in their team workspace.
                    </small>
                    <div className="modal-footer">
                      <button className="primary" disabled={submitting}>
                        Add collaborator
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
        </Modal>
      )}
    </div>
  );
}
