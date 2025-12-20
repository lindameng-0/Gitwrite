import React from 'react';
import RichTextEditor from './RichTextEditor';

interface StoryEditorContentProps {
  localContent: string;
  onContentChange: (content: string) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

const StoryEditorContent: React.FC<StoryEditorContentProps> = ({
  localContent,
  onContentChange,
}) => {
  return (
    <div className="flex-1 p-4 overflow-hidden">
      <div className="max-w-4xl mx-auto h-full">
        <RichTextEditor
          content={localContent}
          onChange={onContentChange}
          placeholder="Begin writing your story..."
        />
      </div>
    </div>
  );
};

export default StoryEditorContent;
