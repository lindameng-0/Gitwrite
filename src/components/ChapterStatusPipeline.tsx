import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FileText, Clock, CheckCircle, GitMerge, ChevronRight } from 'lucide-react';
import type { ChapterWithReviews } from '@/hooks/useStoryData';

interface ChapterStatusPipelineProps {
  chapters: ChapterWithReviews[];
  onChapterClick?: (chapterId: string) => void;
  activeChapter?: string;
}

type StatusType = 'draft' | 'review' | 'approved' | 'merged';

interface StatusConfig {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description: string;
}

const statusConfig: Record<StatusType, StatusConfig> = {
  draft: {
    label: 'Draft',
    icon: FileText,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    description: 'Work in progress',
  },
  review: {
    label: 'In Review',
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    description: 'Awaiting feedback',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    description: 'Ready to merge',
  },
  merged: {
    label: 'Merged',
    icon: GitMerge,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    description: 'In main story',
  },
};

const ChapterStatusPipeline: React.FC<ChapterStatusPipelineProps> = ({
  chapters,
  onChapterClick,
  activeChapter,
}) => {
  const groupedChapters = chapters.reduce((acc, chapter) => {
    const status = chapter.status as StatusType;
    if (!acc[status]) acc[status] = [];
    acc[status].push(chapter);
    return acc;
  }, {} as Record<StatusType, ChapterWithReviews[]>);

  const statuses: StatusType[] = ['draft', 'review', 'approved', 'merged'];

  return (
    <TooltipProvider>
      <div className="mb-4">
        {/* Pipeline header */}
        <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
          {statuses.map((status, index) => {
            const config = statusConfig[status];
            const count = groupedChapters[status]?.length || 0;
            const Icon = config.icon;

            return (
              <React.Fragment key={status}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${config.bgColor} ${config.color}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{config.label}</span>
                      {count > 0 && (
                        <Badge 
                          variant="secondary" 
                          className={`h-5 min-w-[20px] flex items-center justify-center px-1.5 text-[10px] ${config.bgColor} ${config.color} border-0`}
                        >
                          {count}
                        </Badge>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{config.description}</p>
                  </TooltipContent>
                </Tooltip>
                {index < statuses.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Chapter counts summary */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{chapters.length} total chapters</span>
          {groupedChapters['approved']?.length > 0 && (
            <span className="text-emerald-600 font-medium">
              {groupedChapters['approved'].length} ready to merge
            </span>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ChapterStatusPipeline;
