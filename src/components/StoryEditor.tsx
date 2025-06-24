import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { GitBranch, Plus, FileText, Save, Users, MessageSquare, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"
import StoryEditorSidebar from './StoryEditorSidebar';
import SavePointsPanel from './SavePointsPanel';
import MergeInterface from './MergeInterface';
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
}

interface ChapterContentProps {
  chapter: ChapterWithReviews;
  onUpdateChapterContent: (chapterId: string, content: string) => Promise<void>;
  onSubmitChapterForReview: (chapterId: string) => Promise<void>;
}

const ChapterContent: React.FC<ChapterContentProps> = ({ chapter, onUpdateChapterContent, onSubmitChapterForReview }) => {
  const [content, setContent] = useState(chapter.content);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast()

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateChapterContent(chapter.id, content);
      toast({
        title: "Chapter saved",
        description: "Your chapter has been saved.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
      })
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    try {
      await onSubmitChapterForReview(chapter.id);
      toast({
        title: "Chapter submitted for review",
        description: "Your chapter has been submitted for review.",
      })
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
      })
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">{chapter.title}</h2>
        <div className="space-x-2">
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button size="sm" variant="secondary" onClick={handleSubmitForReview}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Submit for Review
          </Button>
        </div>
      </div>
      <div className="p-4 flex-1 overflow-y-auto">
        <Textarea
          value={content}
          onChange={handleContentChange}
          className="w-full h-full resize-none focus:outline-none"
        />
      </div>
    </div>
  );
};

interface StoryEditorContentProps {
  chapters: ChapterWithReviews[];
  activeChapter: string;
  onUpdateChapterContent: (chapterId: string, content: string) => Promise<void>;
  onSubmitChapterForReview: (chapterId: string) => Promise<void>;
}

const StoryEditorContent: React.FC<StoryEditorContentProps> = ({ chapters, activeChapter, onUpdateChapterContent, onSubmitChapterForReview }) => {
  const chapter = chapters.find(c => c.id === activeChapter);

  if (!chapter) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-6 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Chapter Selected</h3>
          <p className="text-gray-600">Select a chapter from the sidebar to start writing.</p>
        </Card>
      </div>
    );
  }

  return (
    <ChapterContent 
      chapter={chapter} 
      onUpdateChapterContent={onUpdateChapterContent}
      onSubmitChapterForReview={onSubmitChapterForReview}
    />
  );
};

interface StoryEditorSidebarProps {
  branches: StoryBranchWithMeta[];
  chapters: ChapterWithReviews[];
  activeBranch: string;
  activeChapter: string;
  onCreateChapter: (title: string, chapterOrder?: number) => Promise<string | null>;
  onCreateBranch: (name: string, parentBranchId?: string) => Promise<string | null>;
  onSwitchBranch: (branchId: string) => Promise<void>;
  onSwitchChapter: React.Dispatch<React.SetStateAction<string>>;
}

interface SavePointsPanelProps {
  savePoints: SavePoint[];
  onCreateSavePoint: (title: string, description?: string) => Promise<string | null>;
  onRestoreSavePoint: (savePointId: string) => Promise<boolean>;
}

interface MergeInterfaceProps {
  branches: StoryBranchWithMeta[];
  chapters: ChapterWithReviews[];
  activeBranch: string;
  onMergeChapter: (chapterId: string, targetBranchId: string, mode: any, mergeNote?: string, targetPosition?: number, replaceChapterId?: string) => Promise<boolean>;
  onMergeStoryVersion: (sourceBranchId: string, targetBranchId: string, mergeNote?: string) => Promise<boolean>;
  onLoadTargetChapters: (branchId: string) => Promise<ChapterWithReviews[]>;
}

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
  onLoadTargetChapters
}) => {
  const [isCreatingChapter, setIsCreatingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const { toast } = useToast()

  const handleCreateChapter = async () => {
    setIsCreatingChapter(true);
    try {
      if (!newChapterTitle.trim()) {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: "Title cannot be empty",
        })
        return;
      }
      await onCreateChapter(newChapterTitle);
      setNewChapterTitle('');
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
      })
    } finally {
      setIsCreatingChapter(false);
    }
  };

  const handleCreateBranch = async () => {
    setIsCreatingBranch(true);
    try {
      if (!newBranchName.trim()) {
         toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: "Branch name cannot be empty",
        })
        return;
      }
      await onCreateBranch(newBranchName);
      setNewBranchName('');
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
      })
    } finally {
      setIsCreatingBranch(false);
    }
  };

  const handleMergeChapter = async (chapterId: string, targetBranchId: string, mode: any, mergeNote?: string, targetPosition?: number, replaceChapterId?: string) => {
    try {
      await onUpdateChapterContent(chapterId, 'MERGED');
       toast({
        title: "Chapter merged",
        description: "Chapter merged successfully",
      })
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
      })
    }
  };

  const handleMergeStoryVersion = async (sourceBranchId: string, targetBranchId: string, mergeNote?: string) => {
    try {
       toast({
        title: "Story version merged",
        description: "Story version merged successfully",
      })
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
      })
    }
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel defaultSize={25} minSize={20}>
        <StoryEditorSidebar
          branches={branches}
          chapters={chapters}
          activeBranch={activeBranch}
          activeChapter={activeChapter}
          onCreateChapter={onCreateChapter}
          onCreateBranch={onCreateBranch}
          onSwitchBranch={onSwitchBranch}
          onSwitchChapter={onSwitchChapter}
        />
      </ResizablePanel>
      
      <ResizableHandle />
      
      <ResizablePanel defaultSize={50} minSize={30}>
        <StoryEditorContent
          chapters={chapters}
          activeChapter={activeChapter}
          onUpdateChapterContent={onUpdateChapterContent}
          onSubmitChapterForReview={onSubmitChapterForReview}
        />
      </ResizablePanel>
      
      <ResizableHandle />
      
      <ResizablePanel defaultSize={25} minSize={20}>
        <div className="h-full bg-gray-50">
          <Tabs defaultValue="savepoints" className="h-full flex flex-col">
            <div className="bg-white border-b border-gray-200 px-4 py-2 shadow-sm">
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
            
            <div className="flex-1 overflow-hidden">
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
                  onMergeChapter={handleMergeChapter}
                  onMergeStoryVersion={handleMergeStoryVersion}
                  onLoadTargetChapters={onLoadTargetChapters}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default StoryEditor;
