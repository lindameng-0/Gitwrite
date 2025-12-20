import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { GitMerge, ArrowRight, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { StoryBranchWithMeta, ChapterWithReviews } from '@/hooks/useStoryData';
import type { MergeMode } from './SmartMergeDialog';

interface QuickMergeButtonProps {
  chapter: ChapterWithReviews;
  branches: StoryBranchWithMeta[];
  activeBranch: string;
  onMergeChapter: (
    chapterId: string,
    targetBranchId: string,
    mode: MergeMode,
    mergeNote?: string,
    targetPosition?: number
  ) => Promise<boolean>;
}

const QuickMergeButton: React.FC<QuickMergeButtonProps> = ({
  chapter,
  branches,
  activeBranch,
  onMergeChapter,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [mergeNote, setMergeNote] = useState('');
  const [isMerging, setIsMerging] = useState(false);
  const { toast } = useToast();

  const targetBranches = branches.filter(b => b.id !== activeBranch);
  const mainBranch = targetBranches.find(b => b.is_main);

  const handleQuickMerge = async () => {
    const targetBranchId = selectedBranch || mainBranch?.id;
    if (!targetBranchId) {
      toast({
        title: "No target available",
        description: "Please select a branch to merge into.",
        variant: "destructive",
      });
      return;
    }

    setIsMerging(true);
    try {
      const success = await onMergeChapter(
        chapter.id,
        targetBranchId,
        'append',
        mergeNote || `Quick merge: ${chapter.title}`
      );

      if (success) {
        toast({
          title: "Chapter merged!",
          description: `"${chapter.title}" has been added to the target story.`,
        });
        setIsOpen(false);
        setMergeNote('');
        setSelectedBranch('');
      }
    } catch (error) {
      toast({
        title: "Merge failed",
        description: "There was an issue merging the chapter.",
        variant: "destructive",
      });
    } finally {
      setIsMerging(false);
    }
  };

  if (chapter.status !== 'approved') return null;

  return (
    <>
      <Button
        size="sm"
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-sm"
      >
        <GitMerge className="w-4 h-4 mr-2" />
        Merge to Main
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              Quick Merge
            </DialogTitle>
            <DialogDescription>
              Merge "{chapter.title}" into another story version
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Visual merge preview */}
            <div className="flex items-center justify-center gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <Badge variant="outline" className="mb-2">Current Branch</Badge>
                <p className="text-sm font-medium truncate max-w-[120px]">
                  {branches.find(b => b.id === activeBranch)?.name || 'Unknown'}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
              <div className="text-center">
                <Badge className="bg-emerald-100 text-emerald-800 mb-2">Target</Badge>
                <p className="text-sm font-medium">
                  {selectedBranch
                    ? branches.find(b => b.id === selectedBranch)?.name
                    : mainBranch?.name || 'Main Story'}
                </p>
              </div>
            </div>

            {/* Target branch selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Merge into:
              </label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder={mainBranch ? `Main Story (${mainBranch.name})` : "Select branch..."} />
                </SelectTrigger>
                <SelectContent>
                  {targetBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      <span className="flex items-center gap-2">
                        {branch.is_main && <Badge className="text-[10px] bg-amber-100 text-amber-800">Main</Badge>}
                        {branch.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Merge note */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Note (optional):
              </label>
              <Textarea
                placeholder="What changes does this chapter bring?"
                value={mergeNote}
                onChange={(e) => setMergeNote(e.target.value)}
                className="min-h-[60px] resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleQuickMerge}
              disabled={isMerging}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              {isMerging ? (
                <>Merging...</>
              ) : (
                <>
                  <GitMerge className="w-4 h-4 mr-2" />
                  Merge Chapter
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuickMergeButton;
