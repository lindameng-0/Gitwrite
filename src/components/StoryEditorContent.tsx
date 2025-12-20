import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Save, MessageSquare } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import RichTextEditor from './RichTextEditor';
import QuickMergeButton from './QuickMergeButton';
import type { ChapterWithReviews, StoryBranchWithMeta } from '@/hooks/useStoryData';
import type { MergeMode } from './SmartMergeDialog';

interface StoryEditorContentProps {
  chapters: ChapterWithReviews[];
  activeChapter: string;
  onUpdateChapterContent: (chapterId: string, content: string) => Promise<void>;
  onSubmitChapterForReview: (chapterId: string) => Promise<void>;
  // Quick merge support
  branches?: StoryBranchWithMeta[];
  activeBranch?: string;
  onMergeChapter?: (chapterId: string, targetBranchId: string, mode: MergeMode, mergeNote?: string, targetPosition?: number) => Promise<boolean>;
}

interface ChapterContentProps {
  chapter: ChapterWithReviews;
  onUpdateChapterContent: (chapterId: string, content: string) => Promise<void>;
  onSubmitChapterForReview: (chapterId: string) => Promise<void>;
  branches?: StoryBranchWithMeta[];
  activeBranch?: string;
  onMergeChapter?: (chapterId: string, targetBranchId: string, mode: MergeMode, mergeNote?: string, targetPosition?: number) => Promise<boolean>;
}

const ChapterContent: React.FC<ChapterContentProps> = ({ 
  chapter, 
  onUpdateChapterContent, 
  onSubmitChapterForReview,
  branches,
  activeBranch,
  onMergeChapter,
}) => {
  const [content, setContent] = useState(chapter.content);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Update content when chapter changes
  useEffect(() => {
    setContent(chapter.content);
  }, [chapter.content, chapter.id]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateChapterContent(chapter.id, content);
      toast({
        title: "Chapter saved",
        description: "Your chapter has been saved.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    try {
      await onSubmitChapterForReview(chapter.id);
      toast({
        title: "Chapter submitted for review",
        description: "Your chapter has been submitted for review.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
      });
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Chapter Header */}
      <div className="bg-background border-b border-border px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{chapter.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={`text-xs ${
              chapter.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
              chapter.status === 'review' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
              'bg-muted text-muted-foreground'
            }`}>
              {chapter.status}
            </Badge>
            <span className="text-sm text-muted-foreground">by {chapter.author_name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          {chapter.status === 'draft' && (
            <Button size="sm" variant="secondary" onClick={handleSubmitForReview}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Submit for Review
            </Button>
          )}
          {chapter.status === 'approved' && branches && activeBranch && onMergeChapter && (
            <QuickMergeButton
              chapter={chapter}
              branches={branches}
              activeBranch={activeBranch}
              onMergeChapter={onMergeChapter}
            />
          )}
        </div>
      </div>
      
      {/* Rich Text Editor */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <RichTextEditor
          content={content}
          onChange={handleContentChange}
          placeholder="Begin writing your chapter..."
        />
      </div>
    </div>
  );
};

const StoryEditorContent: React.FC<StoryEditorContentProps> = ({ 
  chapters, 
  activeChapter, 
  onUpdateChapterContent, 
  onSubmitChapterForReview,
  branches,
  activeBranch,
  onMergeChapter,
}) => {
  const chapter = chapters.find(c => c.id === activeChapter);

  if (!chapter) {
    return (
      <div className="h-full overflow-y-auto scroll-stable bg-background">
        <div className="min-h-full flex items-center justify-center">
          <Card className="p-6 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Chapter Selected</h3>
            <p className="text-muted-foreground">Select a chapter from the sidebar to start writing.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <ChapterContent 
      key={chapter.id}
      chapter={chapter} 
      onUpdateChapterContent={onUpdateChapterContent}
      onSubmitChapterForReview={onSubmitChapterForReview}
      branches={branches}
      activeBranch={activeBranch}
      onMergeChapter={onMergeChapter}
    />
  );
};

export default StoryEditorContent;
