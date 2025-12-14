import React, { useState, useEffect } from 'react';
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
  onMergeChapter: (chapterId: string, targetBranchId: string, mode: 'replace' | 'insert' | 'append' | 'subplot' | 'flashback', mergeNote?: string, targetPosition?: number, replaceChapterId?: string) => Promise<boolean>;
  onMergeStoryVersion: (sourceBranchId: string, targetBranchId: string, mergeNote?: string) => Promise<boolean>;
  onMoveChapter?: (chapterId: string, targetBranchId: string) => Promise<boolean>;
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

  // Update content when chapter changes
  useEffect(() => {
    setContent(chapter.content);
  }, [chapter.content, chapter.id]);

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
    <div className="flex flex-col h-full overflow-hidden">
      <div className="bg-background border-b border-border px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{chapter.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={`text-xs ${
              chapter.status === 'approved' ? 'bg-green-100 text-green-800' :
              chapter.status === 'review' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {chapter.status}
            </Badge>
            <span className="text-sm text-gray-500">by {chapter.author_name}</span>
          </div>
        </div>
        <div className="space-x-2">
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          {chapter.status === 'draft' && (
            <Button size="sm" variant="secondary" onClick={handleSubmitForReview}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Submit for Review
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto bg-white shadow-sm border border-gray-200 rounded-sm min-h-[800px]">
          <Textarea
            value={content}
            onChange={handleContentChange}
            className="w-full min-h-[800px] resize-none focus:outline-none bg-white border-0 text-gray-900 p-8 text-base leading-relaxed"
            placeholder="Begin writing your chapter..."
          />
        </div>
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
      <div className="flex items-center justify-center h-full bg-white overflow-hidden">
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
      key={chapter.id} // Add key to force re-render when chapter changes
      chapter={chapter} 
      onUpdateChapterContent={onUpdateChapterContent}
      onSubmitChapterForReview={onSubmitChapterForReview}
    />
  );
};

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
  onMergeStoryVersion
}) => {
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const { toast } = useToast()

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

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel defaultSize={25} minSize={15} className="overflow-hidden">
        <div className="h-full overflow-y-auto">
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
          />
        </div>
      </ResizablePanel>
      
      <ResizableHandle className="bg-border w-px" />
      
      <ResizablePanel defaultSize={50} minSize={30} className="overflow-hidden">
        <StoryEditorContent
          chapters={chapters}
          activeChapter={activeChapter}
          onUpdateChapterContent={onUpdateChapterContent}
          onSubmitChapterForReview={onSubmitChapterForReview}
        />
      </ResizablePanel>
      
      <ResizableHandle className="bg-border w-px" />
      
      <ResizablePanel defaultSize={25} minSize={15} className="overflow-hidden">
        <div className="h-full bg-background flex flex-col overflow-hidden">
          <Tabs defaultValue="savepoints" className="h-full flex flex-col overflow-hidden">
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
            
            <div className="flex-1 overflow-y-auto">
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
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default StoryEditor;
