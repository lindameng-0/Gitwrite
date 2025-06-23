
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { GitBranch, FileText, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import type { StoryBranchWithMeta, ChapterWithReviews } from '@/hooks/useStoryData';

interface MergeInterfaceProps {
  branches: StoryBranchWithMeta[];
  chapters: ChapterWithReviews[];
  activeBranch: string;
  onMergeChapter: (chapterId: string, targetBranchId: string, mergeNote?: string) => Promise<boolean>;
  onMergeStoryVersion: (sourceBranchId: string, targetBranchId: string, mergeNote?: string) => Promise<boolean>;
}

const MergeInterface: React.FC<MergeInterfaceProps> = ({
  branches,
  chapters,
  activeBranch,
  onMergeChapter,
  onMergeStoryVersion
}) => {
  const [selectedTargetBranch, setSelectedTargetBranch] = useState('');
  const [mergeNote, setMergeNote] = useState('');
  const [isMerging, setIsMerging] = useState(false);
  const { toast } = useToast();

  const currentBranch = branches.find(b => b.id === activeBranch);
  const targetBranches = branches.filter(b => b.id !== activeBranch);
  const approvedChapters = chapters.filter(c => c.status === 'approved' && c.canMerge);

  const handleMergeChapter = async (chapterId: string) => {
    if (!selectedTargetBranch) {
      toast({
        title: "Select target version",
        description: "Please select which story version to merge into.",
        variant: "destructive",
      });
      return;
    }

    setIsMerging(true);
    try {
      const success = await onMergeChapter(chapterId, selectedTargetBranch, mergeNote);
      if (success) {
        toast({
          title: "Chapter merged successfully!",
          description: "The approved chapter has been merged into the target story version.",
        });
        setMergeNote('');
      } else {
        toast({
          title: "Merge failed",
          description: "There was an issue merging the chapter. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Merge error",
        description: "An unexpected error occurred during the merge.",
        variant: "destructive",
      });
    } finally {
      setIsMerging(false);
    }
  };

  const handleMergeStoryVersion = async () => {
    if (!selectedTargetBranch) {
      toast({
        title: "Select target version",
        description: "Please select which story version to merge into.",
        variant: "destructive",
      });
      return;
    }

    setIsMerging(true);
    try {
      const success = await onMergeStoryVersion(activeBranch, selectedTargetBranch, mergeNote);
      if (success) {
        toast({
          title: "Story version merged successfully!",
          description: "All approved content has been merged into the target story version.",
        });
        setMergeNote('');
      } else {
        toast({
          title: "Merge failed",
          description: "There was an issue merging the story versions. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Merge error",
        description: "An unexpected error occurred during the merge.",
        variant: "destructive",
      });
    } finally {
      setIsMerging(false);
    }
  };

  if (approvedChapters.length === 0 && currentBranch?.is_main) {
    return (
      <Card className="p-6 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Approved Content to Merge</h3>
        <p className="text-gray-600">
          Chapters need to be approved before they can be merged between story versions.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Merge Target Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-indigo-600" />
          Merge Approved Content
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Merge into story version:
            </label>
            <Select value={selectedTargetBranch} onValueChange={setSelectedTargetBranch}>
              <SelectTrigger>
                <SelectValue placeholder="Select target story version..." />
              </SelectTrigger>
              <SelectContent>
                {targetBranches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.is_main ? 'Main Story' : branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Merge note (optional):
            </label>
            <Textarea
              placeholder="Describe what you're merging and why..."
              value={mergeNote}
              onChange={(e) => setMergeNote(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>
      </Card>

      {/* Individual Chapter Merges */}
      {approvedChapters.length > 0 && (
        <Card className="p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Approved Chapters Ready to Merge
          </h4>
          
          <div className="space-y-3">
            {approvedChapters.map((chapter) => (
              <div key={chapter.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-green-600" />
                  <div>
                    <h5 className="font-medium text-gray-900">{chapter.title}</h5>
                    <p className="text-sm text-gray-600">
                      Chapter {chapter.chapter_order} • {chapter.content.split(' ').filter(w => w.length > 0).length} words
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    Approved & Ready
                  </Badge>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Merge Chapter
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Merge Chapter: {chapter.title}</DialogTitle>
                      <DialogDescription>
                        This will copy the approved chapter to the selected story version. The original will remain unchanged.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <GitBranch className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-blue-900">Merge Preview</span>
                        </div>
                        <p className="text-sm text-blue-800">
                          <strong>{currentBranch?.is_main ? 'Main Story' : currentBranch?.name}</strong>
                          <ArrowRight className="w-4 h-4 inline mx-2" />
                          <strong>{selectedTargetBranch ? branches.find(b => b.id === selectedTargetBranch)?.name || 'Main Story' : 'Select target'}</strong>
                        </p>
                      </div>
                      
                      <Button 
                        onClick={() => handleMergeChapter(chapter.id)}
                        disabled={!selectedTargetBranch || isMerging}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {isMerging ? 'Merging...' : 'Confirm Merge'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Full Story Version Merge */}
      {!currentBranch?.is_main && (
        <Card className="p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-purple-600" />
            Merge Entire Story Version
          </h4>
          
          <div className="bg-purple-50 p-4 rounded-lg mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="text-purple-900 font-medium mb-1">Advanced Merge Operation</p>
                <p className="text-sm text-purple-800">
                  This will merge all approved content from this story version into the target version. 
                  Use this when you're ready to combine major story changes.
                </p>
              </div>
            </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-50">
                <GitBranch className="w-4 h-4 mr-2" />
                Merge Story Version
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Merge Story Version</DialogTitle>
                <DialogDescription>
                  This will merge all approved content from "{currentBranch?.name}" into the selected target version.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="bg-amber-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="font-medium text-amber-900">Important</span>
                  </div>
                  <p className="text-sm text-amber-800">
                    This action cannot be undone. Make sure you have a save point before proceeding.
                  </p>
                </div>
                
                <Button 
                  onClick={handleMergeStoryVersion}
                  disabled={!selectedTargetBranch || isMerging}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isMerging ? 'Merging Story Version...' : 'Confirm Story Version Merge'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </Card>
      )}
    </div>
  );
};

export default MergeInterface;
