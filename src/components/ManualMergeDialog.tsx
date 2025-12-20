import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowDown, ArrowUp, FileText, Replace, Plus, Check, AlertTriangle } from 'lucide-react';
import type { ChapterWithReviews } from '@/hooks/useStoryData';

export type ManualMergeMode = 'replace' | 'insert' | 'append';

interface ManualMergeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: ChapterWithReviews | null;
  targetChapters: ChapterWithReviews[];
  sourceBranchName: string;
  targetBranchName: string;
  onMerge: (
    chapterId: string,
    mode: ManualMergeMode,
    targetPosition?: number,
    replaceChapterId?: string,
    mergeNote?: string
  ) => Promise<boolean>;
}

interface SelectedAction {
  mode: ManualMergeMode;
  targetChapterId?: string;
  position?: number;
}

const ManualMergeDialog: React.FC<ManualMergeDialogProps> = ({
  isOpen,
  onClose,
  chapter,
  targetChapters,
  sourceBranchName,
  targetBranchName,
  onMerge
}) => {
  const [selectedAction, setSelectedAction] = useState<SelectedAction | null>(null);
  const [mergeNote, setMergeNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);

  if (!chapter) return null;

  const handleSelectInsertBefore = (targetChapter: ChapterWithReviews) => {
    setSelectedAction({
      mode: 'insert',
      position: targetChapter.chapter_order
    });
    setShowReplaceConfirm(false);
  };

  const handleSelectInsertAfter = (targetChapter: ChapterWithReviews) => {
    setSelectedAction({
      mode: 'insert',
      position: targetChapter.chapter_order + 1
    });
    setShowReplaceConfirm(false);
  };

  const handleSelectReplace = (targetChapter: ChapterWithReviews) => {
    setSelectedAction({
      mode: 'replace',
      targetChapterId: targetChapter.id,
      position: targetChapter.chapter_order
    });
    setShowReplaceConfirm(true);
  };

  const handleAppendToEnd = () => {
    const maxOrder = targetChapters.length > 0 
      ? Math.max(...targetChapters.map(c => c.chapter_order)) 
      : 0;
    setSelectedAction({
      mode: 'append',
      position: maxOrder + 1
    });
    setShowReplaceConfirm(false);
  };

  const handleMerge = async () => {
    if (!chapter || !selectedAction) return;
    
    setIsProcessing(true);
    try {
      const success = await onMerge(
        chapter.id,
        selectedAction.mode,
        selectedAction.position,
        selectedAction.targetChapterId,
        mergeNote
      );
      
      if (success) {
        onClose();
        setSelectedAction(null);
        setMergeNote('');
        setShowReplaceConfirm(false);
      }
    } catch (error) {
      console.error('Manual merge failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedAction(null);
    setMergeNote('');
    setShowReplaceConfirm(false);
    onClose();
  };

  // Build preview of the new chapter order
  const previewOrder = useMemo(() => {
    if (!selectedAction) return null;

    const result: { title: string; order: number; isNew: boolean; isReplaced?: boolean }[] = [];
    
    if (selectedAction.mode === 'replace') {
      targetChapters.forEach(tc => {
        if (tc.id === selectedAction.targetChapterId) {
          result.push({
            title: chapter.title || 'Untitled',
            order: tc.chapter_order,
            isNew: true,
            isReplaced: false
          });
        } else {
          result.push({
            title: tc.title || 'Untitled',
            order: tc.chapter_order,
            isNew: false
          });
        }
      });
    } else if (selectedAction.mode === 'insert') {
      const insertPos = selectedAction.position || 1;
      let currentOrder = 1;
      
      const sortedChapters = [...targetChapters].sort((a, b) => a.chapter_order - b.chapter_order);
      
      for (const tc of sortedChapters) {
        if (tc.chapter_order >= insertPos && !result.some(r => r.isNew)) {
          result.push({
            title: chapter.title || 'Untitled',
            order: currentOrder,
            isNew: true
          });
          currentOrder++;
        }
        result.push({
          title: tc.title || 'Untitled',
          order: currentOrder,
          isNew: false
        });
        currentOrder++;
      }
      
      // If we haven't inserted yet (inserting at end)
      if (!result.some(r => r.isNew)) {
        result.push({
          title: chapter.title || 'Untitled',
          order: currentOrder,
          isNew: true
        });
      }
    } else if (selectedAction.mode === 'append') {
      targetChapters.forEach(tc => {
        result.push({
          title: tc.title || 'Untitled',
          order: tc.chapter_order,
          isNew: false
        });
      });
      result.push({
        title: chapter.title || 'Untitled',
        order: result.length + 1,
        isNew: true
      });
    }

    return result.sort((a, b) => a.order - b.order);
  }, [selectedAction, targetChapters, chapter]);

  const wordCount = chapter.content ? chapter.content.split(' ').filter(w => w.length > 0).length : 0;
  const sortedTargetChapters = [...targetChapters].sort((a, b) => a.chapter_order - b.chapter_order);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Manual Merge: "{chapter.title || 'Untitled Chapter'}"
          </DialogTitle>
          <DialogDescription>
            Choose where to place this chapter ({wordCount} words) from{' '}
            <span className="font-medium">{sourceBranchName}</span> into{' '}
            <span className="font-medium">{targetBranchName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-2 gap-4 min-h-0">
          {/* Left: Target chapters with actions */}
          <div className="flex flex-col min-h-0">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Target Chapters ({sortedTargetChapters.length})
            </h3>
            <ScrollArea className="flex-1 pr-2">
              <div className="space-y-2">
                {sortedTargetChapters.length === 0 ? (
                  <Card className="p-4 text-center text-muted-foreground">
                    <p className="text-sm">No chapters in target branch</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={handleAppendToEnd}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add as First Chapter
                    </Button>
                  </Card>
                ) : (
                  sortedTargetChapters.map((tc, index) => (
                    <Card 
                      key={tc.id} 
                      className={`p-3 transition-colors ${
                        selectedAction?.targetChapterId === tc.id 
                          ? 'border-destructive bg-destructive/5' 
                          : selectedAction?.mode === 'insert' && selectedAction.position === tc.chapter_order
                          ? 'border-t-2 border-t-primary'
                          : selectedAction?.mode === 'insert' && selectedAction.position === tc.chapter_order + 1
                          ? 'border-b-2 border-b-primary'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Ch. {tc.chapter_order}
                          </Badge>
                          <span className="font-medium text-sm truncate max-w-[120px]">
                            {tc.title || 'Untitled'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 h-7 text-xs"
                          onClick={() => handleSelectInsertBefore(tc)}
                        >
                          <ArrowUp className="w-3 h-3 mr-1" />
                          Before
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 h-7 text-xs"
                          onClick={() => handleSelectInsertAfter(tc)}
                        >
                          <ArrowDown className="w-3 h-3 mr-1" />
                          After
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleSelectReplace(tc)}
                        >
                          <Replace className="w-3 h-3 mr-1" />
                          Replace
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
                
                {sortedTargetChapters.length > 0 && (
                  <Button 
                    variant="outline" 
                    className={`w-full ${selectedAction?.mode === 'append' ? 'border-primary bg-primary/5' : ''}`}
                    onClick={handleAppendToEnd}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Append to End
                  </Button>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Preview */}
          <div className="flex flex-col min-h-0">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Preview New Order
            </h3>
            <ScrollArea className="flex-1 pr-2">
              {selectedAction && previewOrder ? (
                <div className="space-y-1">
                  {showReplaceConfirm && (
                    <Card className="p-3 bg-destructive/10 border-destructive mb-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-destructive">Replace Confirmation</p>
                          <p className="text-muted-foreground">
                            This will permanently replace the existing chapter content.
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                  
                  {previewOrder.map((item, index) => (
                    <div 
                      key={index}
                      className={`flex items-center gap-2 p-2 rounded-md ${
                        item.isNew 
                          ? 'bg-primary/10 border border-primary' 
                          : 'bg-muted/50'
                      }`}
                    >
                      <Badge 
                        variant={item.isNew ? "default" : "outline"} 
                        className="text-xs min-w-[40px] justify-center"
                      >
                        {item.order}
                      </Badge>
                      <span className={`text-sm truncate ${item.isNew ? 'font-medium' : ''}`}>
                        {item.title}
                      </span>
                      {item.isNew && (
                        <Badge className="ml-auto bg-primary/20 text-primary text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Select a position to see preview
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Merge Note */}
        <div className="pt-4 border-t">
          <Label htmlFor="manual-merge-note" className="text-sm font-medium">
            Merge Note (Optional)
          </Label>
          <Textarea
            id="manual-merge-note"
            placeholder="Add a note about this merge..."
            value={mergeNote}
            onChange={(e) => setMergeNote(e.target.value)}
            className="mt-1 h-16"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleMerge}
            disabled={!selectedAction || isProcessing}
          >
            {isProcessing ? (
              'Merging...'
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Merge Chapter
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManualMergeDialog;
