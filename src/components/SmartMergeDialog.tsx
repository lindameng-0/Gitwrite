
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { GitMerge, FileText, ArrowRight, AlertTriangle, Replace, Plus, Edit } from 'lucide-react';
import type { ChapterWithReviews } from '@/hooks/useStoryData';

interface SmartMergeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: ChapterWithReviews;
  targetChapters: ChapterWithReviews[];
  sourceBranchName: string;
  targetBranchName: string;
  onMerge: (chapterId: string, mode: MergeMode, targetPosition?: number, replaceChapterId?: string, mergeNote?: string) => Promise<boolean>;
}

export type MergeMode = 'replace' | 'insert' | 'append';

interface MergeConflict {
  targetChapter: ChapterWithReviews;
  similarity: number;
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
  const [selectedPosition, setSelectedPosition] = useState<number>(targetChapters.length + 1);
  const [selectedReplaceChapter, setSelectedReplaceChapter] = useState<string>('');
  const [mergeNote, setMergeNote] = useState('');
  const [isMerging, setIsMerging] = useState(false);

  // Simple conflict detection based on title similarity
  const detectConflicts = (): MergeConflict[] => {
    return targetChapters
      .map(targetChapter => ({
        targetChapter,
        similarity: calculateSimilarity(chapter.title, targetChapter.title)
      }))
      .filter(conflict => conflict.similarity > 0.6)
      .sort((a, b) => b.similarity - a.similarity);
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const words1 = str1.toLowerCase().split(' ');
    const words2 = str2.toLowerCase().split(' ');
    const intersection = words1.filter(word => words2.includes(word));
    return intersection.length / Math.max(words1.length, words2.length);
  };

  const conflicts = detectConflicts();

  const handleMerge = async () => {
    setIsMerging(true);
    try {
      const success = await onMerge(
        chapter.id,
        mergeMode,
        mergeMode === 'insert' ? selectedPosition : undefined,
        mergeMode === 'replace' ? selectedReplaceChapter : undefined,
        mergeNote
      );
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Merge failed:', error);
    } finally {
      setIsMerging(false);
    }
  };

  const getModeDescription = () => {
    switch (mergeMode) {
      case 'replace':
        return 'Overwrite an existing chapter with this content';
      case 'insert':
        return 'Insert this chapter at a specific position';
      case 'append':
        return 'Add this chapter at the end of the story';
    }
  };

  const getModeIcon = () => {
    switch (mergeMode) {
      case 'replace': return <Replace className="w-4 h-4" />;
      case 'insert': return <Plus className="w-4 h-4" />;
      case 'append': return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-blue-600" />
            Smart Merge: {chapter.title}
          </DialogTitle>
          <DialogDescription>
            Choose how to merge this chapter from {sourceBranchName} into {targetBranchName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Conflict Detection */}
          {conflicts.length > 0 && (
            <Card className="p-4 bg-amber-50 border-amber-200">
              <div className="flex items-start gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900">Potential Conflicts Detected</h4>
                  <p className="text-sm text-amber-800">
                    Found similar chapters that might be related to this merge:
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {conflicts.slice(0, 3).map(conflict => (
                  <div key={conflict.targetChapter.id} className="flex items-center justify-between bg-white p-3 rounded border">
                    <div>
                      <span className="font-medium">{conflict.targetChapter.title}</span>
                      <span className="text-sm text-gray-600 ml-2">
                        (Chapter {conflict.targetChapter.chapter_order})
                      </span>
                    </div>
                    <Badge variant="outline" className="text-amber-700">
                      {Math.round(conflict.similarity * 100)}% similar
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Merge Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Merge Strategy:
            </label>
            <div className="grid grid-cols-1 gap-3">
              {(['append', 'insert', 'replace'] as MergeMode[]).map((mode) => (
                <Card
                  key={mode}
                  className={`p-4 cursor-pointer transition-all ${
                    mergeMode === mode 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setMergeMode(mode)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${
                      mergeMode === mode ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {getModeIcon()}
                    </div>
                    <div>
                      <h4 className="font-medium capitalize">{mode} Chapter</h4>
                      <p className="text-sm text-gray-600">{getModeDescription()}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Mode-specific Options */}
          {mergeMode === 'replace' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Replace which chapter:
              </label>
              <Select value={selectedReplaceChapter} onValueChange={setSelectedReplaceChapter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select chapter to replace..." />
                </SelectTrigger>
                <SelectContent>
                  {targetChapters.map((targetChapter) => (
                    <SelectItem key={targetChapter.id} value={targetChapter.id}>
                      Chapter {targetChapter.chapter_order}: {targetChapter.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {mergeMode === 'insert' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Insert at position:
              </label>
              <Select value={selectedPosition.toString()} onValueChange={(v) => setSelectedPosition(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: targetChapters.length + 1 }, (_, i) => i + 1).map((position) => (
                    <SelectItem key={position} value={position.toString()}>
                      Position {position} {position === targetChapters.length + 1 ? '(End)' : 
                        `(Before "${targetChapters.find(c => c.chapter_order === position)?.title || 'Unknown'}")`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Merge Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Merge note (optional):
            </label>
            <Textarea
              placeholder="Describe this merge operation..."
              value={mergeNote}
              onChange={(e) => setMergeNote(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Preview */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <GitMerge className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">Merge Preview</span>
            </div>
            <p className="text-sm text-blue-800">
              {mergeMode === 'replace' && selectedReplaceChapter
                ? `Replace "${targetChapters.find(c => c.id === selectedReplaceChapter)?.title}" with "${chapter.title}"`
                : mergeMode === 'insert'
                ? `Insert "${chapter.title}" at position ${selectedPosition}`
                : `Add "${chapter.title}" at the end of the story`}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleMerge}
              disabled={
                isMerging || 
                (mergeMode === 'replace' && !selectedReplaceChapter)
              }
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isMerging ? 'Merging...' : `${mergeMode === 'replace' ? 'Replace' : mergeMode === 'insert' ? 'Insert' : 'Add'} Chapter`}
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
