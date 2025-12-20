import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { GitBranch, Clock, BarChart3 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import StoryEditorSidebar from './StoryEditorSidebar';
import StoryEditorContent from './StoryEditorContent';
import SavePointsPanel from './SavePointsPanel';
import MergeInterface from './MergeInterface';
import WriterProgressPanel from './WriterProgressPanel';
import type { StoryBranchWithMeta, ChapterWithReviews, SavePoint } from '@/hooks/useStoryData';

interface StoryEditorProps {
  branches: StoryBranchWithMeta[];
  chapters: ChapterWithReviews[];
  savePoints: SavePoint[];
  activeBranch: string;
  activeChapter: string;
  onUpdateChapterContent: (chapterId: string, content: string) => Promise<void>;
  onCreateChapter: (title: string, chapterOrder?: number) => Promise<string | null>;
  onCreateSavePoint: (title: string, description?: string) => Promise<string | null>;
  onSubmitChapterForReview: (chapterId: string) => Promise<void>;
  onReviewChapter: (chapterId: string, status: 'approved' | 'changes_requested', feedback?: string) => Promise<void>;
  onCreateBranch: (name: string, parentBranchId?: string) => Promise<string | null>;
  onSwitchBranch: (branchId: string) => Promise<void>;
  onSwitchChapter: React.Dispatch<React.SetStateAction<string>>;
  onRestoreSavePoint: (savePointId: string) => Promise<boolean>;
  onLoadTargetChapters: (branchId: string) => Promise<ChapterWithReviews[]>;
  onMergeChapter: (chapterId: string, targetBranchId: string, mode: 'replace' | 'insert' | 'append' | 'subplot' | 'flashback', mergeNote?: string, targetPosition?: number, replaceChapterId?: string) => Promise<boolean>;
  onMergeStoryVersion: (sourceBranchId: string, targetBranchId: string, mergeNote?: string) => Promise<boolean>;
  onMoveChapter?: (chapterId: string, targetBranchId: string) => Promise<boolean>;
  // Role-based props
  isAdmin?: boolean;
  currentUserName?: string;
}


const PANEL_LAYOUT_KEY = 'story-editor-panel-layout';

const StoryEditor: React.FC<StoryEditorProps> = ({
  branches,
  chapters,
  savePoints,
  activeBranch,
  activeChapter,
  onUpdateChapterContent,
  onCreateChapter,
  onCreateSavePoint,
  onSubmitChapterForReview,
  onReviewChapter,
  onCreateBranch,
  onSwitchBranch,
  onSwitchChapter,
  onRestoreSavePoint,
  onLoadTargetChapters,
  onMergeChapter,
  onMergeStoryVersion,
  isAdmin = true, // Default to true for backwards compatibility
  currentUserName
}) => {
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const { toast } = useToast()

  const getDefaultLayout = (): number[] => {
    const saved = localStorage.getItem(PANEL_LAYOUT_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [25, 50, 25];
      }
    }
    return [25, 50, 25];
  };

  const handleLayoutChange = (sizes: number[]) => {
    localStorage.setItem(PANEL_LAYOUT_KEY, JSON.stringify(sizes));
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) {
      toast({
        variant: "destructive",
        title: "Branch name required",
        description: "Please enter a name for the new branch.",
      })
      return;
    }
    
    try {
      const branchId = await onCreateBranch(newBranchName);
      if (branchId) {
        setNewBranchName('');
        setIsCreatingBranch(false);
        toast({
          title: "Branch created",
          description: `Successfully created branch "${newBranchName}".`,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create branch",
        description: "There was a problem creating the branch.",
      })
    }
  };

  const defaultLayout = getDefaultLayout();

  return (
    <ResizablePanelGroup 
      direction="horizontal" 
      className="h-full min-h-0 overflow-hidden"
      onLayout={handleLayoutChange}
    >
      <ResizablePanel defaultSize={defaultLayout[0]} minSize={15} className="h-full min-h-0 overflow-hidden">
        <div className="h-full min-h-0 overflow-hidden">
          <StoryEditorSidebar
            branches={branches}
            chapters={chapters}
            activeBranch={activeBranch}
            activeChapter={activeChapter}
            newBranchName={newBranchName}
            setNewBranchName={setNewBranchName}
            isCreatingBranch={isCreatingBranch}
            setIsCreatingBranch={setIsCreatingBranch}
            onCreateChapter={onCreateChapter}
            onCreateBranch={handleCreateBranch}
            onSwitchBranch={onSwitchBranch}
            onSwitchChapter={onSwitchChapter}
            currentUserName={currentUserName}
          />
        </div>
      </ResizablePanel>
      
      <ResizableHandle withHandle className="hover:bg-primary/10 transition-colors" />
      
      <ResizablePanel defaultSize={defaultLayout[1]} minSize={30} className="h-full min-h-0 overflow-hidden">
        <div className="h-full min-h-0 overflow-hidden">
          <StoryEditorContent
            chapters={chapters}
            activeChapter={activeChapter}
            onUpdateChapterContent={onUpdateChapterContent}
            onSubmitChapterForReview={onSubmitChapterForReview}
          />
        </div>
      </ResizablePanel>
      
      <ResizableHandle withHandle className="hover:bg-primary/10 transition-colors" />
      
      <ResizablePanel defaultSize={defaultLayout[2]} minSize={15} className="h-full min-h-0 overflow-hidden">
        <div className="h-full min-h-0 bg-background flex flex-col overflow-hidden">
          {isAdmin ? (
            // Admin Mode: Show full merge interface
            <Tabs defaultValue="savepoints" className="h-full min-h-0 flex flex-col overflow-hidden">
              <div className="bg-white border-b border-gray-200 px-4 py-2 shadow-sm flex-shrink-0">
                <TabsList>
                  <TabsTrigger value="savepoints" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Save Points
                  </TabsTrigger>
                  <TabsTrigger value="merge" className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    Merge
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="flex-1 min-h-0 overflow-y-auto scroll-stable">
                <TabsContent value="savepoints" className="h-full m-0 p-4">
                  <SavePointsPanel
                    savePoints={savePoints}
                    onCreateSavePoint={onCreateSavePoint}
                    onRestoreSavePoint={onRestoreSavePoint}
                  />
                </TabsContent>
                
                <TabsContent value="merge" className="h-full m-0 p-4">
                  <MergeInterface
                    branches={branches}
                    chapters={chapters}
                    activeBranch={activeBranch}
                    onMergeChapter={onMergeChapter}
                    onMergeStoryVersion={onMergeStoryVersion}
                    onLoadTargetChapters={onLoadTargetChapters}
                  />
                </TabsContent>
              </div>
            </Tabs>
          ) : (
            // Writer Mode: Show simplified progress view
            <Tabs defaultValue="progress" className="h-full min-h-0 flex flex-col overflow-hidden">
              <div className="bg-white border-b border-gray-200 px-4 py-2 shadow-sm flex-shrink-0">
                <TabsList>
                  <TabsTrigger value="progress" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    My Progress
                  </TabsTrigger>
                  <TabsTrigger value="savepoints" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Save Points
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="flex-1 min-h-0 overflow-y-auto scroll-stable">
                <TabsContent value="progress" className="h-full m-0 p-4">
                  <WriterProgressPanel
                    chapters={chapters}
                    currentUserName={currentUserName}
                  />
                </TabsContent>
                
                <TabsContent value="savepoints" className="h-full m-0 p-4">
                  <SavePointsPanel
                    savePoints={savePoints}
                    onCreateSavePoint={onCreateSavePoint}
                    onRestoreSavePoint={onRestoreSavePoint}
                  />
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default StoryEditor;
