
import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface StoryEditorContentProps {
  localContent: string;
  onContentChange: (content: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

const StoryEditorContent: React.FC<StoryEditorContentProps> = ({
  localContent,
  onContentChange,
  textareaRef
}) => {
  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <Textarea
          ref={textareaRef}
          value={localContent}
          onChange={(e) => onContentChange(e.target.value)}
          className="w-full h-full min-h-[600px] story-editor text-lg leading-relaxed resize-none border-0 shadow-none focus:ring-0 p-8 bg-white rounded-lg shadow-sm"
          placeholder="Begin writing your story..."
        />
      </div>
    </div>
  );
};

export default StoryEditorContent;
