
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Layers, FileText, AlertTriangle, Brain, MousePointer, Shield } from 'lucide-react';
import SmartMergeDialog, { type MergeMode } from './SmartMergeDialog';
import ManualMergeDialog from './ManualMergeDialog';
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
  const [manualMergeDialog, setManualMergeDialog] = useState<{
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

  const handleManualMergeChapter = (chapter: ChapterWithReviews) => {
    if (!selectedTargetBranch) {
      toast({
        title: "Select target version",
        description: "Please select which story version to merge into.",
        variant: "destructive",
      });
      return;
    }

    setManualMergeDialog({
      isOpen: true,
      chapter
    });
  };

  const handleManualMergeWithOptions = async (
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
          title: "Merge completed!",
          description: `Chapter merged successfully.`,
        });
        setMergeNote('');
        handleTargetBranchChange(selectedTargetBranch);
      } else {
        toast({
          title: "Merge failed",
          description: "There was an issue merging the chapter.",
          variant: "destructive",
        });
      }
      return success;
    } catch (error) {
      console.error('Manual merge error:', error);
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

  const handleMergeWithOptions = async (
    chapterId: string,
    mode: MergeMode,
    targetPosition?: number,
    replaceChapterId?: string,
    dialogMergeNote?: string
  ) => {
    if (!selectedTargetBranch) return false;

    console.log('Starting merge with options:', { chapterId, mode, targetPosition, replaceChapterId });

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
          description: "There was an issue merging the chapter. Please check console for details.",
          variant: "destructive",
        });
      }
      return success;
    } catch (error) {
      console.error('Merge error:', error);
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

  // Check if current branch is protected (Main Story) - can't merge FROM it
  const isProtectedBranch = currentBranch?.is_protected || currentBranch?.is_main;

  // Get main branch as the only valid merge target
  const mainBranch = branches.find(b => b.is_main);

  if (isProtectedBranch) {
    return (
      <Card className="p-6 text-center">
        <Shield className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Published Version is Protected</h3>
        <p className="text-muted-foreground">
          The Published Version cannot be published into other drafts. You can only publish chapters INTO the Published Version from other drafts.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Switch to a different draft to publish content to the Published Version.
        </p>
      </Card>
    );
  }

  if (approvedChapters.length === 0) {
    return (
      <Card className="p-6 text-center">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Approved Content to Publish</h3>
        <p className="text-muted-foreground">
          Chapters need to be approved before they can be published to the Published Version.
        </p>
      </Card>
    );
  }

  if (!mainBranch) {
    return (
      <Card className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Published Version Found</h3>
        <p className="text-muted-foreground">
          A published version is required for publishing.
        </p>
      </Card>
    );
  }

  // Auto-select main branch as target
  React.useEffect(() => {
    if (mainBranch && !selectedTargetBranch) {
      handleTargetBranchChange(mainBranch.id);
    }
  }, [mainBranch?.id]);

  return (
    <div className="space-y-6">
      {/* Publish Target - Fixed to Published Version */}
      <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-600" />
          Publish to Official Version
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4">
          From draft: <span className="font-medium text-foreground">{currentBranch?.name || 'Current Draft'}</span>
          {' → '}
          <span className="font-medium text-amber-700 dark:text-amber-300">Published Version</span>
        </p>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Publish note (optional):
          </label>
          <Textarea
            placeholder="Describe what you're publishing and why..."
            value={mergeNote}
            onChange={(e) => setMergeNote(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
      </Card>

      {/* Individual Chapter Publishing */}
      {approvedChapters.length > 0 && (
        <Card className="p-6">
          <h4 className="text-md font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Chapter Publishing
          </h4>
          
          <div className="space-y-3">
            {approvedChapters.map((chapter) => {
              const wordCount = chapter.content ? chapter.content.split(' ').filter(w => w.length > 0).length : 0;
              
              return (
                <div key={chapter.id} className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-green-600" />
                    <div>
                      <h5 className="font-medium text-foreground">{chapter.title || 'Untitled Chapter'}</h5>
                      <p className="text-sm text-muted-foreground">
                        Chapter {chapter.chapter_order} • {wordCount} words
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                      Ready to Publish
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleManualMergeChapter(chapter)}
                      size="sm" 
                      variant="outline"
                      disabled={!mainBranch || isMerging}
                    >
                      <MousePointer className="w-4 h-4 mr-2" />
                      Quick Publish
                    </Button>
                    <Button
                      onClick={() => handleSmartMergeChapter(chapter)}
                      size="sm" 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      disabled={!mainBranch || isMerging}
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      AI Publish
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-start gap-2">
                <MousePointer className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-1">Quick Publish</p>
                  <p className="text-xs text-muted-foreground">
                    Manually choose where to place the chapter: before, after, or replace an existing chapter.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">AI Publish</p>
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    AI analyzes content to suggest optimal placement and detect conflicts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Full Story Version Publish */}
      <Card className="p-6">
        <h4 className="text-md font-semibold text-foreground mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-600" />
          Publish All Approved Chapters
        </h4>
        
        <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg mb-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <p className="text-purple-900 dark:text-purple-100 font-medium mb-1">Bulk Publish Operation</p>
              <p className="text-sm text-purple-800 dark:text-purple-200">
                This will publish all {approvedChapters.length} approved chapter(s) from this draft to the Published Version at once.
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={async () => {
            if (!mainBranch) return;

            setIsMerging(true);
            try {
              const success = await onMergeStoryVersion(activeBranch, mainBranch.id, mergeNote);
              if (success) {
                toast({
                  title: "Published to Official Version",
                  description: "All approved chapters have been published to the Published Version.",
                });
                setMergeNote('');
              } else {
                toast({
                  title: "Publish failed",
                  description: "There was an issue publishing to the Published Version. Please try again.",
                  variant: "destructive",
                });
              }
            } catch (error) {
              toast({
                title: "Publish error",
                description: "An unexpected error occurred during the merge.",
                variant: "destructive",
              });
            } finally {
              setIsMerging(false);
            }
          }}
          variant="outline" 
          className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950"
          disabled={!mainBranch || isMerging || approvedChapters.length === 0}
        >
          <Layers className="w-4 h-4 mr-2" />
          {isMerging ? 'Publishing to Official Version...' : `Publish ${approvedChapters.length} Chapter(s)`}
        </Button>
      </Card>

      {/* Smart Merge Dialog */}
      <SmartMergeDialog
        isOpen={smartMergeDialog.isOpen}
        onClose={() => setSmartMergeDialog({ isOpen: false, chapter: null })}
        chapter={smartMergeDialog.chapter}
        targetChapters={targetChapters}
        sourceBranchName={currentBranch?.name || 'Current Branch'}
        targetBranchName="Main Story"
        onMerge={handleMergeWithOptions}
      />

      {/* Manual Merge Dialog */}
      <ManualMergeDialog
        isOpen={manualMergeDialog.isOpen}
        onClose={() => setManualMergeDialog({ isOpen: false, chapter: null })}
        chapter={manualMergeDialog.chapter}
        targetChapters={targetChapters}
        sourceBranchName={currentBranch?.name || 'Current Branch'}
        targetBranchName="Main Story"
        onMerge={handleManualMergeWithOptions}
      />
    </div>
  );
};

export default MergeInterface;
