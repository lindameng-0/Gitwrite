import { useEffect, useRef } from "react";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  Heading2,
} from "lucide-react";
import { type Block, uid, equal } from "./model";

const Identity = Extension.create({
  name: "blockIdentity",
  addGlobalAttributes() {
    return [
      {
        types: [
          "paragraph",
          "heading",
          "blockquote",
          "bulletList",
          "orderedList",
          "codeBlock",
          "horizontalRule",
        ],
        attributes: { blockId: { default: null, rendered: false } },
      },
    ];
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction: (transactions, _old, state) => {
          if (!transactions.some((t) => t.docChanged)) return null;
          const seen = new Set<string>();
          const tr = state.tr;
          state.doc.forEach((node, pos) => {
            let id = node.attrs.blockId;
            if (!id || seen.has(id)) {
              id = uid();
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, blockId: id });
            }
            seen.add(id);
          });
          return tr.docChanged ? tr : null;
        },
      }),
    ];
  },
});
function documentOf(blocks: Block[]): JSONContent {
  return {
    type: "doc",
    content: blocks.length
      ? blocks.map((b) => ({
          ...b.node,
          attrs: { ...b.node.attrs, blockId: b.id },
        }))
      : [{ type: "paragraph", attrs: { blockId: uid() } }],
  };
}
function blocksOf(doc: JSONContent): Block[] {
  return (doc.content ?? []).map((node) => {
    const { blockId, ...attrs } = node.attrs ?? {};
    const next: JSONContent = { ...node, attrs };
    if (!Object.keys(attrs).length) delete next.attrs;
    return { id: blockId || uid(), node: next };
  });
}
export default function Editor({
  blocks,
  editable,
  onChange,
  onQuote,
}: {
  blocks: Block[];
  editable: boolean;
  onChange: (blocks: Block[]) => void;
  onQuote: (text: string) => void;
}) {
  const change = useRef(onChange);
  change.current = onChange;
  const quote = useRef(onQuote);
  quote.current = onQuote;
  const editor = useEditor({
    extensions: [
      StarterKit,
      Identity,
      Placeholder.configure({ placeholder: "Every story starts somewhere…" }),
    ],
    content: documentOf(blocks),
    editable,
    editorProps: {
      attributes: {
        class: "manuscript-text",
        "aria-label": "Chapter text",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor }) => change.current(blocksOf(editor.getJSON())),
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to)
        quote.current(editor.state.doc.textBetween(from, to, " "));
    },
  });
  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);
  useEffect(() => {
    if (editor && !equal(blocksOf(editor.getJSON()), blocks))
      editor.commands.setContent(documentOf(blocks), { emitUpdate: false });
  }, [blocks, editor]);
  if (!editor) return null;
  const buttons = [
    {
      label: "Bold",
      Icon: Bold,
      active: editor.isActive("bold"),
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      Icon: Italic,
      active: editor.isActive("italic"),
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Heading",
      Icon: Heading2,
      active: editor.isActive("heading"),
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Bullet list",
      Icon: List,
      active: editor.isActive("bulletList"),
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Numbered list",
      Icon: ListOrdered,
      active: editor.isActive("orderedList"),
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Quote",
      Icon: Quote,
      active: editor.isActive("blockquote"),
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      label: "Undo",
      Icon: Undo2,
      active: false,
      run: () => editor.chain().focus().undo().run(),
    },
    {
      label: "Redo",
      Icon: Redo2,
      active: false,
      run: () => editor.chain().focus().redo().run(),
    },
  ];
  return (
    <>
      <div
        className="editor-toolbar"
        role="toolbar"
        aria-label="Text formatting"
      >
        {buttons.map(({ label, Icon, active, run }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            title={label}
            aria-pressed={active}
            disabled={!editable}
            onClick={run}
          >
            <Icon size={16} />
          </button>
        ))}
        <span>Write at your own pace.</span>
      </div>
      <EditorContent editor={editor} />
    </>
  );
}
