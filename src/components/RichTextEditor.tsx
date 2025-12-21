import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import { EditorToolbar } from './EditorToolbar';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Begin writing your story...',
  editable = true
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
      Highlight.configure({
        multicolor: false,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `tiptap min-h-[600px] px-12 py-8 focus:outline-none ${!editable ? 'cursor-default' : ''}`,
      },
    },
  });

  // Update editor content when prop changes (e.g., switching chapters)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="flex flex-col h-full bg-background border-x border-border">
        <div className="h-10 border-b border-border bg-muted/30 animate-pulse" />
        <div className="flex-1 p-8">
          <div className="h-4 bg-muted w-3/4 mb-4 animate-pulse" />
          <div className="h-4 bg-muted w-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background border-x border-border overflow-hidden">
      <EditorToolbar editor={editor} />
      <div className="flex-1 overflow-auto bg-muted/20">
        <div className="max-w-none min-h-full bg-card">
          <EditorContent editor={editor} className="h-full" />
        </div>
      </div>
      
      {/* Minimal status bar */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-border bg-muted/40 text-[11px] text-muted-foreground">
        <span>
          {editor.storage.characterCount?.words?.() ?? 
            editor.getText().split(/\s+/).filter(word => word.length > 0).length} words
        </span>
        <span>
          {editor.storage.characterCount?.characters?.() ?? 
            editor.getText().length} chars
        </span>
      </div>
    </div>
  );
};

export default RichTextEditor;
