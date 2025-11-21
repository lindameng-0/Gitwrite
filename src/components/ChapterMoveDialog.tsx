import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GitBranch } from 'lucide-react';
import type { StoryBranchWithMeta, ChapterWithReviews } from '@/hooks/useStoryData';

interface ChapterMoveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: ChapterWithReviews | null;
  branches: StoryBranchWithMeta[];
  currentBranchId: string;
  onMoveChapter: (chapterId: string, targetBranchId: string) => Promise<boolean>;
}

export const ChapterMoveDialog: React.FC<ChapterMoveDialogProps> = ({
  isOpen,
  onClose,
  chapter,
  branches,
  currentBranchId,
  onMoveChapter,
}) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [isMoving, setIsMoving] = useState(false);

  const handleMove = async () => {
    if (!chapter || !selectedBranchId) return;
    
    setIsMoving(true);
    try {
      const success = await onMoveChapter(chapter.id, selectedBranchId);
      if (success) {
        onClose();
        setSelectedBranchId('');
      }
    } finally {
      setIsMoving(false);
    }
  };

  // Filter out current branch from options
  const availableBranches = branches.filter(b => b.id !== currentBranchId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Move Chapter to Branch
          </DialogTitle>
          <DialogDescription>
            Move "{chapter?.title}" to a different branch
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="target-branch">Target Branch</Label>
            <Select
              value={selectedBranchId}
              onValueChange={setSelectedBranchId}
            >
              <SelectTrigger id="target-branch">
                <SelectValue placeholder="Select a branch" />
              </SelectTrigger>
              <SelectContent>
                {availableBranches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    <div className="flex items-center gap-2">
                      {branch.is_main && <span className="text-xs text-green-600">[Main]</span>}
                      {branch.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isMoving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={!selectedBranchId || isMoving}
          >
            {isMoving ? 'Moving...' : 'Move Chapter'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
