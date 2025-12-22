import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  GitCompare,
  CheckCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Minus,
  Edit3,
  Eye
} from 'lucide-react';
import { calculateDiff, DiffBlock, paragraphsToHtml } from '@/utils/diffCalculator';
import { toast } from 'sonner';

interface VisualDiffMergeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sourceContent: string;
  targetContent: string;
  sourceAuthor: string;
  targetAuthor: string;
  sourceBranch: string;
  targetBranch: string;
  chapterTitle?: string;
  onMergeComplete: (mergedContent: string, note: string) => Promise<void>;
}

type BlockSelection = 'source' | 'target' | 'both' | 'none';

const VisualDiffMergeDialog: React.FC<VisualDiffMergeDialogProps> = ({
  isOpen,
  onClose,
  sourceContent,
  targetContent,
  sourceAuthor,
  targetAuthor,
  sourceBranch,
  targetBranch,
  chapterTitle,
  onMergeComplete
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [blockSelections, setBlockSelections] = useState<Record<number, BlockSelection>>({});
  const [showPreview, setShowPreview] = useState(false);

  const diff = useMemo(() => {
    return calculateDiff(sourceContent, targetContent);
  }, [sourceContent, targetContent]);

  // Initialize selections when diff changes
  React.useEffect(() => {
    const initial: Record<number, BlockSelection> = {};
    diff.blocks.forEach((block, index) => {
      if (block.type === 'unchanged') {
        initial[index] = 'both';
      } else if (block.type === 'added') {
        initial[index] = 'target'; // Added content only exists in target
      } else if (block.type === 'removed') {
        initial[index] = 'none'; // Removed content - default to not include
      } else if (block.type === 'modified') {
        initial[index] = 'target'; // Modified - default to target (newer)
      }
    });
    setBlockSelections(initial);
  }, [diff]);

  const toggleSelection = (index: number, selection: BlockSelection) => {
    setBlockSelections(prev => ({
      ...prev,
      [index]: selection
    }));
  };

  const useSourceForAll = () => {
    const selections: Record<number, BlockSelection> = {};
    diff.blocks.forEach((block, index) => {
      if (block.type === 'unchanged') {
        selections[index] = 'both';
      } else if (block.sourceContent) {
        selections[index] = 'source';
      } else {
        selections[index] = 'none';
      }
    });
    setBlockSelections(selections);
    toast.success('Applied source version');
  };

  const useTargetForAll = () => {
    const selections: Record<number, BlockSelection> = {};
    diff.blocks.forEach((block, index) => {
      if (block.type === 'unchanged') {
        selections[index] = 'both';
      } else if (block.targetContent) {
        selections[index] = 'target';
      } else {
        selections[index] = 'none';
      }
    });
    setBlockSelections(selections);
    toast.success('Applied target version');
  };

  const mergedContent = useMemo(() => {
    const paragraphs: string[] = [];
    
    diff.blocks.forEach((block, index) => {
      const selection = blockSelections[index];
      
      if (selection === 'both' || selection === 'source') {
        if (block.sourceContent) {
          paragraphs.push(block.sourceContent);
        }
      }
      if (selection === 'target' && block.type !== 'unchanged') {
        if (block.targetContent) {
          paragraphs.push(block.targetContent);
        }
      }
    });
    
    return paragraphs;
  }, [diff, blockSelections]);

  const handleExecuteMerge = async () => {
    setIsExecuting(true);
    try {
      const htmlContent = paragraphsToHtml(mergedContent);
      const sourceCount = Object.values(blockSelections).filter(s => s === 'source').length;
      const targetCount = Object.values(blockSelections).filter(s => s === 'target').length;
      const note = `Manual merge: ${sourceCount} from source, ${targetCount} from target`;
      await onMergeComplete(htmlContent, note);
      toast.success('Merge completed successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to execute merge:', error);
      toast.error('Failed to complete merge');
    } finally {
      setIsExecuting(false);
    }
  };

  const getBlockIcon = (type: DiffBlock['type']) => {
    switch (type) {
      case 'added':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'removed':
        return <Minus className="w-4 h-4 text-red-600" />;
      case 'modified':
        return <Edit3 className="w-4 h-4 text-amber-600" />;
      default:
        return <Check className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getBlockStyles = (type: DiffBlock['type'], side: 'source' | 'target', isSelected: boolean) => {
    const baseStyles = 'p-3 rounded-md text-sm transition-all cursor-pointer border-2';
    
    if (type === 'unchanged') {
      return `${baseStyles} bg-muted/30 border-transparent ${isSelected ? 'ring-2 ring-primary' : ''}`;
    }
    
    if (side === 'source') {
      if (type === 'removed') {
        return `${baseStyles} bg-red-50 dark:bg-red-950/20 ${isSelected ? 'border-red-500' : 'border-red-200 dark:border-red-800'}`;
      }
      if (type === 'modified') {
        return `${baseStyles} bg-amber-50 dark:bg-amber-950/20 ${isSelected ? 'border-amber-500' : 'border-amber-200 dark:border-amber-800'}`;
      }
    }
    
    if (side === 'target') {
      if (type === 'added') {
        return `${baseStyles} bg-green-50 dark:bg-green-950/20 ${isSelected ? 'border-green-500' : 'border-green-200 dark:border-green-800'}`;
      }
      if (type === 'modified') {
        return `${baseStyles} bg-blue-50 dark:bg-blue-950/20 ${isSelected ? 'border-blue-500' : 'border-blue-200 dark:border-blue-800'}`;
      }
    }
    
    return `${baseStyles} bg-muted/30 border-transparent`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-primary" />
            Visual Comparison
            {chapterTitle && (
              <Badge variant="outline" className="ml-2">{chapterTitle}</Badge>
            )}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-4">
            <span>Compare and select content from each version</span>
            <Badge variant="secondary">{Math.round(diff.similarity * 100)}% similar</Badge>
          </DialogDescription>
        </DialogHeader>

        {/* Quick Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={useSourceForAll}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Use Source
            </Button>
            <Button variant="outline" size="sm" onClick={useTargetForAll}>
              Use Target
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Plus className="w-3 h-3 text-green-600" /> Added
            </span>
            <span className="flex items-center gap-1">
              <Minus className="w-3 h-3 text-red-600" /> Removed
            </span>
            <span className="flex items-center gap-1">
              <Edit3 className="w-3 h-3 text-amber-600" /> Modified
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
        </div>

        <div className="flex-1 min-h-0 flex gap-4">
          {/* Side by Side Diff */}
          <div className={`flex-1 flex gap-4 min-h-0 ${showPreview ? 'w-2/3' : ''}`}>
            {/* Source Column */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    Source
                  </Badge>
                  <span className="text-xs text-muted-foreground">{sourceBranch}</span>
                </div>
                <span className="text-xs text-muted-foreground">{sourceAuthor} • {diff.sourceWordCount} words</span>
              </div>
              <ScrollArea className="flex-1 border rounded-md p-3">
                <div className="space-y-2">
                  {diff.blocks.map((block, index) => {
                    if (block.type === 'added') {
                      // Added blocks don't exist in source
                      return (
                        <div key={index} className="p-3 rounded-md bg-muted/20 text-muted-foreground text-sm italic text-center">
                          (Content added in target)
                        </div>
                      );
                    }
                    
                    const isSelected = blockSelections[index] === 'source' || blockSelections[index] === 'both';
                    
                    return (
                      <div
                        key={index}
                        className={getBlockStyles(block.type, 'source', isSelected)}
                        onClick={() => {
                          if (block.type === 'unchanged') return;
                          toggleSelection(index, isSelected ? 'none' : 'source');
                        }}
                      >
                        <div className="flex items-start gap-2">
                          {getBlockIcon(block.type)}
                          <p className="flex-1">{block.sourceContent}</p>
                          {isSelected && block.type !== 'unchanged' && (
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Target Column */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    Target
                  </Badge>
                  <span className="text-xs text-muted-foreground">{targetBranch}</span>
                </div>
                <span className="text-xs text-muted-foreground">{targetAuthor} • {diff.targetWordCount} words</span>
              </div>
              <ScrollArea className="flex-1 border rounded-md p-3">
                <div className="space-y-2">
                  {diff.blocks.map((block, index) => {
                    if (block.type === 'removed') {
                      // Removed blocks don't exist in target
                      return (
                        <div key={index} className="p-3 rounded-md bg-muted/20 text-muted-foreground text-sm italic text-center">
                          (Content removed from source)
                        </div>
                      );
                    }
                    
                    const isSelected = blockSelections[index] === 'target' || blockSelections[index] === 'both';
                    
                    return (
                      <div
                        key={index}
                        className={getBlockStyles(block.type, 'target', isSelected)}
                        onClick={() => {
                          if (block.type === 'unchanged') return;
                          toggleSelection(index, isSelected ? 'none' : 'target');
                        }}
                      >
                        <div className="flex items-start gap-2">
                          {getBlockIcon(block.type)}
                          <p className="flex-1">{block.targetContent}</p>
                          {isSelected && block.type !== 'unchanged' && (
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="w-1/3 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Merged Preview
                </h4>
                <span className="text-xs text-muted-foreground">
                  {mergedContent.join(' ').split(/\s+/).filter(w => w).length} words
                </span>
              </div>
              <ScrollArea className="flex-1 border rounded-md p-4 bg-background">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {mergedContent.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleExecuteMerge}
            disabled={isExecuting || mergedContent.length === 0}
            className="bg-gradient-to-r from-green-600 to-emerald-600"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Execute Merge
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VisualDiffMergeDialog;
