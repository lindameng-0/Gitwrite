import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GitBranch, FileText, Shield, Pencil, BookOpen, History } from 'lucide-react';
import StoryEditor from './StoryEditor';
import BranchVisualizer, { BranchVisualizerRef } from './BranchVisualizer';
import MainStoryPreview from './MainStoryPreview';
import type { StoryBranchWithMeta, ChapterWithReviews, SavePoint } from '@/hooks/useStoryData';

interface StoryBranchStudioProps {
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
  onSaveBranchPosition?: (branchId: string, x: number, y: number) => Promise<boolean>;
  isAdmin?: boolean;
  currentUserName?: string;
}

const StoryBranchStudio: React.FC<StoryBranchStudioProps> = ({
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
  onMoveChapter,
  onSaveBranchPosition,
  isAdmin = true,
  currentUserName
}) => {
  const [activeTab, setActiveTab] = useState('editor');
  const branchVisualizerRef = React.useRef<BranchVisualizerRef>(null);

  // Get main branch
  const mainBranch = branches.find(b => b.is_main);
  const isOnMainBranch = mainBranch?.id === activeBranch;

  // Save positions when switching away from branches tab
  const handleTabChange = (newTab: string) => {
    if (activeTab === 'branches' && branchVisualizerRef.current) {
      branchVisualizerRef.current.savePositions();
    }
    setActiveTab(newTab);
  };

  return (
    <div className="h-full min-h-0 bg-gradient-to-br from-background to-muted/20">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full min-h-0 flex flex-col">
        <div className="bg-background border-b border-border px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="main-story" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Main Story
              </TabsTrigger>
              <TabsTrigger value="editor" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Chapter Editor
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="branches" className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Visualizer
                </TabsTrigger>
              )}
            </TabsList>
            
            {/* Role Mode Indicator */}
            <div className="flex items-center gap-3">
              {/* Current Branch Indicator */}
              {!isOnMainBranch && (
                <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
                  <GitBranch className="w-3.5 h-3.5" />
                  {branches.find(b => b.id === activeBranch)?.name || 'Branch'}
                </Badge>
              )}
              
              <Badge 
                variant="outline" 
                className={`flex items-center gap-1.5 px-3 py-1 ${
                  isAdmin 
                    ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-950 dark:text-amber-300' 
                    : 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-950 dark:text-blue-300'
                }`}
              >
                {isAdmin ? (
                  <>
                    <Shield className="w-3.5 h-3.5" />
                    Review Mode
                  </>
                ) : (
                  <>
                    <Pencil className="w-3.5 h-3.5" />
                    Writing Mode
                  </>
                )}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {/* Main Story Preview Tab */}
          <TabsContent value="main-story" className="h-full min-h-0 m-0 overflow-hidden">
            <MainStoryPreview 
              chapters={mainBranchChapters}
            />
          </TabsContent>

          {/* Chapter Editor Tab */}
          <TabsContent value="editor" className="h-full min-h-0 m-0 overflow-hidden">
            <StoryEditor 
              branches={branches}
              chapters={chapters}
              mainBranchChapters={mainBranchChapters}
              savePoints={savePoints}
              activeBranch={activeBranch}
              activeChapter={activeChapter}
              onUpdateChapterContent={onUpdateChapterContent}
              onCreateChapter={onCreateChapter}
              onCreateSavePoint={onCreateSavePoint}
              onSubmitChapterForReview={onSubmitChapterForReview}
              onReviewChapter={onReviewChapter}
              onCreateBranch={onCreateBranch}
              onForkFromChapter={onForkFromChapter}
              onSwitchBranch={onSwitchBranch}
              onSwitchChapter={onSwitchChapter}
              onRestoreSavePoint={onRestoreSavePoint}
              onLoadTargetChapters={onLoadTargetChapters}
              onMergeChapter={onMergeChapter}
              onMergeStoryVersion={onMergeStoryVersion}
              onMoveChapter={onMoveChapter}
              isAdmin={isAdmin}
              currentUserName={currentUserName}
            />
          </TabsContent>
          
          {/* Branch Visualizer Tab (Admin Only) */}
          {isAdmin && (
            <TabsContent value="branches" className="h-full min-h-0 m-0 overflow-hidden">
              <BranchVisualizer 
                ref={branchVisualizerRef}
                branches={branches}
                chapters={chapters}
                activeBranch={activeBranch}
                onBranchSelect={onSwitchBranch}
                onSaveBranchPosition={onSaveBranchPosition}
              />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default StoryBranchStudio;
