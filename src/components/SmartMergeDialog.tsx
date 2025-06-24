
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertTriangle, ArrowRight, FileText, GitMerge, Target, Plus, Replace } from 'lucide-react';
import type { ChapterWithReviews } from '@/hooks/useStoryData';

export type MergeMode = 'replace' | 'insert' | 'append';

interface SmartMergeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: ChapterWithReviews | null;
  targetChapters: ChapterWithReviews[];
  sourceBranchName: string;
  targetBranchName: string;
  onMerge: (
    chapterId: string,
    mode: MergeMode,
    targetPosition?: number,
    replaceChapterId?: string,
    mergeNote?: string
  ) => Promise<boolean>;
}

const SmartMergeDialog: React.FC<SmartMergeDialogProps> = ({
  isOpen,
  onClose,
  chapter,
  targetChapters,
  sourceBranchName,
  targetBranchName,
  onMerge
}) => {
  const [mergeMode, setMergeMode] = useState<MergeMode>('append');
  const [targetPosition, setTargetPosition] = useState<number>(1);
  const [replaceChapterId, setReplaceChapterId] = useState<string>('');
  const [mergeNote, setMergeNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!chapter) return null;

  const handleMerge = async () => {
    if (!chapter) return;
    
    setIsProcessing(true);
    try {
      const success = await onMerge(
        chapter.id,
        mergeMode,
        mergeMode === 'insert' ? targetPosition : undefined,
        mergeMode === 'replace' ? replaceChapterId : undefined,
        mergeNote
      );
      
      if (success) {
        onClose();
        // Reset form
        setMergeMode('append');
        setTargetPosition(1);
        setReplaceChapterId('');
        setMergeNote('');
      }
    } catch (error) {
      console.error('Merge failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Check for potential conflicts
  const titleConflicts = targetChapters.filter(tc => 
    tc.title?.toLowerCase().includes(chapter.title?.toLowerCase() || '') ||
    chapter.title?.toLowerCase().includes(tc.title?.toLowerCase() || '')
  );

  const wordCount = chapter.content ? chapter.content.split(' ').filter(w => w.length > 0).length : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-blue-600" />
            Smart Merge: "{chapter.title || 'Untitled Chapter'}"
          </DialogTitle>
          <DialogDescription>
            Merging from <span className="font-medium">{sourceBranchName}</span> to{' '}
            <span className="font-medium">{targetBranchName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Chapter Preview */}
          <Card className="p-4">
            <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Chapter Details
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Title:</strong> {chapter.title || 'Untitled'}</p>
              <p><strong>Order:</strong> Chapter {chapter.chapter_order}</p>
              <p><strong>Word Count:</strong> {wordCount.toLocaleString()} words</p>
              <p><strong>Status:</strong> <Badge className="ml-1">{chapter.status}</Badge></p>
            </div>
          </Card>

          {/* Conflict Detection */}
          {titleConflicts.length > 0 && (
            <Card className="p-4 bg-amber-50 border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900 mb-1">Potential Conflicts Detected</h4>
                  <p className="text-sm text-amber-800 mb-2">
                    Similar chapter titles found in target version:
                  </p>
                  <div className="space-y-1">
                    {titleConflicts.map((conflict) => (
                      <p key={conflict.id} className="text-sm text-amber-700">
                        • Chapter {conflict.chapter_order}: "{conflict.title || 'Untitled'}"
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Merge Strategy */}
          <Card className="p-4">
            <h3 className="font-medium text-gray-900 mb-3">Choose Merge Strategy</h3>
            <RadioGroup value={mergeMode} onValueChange={(value: MergeMode) => setMergeMode(value)}>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="append" id="append" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="append" className="flex items-center gap-2 font-medium">
                      <Plus className="w-4 h-4 text-green-600" />
                      Append to End
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Add this chapter at the end of the target story version
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="insert" id="insert" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="insert" className="flex items-center gap-2 font-medium">
                      <Target className="w-4 h-4 text-blue-600" />
                      Insert at Position
                    </Label>
                    <p className="text-sm text-gray-600 mt-1 mb-2">
                      Insert this chapter at a specific position
                    </p>
                    {mergeMode === 'insert' && (
                      <Select value={targetPosition.toString()} onValueChange={(value) => setTargetPosition(parseInt(value))}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select position..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: Math.max(targetChapters.length + 1, 1) }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              Position {i + 1} {i < targetChapters.length ? `(before "${targetChapters[i]?.title || 'Untitled'}")` : '(at end)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="replace" id="replace" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="replace" className="flex items-center gap-2 font-medium">
                      <Replace className="w-4 h-4 text-red-600" />
                      Replace Existing Chapter
                    </Label>
                    <p className="text-sm text-gray-600 mt-1 mb-2">
                      Replace an existing chapter with this one
                    </p>
                    {mergeMode === 'replace' && (
                      <Select value={replaceChapterId} onValueChange={setReplaceChapterId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select chapter to replace..." />
                        </SelectTrigger>
                        <SelectContent>
                          {targetChapters.map((tc) => (
                            <SelectItem key={tc.id} value={tc.id}>
                              Chapter {tc.chapter_order}: "{tc.title || 'Untitled'}"
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>
            </RadioGroup>
          </Card>

          {/* Merge Note */}
          <Card className="p-4">
            <Label htmlFor="merge-note" className="text-sm font-medium text-gray-700">
              Merge Note (Optional)
            </Label>
            <Textarea
              id="merge-note"
              placeholder="Describe this merge operation..."
              value={mergeNote}
              onChange={(e) => setMergeNote(e.target.value)}
              className="mt-2"
            />
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleMerge}
              disabled={
                isProcessing || 
                (mergeMode === 'replace' && !replaceChapterId) ||
                (mergeMode === 'insert' && !targetPosition)
              }
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? 'Merging...' : 'Merge Chapter'}
            </Button>
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SmartMergeDialog;
