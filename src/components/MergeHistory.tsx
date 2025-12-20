import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GitBranch, FileText, Clock, User, ArrowRight, RotateCcw, History } from 'lucide-react';

interface MergeRecord {
  id: string;
  type: 'chapter' | 'story_version';
  sourceVersionName: string;
  targetVersionName: string;
  chapterTitle?: string;
  mergeNote?: string;
  authorName: string;
  timestamp: string;
  savePointId?: string;
}

interface MergeHistoryProps {
  mergeHistory: MergeRecord[];
  onUndoMerge?: (savePointId: string) => Promise<boolean>;
}

const MergeHistory: React.FC<MergeHistoryProps> = ({ mergeHistory, onUndoMerge }) => {
  if (mergeHistory.length === 0) {
    return (
      <Card className="p-6 text-center bg-muted/20 border-dashed">
        <History className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
        <h3 className="text-base font-medium text-foreground mb-1">No Merge History</h3>
        <p className="text-sm text-muted-foreground">
          Merge operations will appear here as you combine story versions.
        </p>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            Merge History
          </h3>
          <Badge variant="outline" className="text-xs">
            {mergeHistory.length} {mergeHistory.length === 1 ? 'merge' : 'merges'}
          </Badge>
        </div>
        
        <ScrollArea className="h-[300px] pr-3">
          <div className="space-y-3">
            {mergeHistory.map((record, index) => (
              <Card 
                key={record.id} 
                className={`p-3 transition-all hover:shadow-sm ${
                  index === 0 ? 'border-primary/30 bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`mt-0.5 p-1.5 rounded-full ${
                    record.type === 'chapter' 
                      ? 'bg-blue-100 dark:bg-blue-900/30' 
                      : 'bg-purple-100 dark:bg-purple-900/30'
                  }`}>
                    {record.type === 'chapter' ? (
                      <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <GitBranch className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Type badge and timestamp */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge className={`text-[10px] px-1.5 py-0 ${
                        record.type === 'chapter' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}>
                        {record.type === 'chapter' ? 'Chapter' : 'Story'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeTime(record.timestamp)}
                      </span>
                      {index === 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">Latest</Badge>
                      )}
                    </div>
                    
                    {/* Branch flow */}
                    <div className="flex items-center gap-1.5 text-sm mb-1">
                      <span className="font-medium text-foreground truncate max-w-[100px]">
                        {record.sourceVersionName}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium text-foreground truncate max-w-[100px]">
                        {record.targetVersionName}
                      </span>
                    </div>
                    
                    {/* Chapter title if applicable */}
                    {record.chapterTitle && (
                      <p className="text-xs text-muted-foreground mb-1 truncate">
                        "{record.chapterTitle}"
                      </p>
                    )}
                    
                    {/* Merge note */}
                    {record.mergeNote && (
                      <p className="text-xs text-muted-foreground/80 italic truncate">
                        {record.mergeNote}
                      </p>
                    )}
                    
                    {/* Author */}
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1.5">
                      <User className="w-3 h-3" />
                      <span>{record.authorName}</span>
                    </div>
                  </div>
                  
                  {/* Undo button */}
                  {record.savePointId && onUndoMerge && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => onUndoMerge(record.savePointId!)}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Undo this merge</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
};

// Helper function for relative time
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default MergeHistory;
