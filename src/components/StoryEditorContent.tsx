import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Save, MessageSquare, Lock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import RichTextEditor from './RichTextEditor';
import type { ChapterWithReviews, StoryBranchWithMeta } from '@/hooks/useStoryData';

interface StoryEditorContentProps {
  chapters: ChapterWithReviews[];
  activeChapter: string;
  onUpdateChapterContent: (chapterId: string, content: string) => Promise<void>;
  onSubmitChapterForReview: (chapterId: string) => Promise<void>;
  activeBranch?: StoryBranchWithMeta;
  isAdmin?: boolean;
}

interface ChapterContentProps {
  chapter: ChapterWithReviews;
  activeBranch?: StoryBranchWithMeta;
  onUpdateChapterContent: (chapterId: string, content: string) => Promise<void>;
  onSubmitChapterForReview: (chapterId: string) => Promise<void>;
  isReadOnly?: boolean;
  isAdmin?: boolean;
}

const ChapterContent: React.FC<ChapterContentProps> = ({ 
  chapter, 
  activeBranch,
  onUpdateChapterContent, 
  onSubmitChapterForReview,
  isReadOnly = false,
  isAdmin = false
}) => {
  const [content, setContent] = useState(chapter.content);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Determine if user can edit this chapter
  const canEdit = isAdmin || activeBranch?.author_name === activeBranch?.author_name; // Owner logic simplified
  const effectiveReadOnly = isReadOnly;

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
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Read-only Banner for inherited chapters */}
        {isReadOnly && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center gap-2 flex-shrink-0">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm text-amber-800 dark:text-amber-200">
              This chapter is from the published version. To edit, create a new draft from an earlier chapter.
            </span>
          </div>
        )}
        
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
              {effectiveReadOnly && (
                <Badge variant="outline" className="text-xs text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700">
                  Read-only
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!effectiveReadOnly && (
              <>
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
              </>
            )}
          </div>
        </div>
        
        {/* Rich Text Editor */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <RichTextEditor
            content={content}
            onChange={handleContentChange}
            placeholder="Begin writing your chapter..."
            editable={!effectiveReadOnly}
          />
        </div>
      </div>
    </div>
  );
};

const StoryEditorContent: React.FC<StoryEditorContentProps> = ({ 
  chapters, 
  activeChapter, 
  onUpdateChapterContent, 
  onSubmitChapterForReview,
  activeBranch,
  isAdmin = false
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
      activeBranch={activeBranch}
      onUpdateChapterContent={onUpdateChapterContent}
      onSubmitChapterForReview={onSubmitChapterForReview}
      isReadOnly={chapter.isInherited}
      isAdmin={isAdmin}
    />
  );
};

export default StoryEditorContent;
