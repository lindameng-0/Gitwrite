
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { GitBranch, FileText, ArrowRight, CheckCircle, AlertTriangle, GitMerge, Brain } from 'lucide-react';
import SmartMergeDialog, { type MergeMode } from './SmartMergeDialog';
import type { StoryBranchWithMeta, ChapterWithReviews } from '@/hooks/useStoryData';

interface MergeInterfaceProps {
  branches: StoryBranchWithMeta[];
  chapters: ChapterWithReviews[];
  activeBranch: string;
  onMergeChapter: (chapterId: string, targetBranchId: string, mode: MergeMode, mergeNote?: string, targetPosition?: number, replaceChapterId?: string) => Promise<boolean>;
  onMergeStoryVersion: (sourceBranchId: string, targetBranchId: string, mergeNote?: string) => Promise<boolean>;
  onLoadTargetChapters: (branchId: string) => Promise<ChapterWithReviews[]>;
}

const MergeInterface: React.FC<MergeInterfaceProps> = ({
  branches,
  chapters,
  activeBranch,
  onMergeChapter,
  onMergeStoryVersion,
  onLoadTargetChapters
}) => {
  const [selectedTargetBranch, setSelectedTargetBranch] = useState('');
  const [mergeNote, setMergeNote] = useState('');
  const [isMerging, setIsMerging] = useState(false);
  const [targetChapters, setTargetChapters] = useState<ChapterWithReviews[]>([]);
  const [smartMergeDialog, setSmartMergeDialog] = useState<{
    isOpen: boolean;
    chapter: ChapterWithReviews | null;
  }>({
    isOpen: false,
    chapter: null
  });
  const { toast } = useToast();

  const currentBranch = branches.find(b => b.id === activeBranch);
  const targetBranches = branches.filter(b => b.id !== activeBranch);
  const approvedChapters = chapters.filter(c => c.status === 'approved' && c.canMerge);

  const handleTargetBranchChange = async (branchId: string) => {
    setSelectedTargetBranch(branchId);
    if (branchId && onLoadTargetChapters) {
      try {
        const chapters = await onLoadTargetChapters(branchId);
        setTargetChapters(chapters);
      } catch (error) {
        console.error('Failed to load target chapters:', error);
        setTargetChapters([]);
      }
    } else {
      setTargetChapters([]);
    }
  };

  const handleSmartMergeChapter = async (chapter: ChapterWithReviews) => {
    if (!selectedTargetBranch) {
      toast({
        title: "Select target version",
        description: "Please select which story version to merge into.",
        variant: "destructive",
      });
      return;
    }

    setSmartMergeDialog({
      isOpen: true,
      chapter
    });
  };

  const handleMergeWithOptions = async (
    chapterId: string,
    mode: MergeMode,
    targetPosition?: number,
    replaceChapterId?: string,
    dialogMergeNote?: string
  ) => {
    if (!selectedTargetBranch) return false;

    setIsMerging(true);
    try {
      const success = await onMergeChapter(
        chapterId,
        selectedTargetBranch,
        mode,
        dialogMergeNote || mergeNote,
        targetPosition,
        replaceChapterId
      );
      
      if (success) {
        toast({
          title: "Smart merge completed!",
          description: `Chapter merged using ${mode} strategy with AI optimization.`,
        });
        setMergeNote('');
        // Refresh target chapters
        handleTargetBranchChange(selectedTargetBranch);
      } else {
        toast({
          title: "Merge failed",
          description: "There was an issue merging the chapter. Please try again.",
          variant: "destructive",
        });
      }
      return success;
    } catch (error) {
      toast({
        title: "Merge error",
        description: "An unexpected error occurred during the merge.",
        variant: "destructive",
      });
      return false;
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
          <Brain className="w-5 h-5 text-indigo-600" />
          AI-Powered Merge Controls
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Merge into story version:
            </label>
            <Select value={selectedTargetBranch} onValueChange={handleTargetBranchChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select target story version..." />
              </SelectTrigger>
              <SelectContent>
                {targetBranches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.is_main ? 'Main Story' : (branch.name || 'Unnamed Branch')}
                    {targetChapters.length > 0 && branch.id === selectedTargetBranch && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({targetChapters.length} chapters)
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default merge note (optional):
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
            <Brain className="w-5 h-5 text-green-600" />
            AI-Powered Chapter Merging
          </h4>
          
          <div className="space-y-3">
            {approvedChapters.map((chapter) => {
              const wordCount = chapter.content ? chapter.content.split(' ').filter(w => w.length > 0).length : 0;
              
              return (
                <div key={chapter.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-green-600" />
                    <div>
                      <h5 className="font-medium text-gray-900">{chapter.title || 'Untitled Chapter'}</h5>
                      <p className="text-sm text-gray-600">
                        Chapter {chapter.chapter_order} • {wordCount} words
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Ready for AI Merge
                    </Badge>
                  </div>
                  
                  <Button 
                    onClick={() => handleSmartMergeChapter(chapter)}
                    size="sm" 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    disabled={!selectedTargetBranch}
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    AI Smart Merge
                  </Button>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-900 font-medium mb-1">AI-Powered Smart Merge Features:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Content analysis for optimal positioning</li>
                  <li>• Character and theme conflict detection</li>
                  <li>• Novel-specific merge strategies (subplot, flashback, etc.)</li>
                  <li>• Intelligent flow and tone matching</li>
                </ul>
              </div>
            </div>
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

          <Button 
            onClick={handleMergeStoryVersion}
            variant="outline" 
            className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
            disabled={!selectedTargetBranch || isMerging}
          >
            <GitBranch className="w-4 h-4 mr-2" />
            {isMerging ? 'Merging Story Version...' : 'Merge Story Version'}
          </Button>
        </Card>
      )}

      {/* Smart Merge Dialog */}
      <SmartMergeDialog
        isOpen={smartMergeDialog.isOpen}
        onClose={() => setSmartMergeDialog({ isOpen: false, chapter: null })}
        chapter={smartMergeDialog.chapter}
        targetChapters={targetChapters}
        sourceBranchName={currentBranch?.is_main ? 'Main Story' : (currentBranch?.name || 'Unknown')}
        targetBranchName={branches.find(b => b.id === selectedTargetBranch)?.is_main ? 'Main Story' : 
          (branches.find(b => b.id === selectedTargetBranch)?.name || 'Unknown')}
        onMerge={handleMergeWithOptions}
      />
    </div>
  );
};

export default MergeInterface;
