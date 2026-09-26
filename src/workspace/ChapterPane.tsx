import { useEffect, useRef, useState } from "react";
import { Check, AlertCircle, CloudOff } from "lucide-react";
import Editor from "./Editor";
import {
  applyChanges,
  compare,
  copy,
  createProject,
  equal,
  record,
  type Block,
  type Chapter,
  type Project,
} from "./model";
import { download } from "./storage";

type Props = {
  chapter: Chapter;
  projectId: string;
  target: string;
  author: string;
  editable: boolean;
  cloud: boolean;
  commit: (fn: (p: Project) => void, id?: string) => Promise<void>;
  onQuote: (text: string) => void;
  onDirty: (dirty: boolean) => void;
};
export default function ChapterPane({
  chapter,
  projectId,
  target,
  author,
  editable,
  cloud,
  commit,
  onQuote,
  onDirty,
}: Props) {
  const recoveryKey = `gitwrite-recovery:${cloud ? "cloud" : "local"}:${projectId}:${target}:${chapter.id}`;
  const [initial] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(recoveryKey) || "null");
      return saved?.value?.id === chapter.id && saved.base
        ? (saved as { value: Chapter; base: Chapter })
        : null;
    } catch {
      return null;
    }
  });
  const [value, setValue] = useState<Chapter>(initial?.value ?? chapter);
  const [status, setStatus] = useState(
    initial ? "Recovered unsaved writing" : "saved",
  );
  const [dirty, setDirty] = useState(!!initial);
  const data = useRef({
    value,
    base: initial?.base ?? copy(chapter),
    dirty: !!initial,
    generation: 0,
  });
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const saving = useRef(false);
  const mounted = useRef(true);
  const saveRef = useRef<() => Promise<void>>();
  const persistRecovery = (next: Chapter) => {
    try {
      localStorage.setItem(
        recoveryKey,
        JSON.stringify({ value: next, base: data.current.base }),
      );
    } catch {
      setStatus("Recovery storage unavailable. Save or export before leaving.");
    }
  };
  const save = async () => {
    if (!data.current.dirty || saving.current || !editable) return;
    saving.current = true;
    const pending = copy(data.current.value),
      base = copy(data.current.base),
      generation = data.current.generation;
    if (mounted.current) setStatus("Saving…");
    try {
      let merged: Chapter = pending;
      await commit((p) => {
        const draft = p.drafts.find((d) => d.id === target);
        if (target !== "main" && draft?.status !== "writing")
          throw new Error(
            "This draft is under review. Your unsaved writing is retained for recovery.",
          );
        const chapters = target === "main" ? p.chapters : draft?.chapters;
        const current = chapters?.find((c) => c.id === pending.id);
        if (!chapters || !current)
          throw new Error(
            "This chapter was removed. Your writing is retained for recovery.",
          );
        const changes = compare([base], [pending], [current]);
        if (changes.some((c) => c.conflict))
          throw new Error(
            "Someone changed the same passage. Your writing is safe here. Save it as an alternate draft to compare both versions.",
          );
        merged = applyChanges([current], changes, {})[0];
        chapters[chapters.findIndex((c) => c.id === pending.id)] = merged;
        if (changes.length)
          record(p, `Edited “${merged.title}”`, author, target);
      }, projectId);
      data.current.base = copy(merged);
      if (data.current.generation === generation) {
        data.current.dirty = false;
        data.current.value = merged;
        localStorage.removeItem(recoveryKey);
        if (mounted.current) {
          setValue(merged);
          setDirty(false);
          setStatus("saved");
        }
      } else persistRecovery(data.current.value);
    } catch (e) {
      if (mounted.current) setStatus((e as Error).message);
    } finally {
      saving.current = false;
      if (
        mounted.current &&
        data.current.dirty &&
        data.current.generation !== generation
      ) {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => void saveRef.current?.(), 900);
      }
    }
  };
  saveRef.current = save;
  const edit = (next: Chapter) => {
    data.current.value = next;
    data.current.dirty = true;
    data.current.generation++;
    setValue(next);
    setDirty(true);
    setStatus("Unsaved changes");
    persistRecovery(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void saveRef.current?.(), 900);
  };
  useEffect(() => {
    onDirty(dirty);
  }, [dirty, onDirty]);
  useEffect(() => {
    if (
      !data.current.dirty &&
      !saving.current &&
      !equal(data.current.base, chapter)
    ) {
      data.current.base = copy(chapter);
      data.current.value = copy(chapter);
      setValue(copy(chapter));
    }
  }, [chapter]);
  useEffect(() => {
    mounted.current = true;
    const guard = (event: BeforeUnloadEvent) => {
      if (data.current.dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
      window.removeEventListener("beforeunload", guard);
    };
  }, []);
  const rescue = async () => {
    await commit((p) => {
      const id = crypto.randomUUID();
      p.drafts.unshift({
        id,
        name: `Recovered: ${value.title}`,
        author,
        base: [copy(data.current.base)],
        chapters: [copy(value)],
        createdAt: new Date().toISOString(),
        status: "writing",
      });
      record(p, "Recovered unsaved writing", author, id, true);
    }, projectId);
    data.current.dirty = false;
    setDirty(false);
    localStorage.removeItem(recoveryKey);
    setStatus("Saved as an alternate draft. Open Drafts to continue.");
  };
  const exportRecovery = () => {
    const recovered = createProject(`Recovered: ${value.title}`);
    recovered.chapters = [copy(value)];
    recovered.history = [];
    record(recovered, "Recovered unsaved writing", author, "main", true);
    download(
      `${value.title || "chapter"}.recovery.json`,
      JSON.stringify(recovered, null, 2),
    );
  };
  return (
    <>
      <div className={`save-state ${dirty ? "pending" : ""}`} role="status">
        {dirty ? <CloudOff size={14} /> : <Check size={14} />}
        {status === "saved"
          ? cloud
            ? "Saved to team workspace"
            : "Saved on this device"
          : status}
        {dirty && <button onClick={() => void save()}>Save now</button>}
      </div>
      {dirty && status !== "Unsaved changes" && status !== "Saving…" && (
        <div className="notice">
          <AlertCircle size={17} />
          <span>{status}</span>
          <button onClick={() => rescue().catch((e) => setStatus(e.message))}>
            Keep as alternate draft
          </button>
          <button onClick={exportRecovery}>Download recovery</button>
        </div>
      )}
      <div className="manuscript-page">
        <input
          className="chapter-title"
          aria-label="Chapter title"
          value={value.title}
          disabled={!editable}
          onChange={(e) => edit({ ...value, title: e.target.value })}
        />
        <Editor
          blocks={value.blocks}
          editable={editable}
          onChange={(blocks: Block[]) =>
            edit({ ...data.current.value, blocks })
          }
          onQuote={onQuote}
        />
      </div>
    </>
  );
}
