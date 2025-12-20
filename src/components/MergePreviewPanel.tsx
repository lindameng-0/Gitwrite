import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, FileText, Plus, Replace, Sparkles } from 'lucide-react';
import type { ChapterWithReviews } from '@/hooks/useStoryData';
import type { MergeMode } from './SmartMergeDialog';

interface MergePreviewPanelProps {
  sourceChapter: ChapterWithReviews;
  targetChapters: ChapterWithReviews[];
  mergeMode: MergeMode;
  targetPosition?: number;
  replaceChapterId?: string;
}

const modeLabels: Record<MergeMode, { label: string; description: string; icon: React.ElementType }> = {
  replace: {
    label: 'Update Existing',
    description: 'Replace a chapter with this new version',
    icon: Replace,
  },
  insert: {
    label: 'Add Between',
    description: 'Insert at a specific position',
    icon: Plus,
  },
  append: {
    label: 'Add to End',
    description: 'Add as the next chapter',
    icon: Plus,
  },
  subplot: {
    label: 'Weave as Subplot',
    description: 'Integrate as parallel storyline',
    icon: Sparkles,
  },
  flashback: {
    label: 'Add as Backstory',
    description: 'Insert as historical context',
    icon: FileText,
  },
};

const MergePreviewPanel: React.FC<MergePreviewPanelProps> = ({
  sourceChapter,
  targetChapters,
  mergeMode,
  targetPosition,
  replaceChapterId,
}) => {
  const modeConfig = modeLabels[mergeMode];
  const ModeIcon = modeConfig.icon;

  interface PreviewChapter {
    id: string;
    title: string;
    isNew?: boolean;
    replacedTitle?: string;
  }

  // Calculate resulting chapter order
  const getResultingOrder = (): PreviewChapter[] => {
    const chapters: PreviewChapter[] = [...targetChapters]
      .sort((a, b) => a.chapter_order - b.chapter_order)
      .map(ch => ({ id: ch.id, title: ch.title }));
    
    if (mergeMode === 'replace' && replaceChapterId) {
      const replacedChapter = targetChapters.find(c => c.id === replaceChapterId);
      return chapters.map((ch): PreviewChapter => 
        ch.id === replaceChapterId 
          ? { id: sourceChapter.id, title: sourceChapter.title, isNew: true, replacedTitle: replacedChapter?.title }
          : ch
      );
    }
    
    if (mergeMode === 'append') {
      return [...chapters, { id: sourceChapter.id, title: sourceChapter.title, isNew: true }];
    }
    
    if (mergeMode === 'insert' && targetPosition !== undefined) {
      const result = [...chapters];
      result.splice(targetPosition - 1, 0, { id: sourceChapter.id, title: sourceChapter.title, isNew: true });
      return result;
    }
    
    return [...chapters, { id: sourceChapter.id, title: sourceChapter.title, isNew: true }];
  };

  const resultingOrder = getResultingOrder();
  const sourceWordCount = sourceChapter.content?.split(/\s+/).filter(w => w.length > 0).length || 0;

  return (
    <Card className="p-4 border-2 border-dashed border-muted-foreground/20">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-primary" />
        <h4 className="font-medium text-sm">Merge Preview</h4>
      </div>

      {/* Merge action summary */}
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <ModeIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{modeConfig.label}</span>
          </div>
          <p className="text-xs text-muted-foreground">{modeConfig.description}</p>
        </div>
        <Badge variant="outline" className="text-xs">
          {sourceWordCount} words
        </Badge>
      </div>

      {/* Chapter order preview */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Resulting Chapter Order
        </p>
        <ScrollArea className="h-[180px]">
          <div className="space-y-1 pr-3">
            {resultingOrder.map((chapter: any, index) => (
              <div
                key={`${chapter.id}-${index}`}
                className={`flex items-center gap-2 p-2 rounded text-sm ${
                  chapter.isNew
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-muted/30'
                }`}
              >
                <span className="text-xs text-muted-foreground w-6">{index + 1}.</span>
                <FileText className={`w-3.5 h-3.5 ${chapter.isNew ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                <span className={`flex-1 truncate ${chapter.isNew ? 'font-medium text-emerald-700 dark:text-emerald-400' : ''}`}>
                  {chapter.title || 'Untitled'}
                </span>
                {chapter.isNew && (
                  <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5">
                    {chapter.replacedTitle ? 'Updated' : 'New'}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Visual diff hint */}
      {mergeMode === 'replace' && replaceChapterId && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ArrowRight className="w-3.5 h-3.5" />
            <span>
              Replacing "{targetChapters.find(c => c.id === replaceChapterId)?.title}" with "{sourceChapter.title}"
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default MergePreviewPanel;
