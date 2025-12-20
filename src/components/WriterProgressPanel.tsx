import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, Clock, CheckCircle, Edit3 } from 'lucide-react';
import type { ChapterWithReviews } from '@/hooks/useStoryData';

interface WriterProgressPanelProps {
  chapters: ChapterWithReviews[];
  currentUserName?: string;
}

const WriterProgressPanel: React.FC<WriterProgressPanelProps> = ({ 
  chapters, 
  currentUserName 
}) => {
  // Filter to only show current user's chapters
  const myChapters = currentUserName 
    ? chapters.filter(c => c.author_name === currentUserName)
    : chapters;

  const draftChapters = myChapters.filter(c => c.status === 'draft');
  const reviewChapters = myChapters.filter(c => c.status === 'review');
  const approvedChapters = myChapters.filter(c => c.status === 'approved');
  const mergedChapters = myChapters.filter(c => c.status === 'merged');

  const totalChapters = myChapters.length;
  const completedChapters = approvedChapters.length + mergedChapters.length;
  const progressPercent = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-primary" />
          My Progress
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Chapters completed</span>
            <span className="font-medium">{completedChapters} / {totalChapters}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </Card>

      {/* Status Breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 bg-muted/50">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Drafts</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{draftChapters.length}</p>
        </Card>
        
        <Card className="p-3 bg-blue-50 dark:bg-blue-950/30">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-blue-600 dark:text-blue-400">In Review</span>
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{reviewChapters.length}</p>
        </Card>
        
        <Card className="p-3 bg-green-50 dark:bg-green-950/30">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-xs text-green-600 dark:text-green-400">Approved</span>
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">{approvedChapters.length}</p>
        </Card>
        
        <Card className="p-3 bg-purple-50 dark:bg-purple-950/30">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs text-purple-600 dark:text-purple-400">Merged</span>
          </div>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{mergedChapters.length}</p>
        </Card>
      </div>

      {/* Chapters Pending Review */}
      {reviewChapters.length > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-medium text-foreground mb-3">Awaiting Review</h4>
          <div className="space-y-2">
            {reviewChapters.map(chapter => (
              <div 
                key={chapter.id} 
                className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg"
              >
                <span className="text-sm text-foreground">{chapter.title}</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Pending
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recently Approved with Feedback */}
      {approvedChapters.filter(c => c.reviews && c.reviews.length > 0).length > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-medium text-foreground mb-3">Recent Feedback</h4>
          <div className="space-y-2">
            {approvedChapters
              .filter(c => c.reviews && c.reviews.length > 0)
              .slice(0, 3)
              .map(chapter => (
                <div key={chapter.id} className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <p className="text-sm font-medium text-foreground">{chapter.title}</p>
                  {chapter.reviews?.[0]?.feedback && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      "{chapter.reviews[0].feedback}"
                    </p>
                  )}
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {totalChapters === 0 && (
        <Card className="p-6 text-center">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            No chapters yet. Create your first chapter to get started!
          </p>
        </Card>
      )}
    </div>
  );
};

export default WriterProgressPanel;
