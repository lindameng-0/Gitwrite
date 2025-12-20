
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { GitBranch, Plus, FileText, Save, Users, MessageSquare, CheckCircle, Clock, AlertTriangle, Shield, Pencil } from 'lucide-react';
import StoryEditor from './StoryEditor';
import BranchVisualizer, { BranchVisualizerRef } from './BranchVisualizer';
import type { StoryBranchWithMeta, ChapterWithReviews, SavePoint } from '@/hooks/useStoryData';

interface StoryBranchStudioProps {
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
  onSaveBranchPosition?: (branchId: string, x: number, y: number) => Promise<boolean>;
  // Role-based props
  isAdmin?: boolean;
  currentUserName?: string;
}

const StoryBranchStudio: React.FC<StoryBranchStudioProps> = ({
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
  onMoveChapter,
  onSaveBranchPosition,
  isAdmin = true,
  currentUserName
}) => {
  const [activeTab, setActiveTab] = useState('editor');
  const branchVisualizerRef = React.useRef<BranchVisualizerRef>(null);

  // Save positions when switching away from branches tab
  const handleTabChange = (newTab: string) => {
    if (activeTab === 'branches' && branchVisualizerRef.current) {
      branchVisualizerRef.current.savePositions();
    }
    setActiveTab(newTab);
  };

  return (
    <div className="h-full min-h-0 bg-gradient-to-br from-blue-50 to-indigo-50">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full min-h-0 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <TabsList className="bg-gray-100">
              <TabsTrigger value="editor" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Story Editor
              </TabsTrigger>
              {/* Only show Branch Visualizer for admins */}
              {isAdmin && (
                <TabsTrigger value="branches" className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Branch Visualizer
                </TabsTrigger>
              )}
            </TabsList>
            
            {/* Role Mode Indicator */}
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
                  Admin Mode
                </>
              ) : (
                <>
                  <Pencil className="w-3.5 h-3.5" />
                  Writer Mode
                </>
              )}
            </Badge>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <TabsContent value="editor" className="h-full min-h-0 m-0 overflow-hidden">
            <StoryEditor 
              branches={branches}
              chapters={chapters}
              savePoints={savePoints}
              activeBranch={activeBranch}
              activeChapter={activeChapter}
              onUpdateChapterContent={onUpdateChapterContent}
              onCreateChapter={onCreateChapter}
              onCreateSavePoint={onCreateSavePoint}
              onSubmitChapterForReview={onSubmitChapterForReview}
              onReviewChapter={onReviewChapter}
              onCreateBranch={onCreateBranch}
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
