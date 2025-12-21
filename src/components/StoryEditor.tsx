import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Layers, Clock, BarChart3, Lock, ArrowRight } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import ChapterFirstSidebar from './ChapterFirstSidebar';
import StoryEditorContent from './StoryEditorContent';
import SavePointsPanel from './SavePointsPanel';
import MergeInterface from './MergeInterface';
import WriterProgressPanel from './WriterProgressPanel';
import type { StoryBranchWithMeta, ChapterWithReviews, SavePoint } from '@/hooks/useStoryData';

interface StoryEditorProps {
  branches: StoryBranchWithMeta[];
  chapters: ChapterWithReviews[];
  mainBranchChapters: ChapterWithReviews[]; // Always main branch chapters for sidebar
  savePoints: SavePoint[];
  activeBranch: string;
  activeChapter: string;
  onUpdateChapterContent: (chapterId: string, content: string) => Promise<void>;
  onCreateChapter: (title: string, chapterOrder?: number) => Promise<string | null>;
  onCreateSavePoint: (title: string, description?: string) => Promise<string | null>;
  onSubmitChapterForReview: (chapterId: string) => Promise<void>;
  onReviewChapter: (chapterId: string, status: 'approved' | 'changes_requested', feedback?: string) => Promise<void>;
  onCreateBranch: (name: string, parentBranchId?: string) => Promise<string | null>;
  onForkFromChapter?: (name: string, forkChapterId: string) => Promise<string | null>;
  onSwitchBranch: (branchId: string) => Promise<void>;
  onSwitchChapter: React.Dispatch<React.SetStateAction<string>>;
  onRestoreSavePoint: (savePointId: string) => Promise<boolean>;
  onLoadTargetChapters: (branchId: string) => Promise<ChapterWithReviews[]>;
  onMergeChapter: (chapterId: string, targetBranchId: string, mode: 'replace' | 'insert' | 'append' | 'subplot' | 'flashback', mergeNote?: string, targetPosition?: number, replaceChapterId?: string) => Promise<boolean>;
  onMergeStoryVersion: (sourceBranchId: string, targetBranchId: string, mergeNote?: string) => Promise<boolean>;
  onMoveChapter?: (chapterId: string, targetBranchId: string) => Promise<boolean>;
  isAdmin?: boolean;
  currentUserName?: string;
}

const PANEL_LAYOUT_KEY = 'story-editor-panel-layout';

const StoryEditor: React.FC<StoryEditorProps> = ({
  branches,
  chapters,
  mainBranchChapters,
  savePoints,
  activeBranch,
  activeChapter,
  onUpdateChapterContent,
  onCreateChapter,
  onCreateSavePoint,
  onSubmitChapterForReview,
  onReviewChapter,
  onCreateBranch,
  onForkFromChapter,
  onSwitchBranch,
  onSwitchChapter,
  onRestoreSavePoint,
  onLoadTargetChapters,
  onMergeChapter,
  onMergeStoryVersion,
  isAdmin = true,
  currentUserName
}) => {
  const { toast } = useToast();

  // Get current branch info for context banner
  const mainBranch = branches.find(b => b.is_main);
  const currentBranch = branches.find(b => b.id === activeBranch);
  const isOnMainBranch = mainBranch?.id === activeBranch;
  const forkPointChapter = currentBranch?.fork_point_order 
    ? chapters.find(c => c.chapter_order === currentBranch.fork_point_order)
    : null;

  const getDefaultLayout = (): number[] => {
    const saved = localStorage.getItem(PANEL_LAYOUT_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [22, 53, 25];
      }
    }
    return [22, 53, 25];
  };

  const handleLayoutChange = (sizes: number[]) => {
    localStorage.setItem(PANEL_LAYOUT_KEY, JSON.stringify(sizes));
  };

  const defaultLayout = getDefaultLayout();

  return (
    <ResizablePanelGroup 
      direction="horizontal" 
      className="h-full min-h-0 overflow-hidden"
      onLayout={handleLayoutChange}
    >
      <ResizablePanel defaultSize={defaultLayout[0]} minSize={18} className="h-full min-h-0 overflow-hidden">
        <div className="h-full min-h-0 overflow-hidden">
          <ChapterFirstSidebar
            branches={branches}
            chapters={chapters}
            mainBranchChapters={mainBranchChapters}
            activeBranch={activeBranch}
            activeChapter={activeChapter}
            onCreateChapter={onCreateChapter}
            onSwitchBranch={onSwitchBranch}
            onSwitchChapter={onSwitchChapter}
            onForkFromChapter={onForkFromChapter}
            currentUserName={currentUserName}
            isAdmin={isAdmin}
          />
        </div>
      </ResizablePanel>
      
      <ResizableHandle withHandle className="hover:bg-primary/10 transition-colors" />
      
      <ResizablePanel defaultSize={defaultLayout[1]} minSize={30} className="h-full min-h-0 overflow-hidden">
        <div className="h-full min-h-0 overflow-hidden flex flex-col">
          {/* Draft Context Banner */}
          {!isOnMainBranch && currentBranch && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2 text-sm">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-900 dark:text-blue-100">
                  Editing: <span className="font-medium">{currentBranch.name}</span>
                </span>
                {forkPointChapter && (
                  <span className="text-blue-700 dark:text-blue-300">
                    (based on Chapter {forkPointChapter.chapter_order})
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                onClick={() => mainBranch && onSwitchBranch(mainBranch.id)}
              >
                <Lock className="w-3 h-3 mr-1" />
                View Published
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          )}
          
          <div className="flex-1 min-h-0 overflow-hidden">
            <StoryEditorContent
              chapters={chapters}
              activeChapter={activeChapter}
              onUpdateChapterContent={onUpdateChapterContent}
              onSubmitChapterForReview={onSubmitChapterForReview}
              activeBranch={currentBranch}
            />
          </div>
        </div>
      </ResizablePanel>
      
      <ResizableHandle withHandle className="hover:bg-primary/10 transition-colors" />
      
      <ResizablePanel defaultSize={defaultLayout[2]} minSize={15} className="h-full min-h-0 overflow-hidden">
        <div className="h-full min-h-0 bg-background flex flex-col overflow-hidden">
          {isAdmin ? (
            <Tabs defaultValue="savepoints" className="h-full min-h-0 flex flex-col overflow-hidden">
              <div className="bg-background border-b border-border px-4 py-2 shadow-sm flex-shrink-0">
                <TabsList>
                  <TabsTrigger value="savepoints" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Save Points
                  </TabsTrigger>
              <TabsTrigger value="merge" className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Publish
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
            <Tabs defaultValue="progress" className="h-full min-h-0 flex flex-col overflow-hidden">
              <div className="bg-background border-b border-border px-4 py-2 shadow-sm flex-shrink-0">
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
