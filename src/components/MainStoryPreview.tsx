import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, FileText, CheckCircle, Clock, BookOpen, Plus } from 'lucide-react';
import type { ChapterWithReviews } from '@/hooks/useStoryData';

interface MainStoryPreviewProps {
  chapters: ChapterWithReviews[];
  storyTitle?: string;
  onCreateChapter?: (title: string) => Promise<string | null>;
  isAdmin?: boolean;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'draft':
      return <Badge variant="outline" className="text-xs"><Clock className="w-3 h-3 mr-1" />Draft</Badge>;
    case 'review':
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-xs"><Clock className="w-3 h-3 mr-1" />In Review</Badge>;
    case 'approved':
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
    case 'merged':
      return <Badge className="bg-primary/10 text-primary text-xs"><CheckCircle className="w-3 h-3 mr-1" />Published</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
};

const stripHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

const MainStoryPreview: React.FC<MainStoryPreviewProps> = ({
  chapters,
  storyTitle = 'Main Story',
  onCreateChapter,
  isAdmin = false
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const sortedChapters = [...chapters].sort((a, b) => a.chapter_order - b.chapter_order);
  const totalWords = sortedChapters.reduce((acc, chapter) => {
    const text = stripHtml(chapter.content);
    return acc + text.split(/\s+/).filter(w => w.length > 0).length;
  }, 0);

  const handleCreateChapter = async () => {
    if (!newTitle.trim() || !onCreateChapter) return;
    await onCreateChapter(newTitle);
    setNewTitle('');
    setIsCreating(false);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-6 border-b border-border bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
              <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{storyTitle}</h2>
              <p className="text-sm text-muted-foreground">Protected Main Version</p>
            </div>
          </div>
          {onCreateChapter && (
            <Button
              size="sm"
              onClick={() => setIsCreating(true)}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Chapter
            </Button>
          )}
        </div>
        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            {sortedChapters.length} chapters
          </span>
          <span>•</span>
          <span>{totalWords.toLocaleString()} words</span>
        </div>
      </div>

      {/* Create Chapter Form */}
      {isCreating && onCreateChapter && (
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex gap-2">
            <Input
              placeholder="New chapter title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateChapter()}
              autoFocus
            />
            <Button onClick={handleCreateChapter}>Create</Button>
            <Button variant="ghost" onClick={() => { setIsCreating(false); setNewTitle(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-8">
          {sortedChapters.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Chapters Yet</h3>
              <p className="text-muted-foreground mb-4">
                {onCreateChapter 
                  ? "Get started by adding your first chapter."
                  : "The main story doesn't have any chapters. Create chapters in branches and merge them here."}
              </p>
              {onCreateChapter && !isCreating && (
                <Button onClick={() => setIsCreating(true)} className="gap-1">
                  <Plus className="w-4 h-4" />
                  Add First Chapter
                </Button>
              )}
            </Card>
          ) : (
            sortedChapters.map((chapter, index) => (
              <article key={chapter.id} className="relative">
                {/* Chapter Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono text-muted-foreground">
                        Chapter {chapter.chapter_order}
                      </span>
                      {getStatusBadge(chapter.status)}
                    </div>
                    <h3 className="text-xl font-serif font-semibold text-foreground">
                      {chapter.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      by {chapter.author_name} • {new Date(chapter.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Chapter Content */}
                <Card className="p-6 bg-card">
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: chapter.content || '<p class="text-muted-foreground italic">No content yet...</p>' }}
                  />
                </Card>

                {/* Separator between chapters */}
                {index < sortedChapters.length - 1 && (
                  <Separator className="my-8" />
                )}
              </article>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MainStoryPreview;
