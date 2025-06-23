import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  FileText, 
  GitBranch, 
  Send, 
  CheckCircle, 
  Clock,
  BookOpen
} from 'lucide-react';
import ChapterEditor from './ChapterEditor';
import BranchCreationForm from './BranchCreationForm';
import SavePointsPanel from './SavePointsPanel';
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
  onSwitchChapter: (chapterId: string) => void;
  onRestoreSavePoint: (savePointId: string) => Promise<boolean>;
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
  onRestoreSavePoint
}) => {
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newVersionName, setNewVersionName] = useState('');
  const [isCreatingChapter, setIsCreatingChapter] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const getCurrentBranch = () => branches.find(b => b.id === activeBranch);
  const getCurrentChapter = () => chapters.find(c => c.id === activeChapter);

  const handleCreateChapter = async () => {
    if (!newChapterTitle.trim()) return;
    
    setIsCreatingChapter(true);
    try {
      const chapterId = await onCreateChapter(newChapterTitle);
      if (chapterId) {
        toast({
          title: "Chapter created!",
          description: `Created new chapter: ${newChapterTitle}`,
        });
        setNewChapterTitle('');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create chapter.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingChapter(false);
    }
  };

  const handleCreateVersion = async () => {
    if (!newVersionName.trim()) return;
    
    setIsCreatingVersion(true);
    try {
      const versionId = await onCreateBranch(newVersionName);
      if (versionId) {
        toast({
          title: "Story version created!",
          description: `Created new version: ${newVersionName}`,
        });
        setNewVersionName('');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create story version.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingVersion(false);
    }
  };

  const handleUpdateContent = async (chapterId: string, content: string) => {
    setIsSaving(true);
    try {
      await onUpdateChapterContent(chapterId, content);
      toast({
        title: "Saved!",
        description: "Chapter has been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save chapter.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitForReview = async (chapterId: string) => {
    try {
      await onSubmitChapterForReview(chapterId);
      toast({
        title: "Submitted for review!",
        description: "Chapter is now awaiting review.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit chapter for review.",
        variant: "destructive",
      });
    }
  };

  const handleReviewChapter = async (chapterId: string, status: 'approved' | 'changes_requested', feedback?: string) => {
    try {
      await onReviewChapter(chapterId, status, feedback);
      toast({
        title: "Review submitted!",
        description: `Chapter ${status === 'approved' ? 'approved' : 'requires changes'}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'review': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'merged': return <CheckCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'merged': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const currentBranch = getCurrentBranch();
  const currentChapter = getCurrentChapter();

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Left Sidebar - Story Versions & Chapters */}
      <div className="w-80 bg-white border-r border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Story Versions</h2>
          </div>
          
          {/* Version Creation */}
          <div className="mb-4">
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="New version name (e.g., 'alternate-ending')..."
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateVersion()}
                className="text-sm"
              />
              <Button 
                onClick={handleCreateVersion} 
                size="sm"
                disabled={!newVersionName.trim() || isCreatingVersion}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Create alternate versions to experiment with different story directions
            </p>
          </div>

          {/* Version List */}
          <div className="space-y-2 mb-4">
            {branches.map((branch) => (
              <Card
                key={branch.id}
                className={`p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  branch.id === activeBranch 
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
                onClick={() => onSwitchBranch(branch.id)}
              >
                <div className="flex items-center gap-2 mb-1">
                  {branch.is_main ? (
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <GitBranch className="w-4 h-4 text-purple-600" />
                  )}
                  <span className="font-medium text-sm">
                    {branch.is_main ? 'Main Story' : branch.name}
                  </span>
                  {branch.id === activeBranch && (
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 text-xs">
                      Active
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {branch.author_name} • {new Date(branch.created_at).toLocaleDateString()}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Chapters Section */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Chapters
            </h2>
            <span className="text-sm text-gray-500">{chapters.length} chapters</span>
          </div>

          {/* Chapter Creation */}
          <div className="mb-4">
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="New chapter title..."
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateChapter()}
                className="text-sm"
              />
              <Button 
                onClick={handleCreateChapter} 
                size="sm"
                disabled={!newChapterTitle.trim() || isCreatingChapter}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Chapter List */}
          <div className="space-y-2">
            {chapters.map((chapter) => (
              <Card
                key={chapter.id}
                className={`p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  chapter.id === activeChapter 
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
                onClick={() => onSwitchChapter(chapter.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <span className="font-medium text-sm line-clamp-2">
                      {chapter.title}
                    </span>
                  </div>
                  <Badge className={`text-xs ml-2 flex-shrink-0 ${
                    chapter.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    chapter.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                    chapter.status === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {chapter.status}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500">
                  Chapter {chapter.chapter_order} • {chapter.author_name}
                  {chapter.reviews.length > 0 && (
                    <span className="ml-2">• {chapter.reviews.length} comments</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {chapter.content.split(' ').filter(w => w.length > 0).length} words
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <ChapterEditor
        chapter={currentChapter || null}
        onContentChange={async (chapterId: string, content: string) => {
          setIsSaving(true);
          try {
            await onUpdateChapterContent(chapterId, content);
            toast({
              title: "Saved!",
              description: "Chapter has been saved.",
            });
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to save chapter.",
              variant: "destructive",
            });
          } finally {
            setIsSaving(false);
          }
        }}
        onSubmitForReview={async (chapterId: string) => {
          try {
            await onSubmitChapterForReview(chapterId);
            toast({
              title: "Submitted for review!",
              description: "Chapter is now awaiting review.",
            });
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to submit chapter for review.",
              variant: "destructive",
            });
          }
        }}
        onReviewChapter={async (chapterId: string, status: 'approved' | 'changes_requested', feedback?: string) => {
          try {
            await onReviewChapter(chapterId, status, feedback);
            toast({
              title: "Review submitted!",
              description: `Chapter ${status === 'approved' ? 'approved' : 'requires changes'}.`,
            });
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to submit review.",
              variant: "destructive",
            });
          }
        }}
        isSaving={isSaving}
      />

      {/* Right Sidebar - Save Points */}
      <SavePointsPanel
        savePoints={savePoints}
        onCreateSavePoint={onCreateSavePoint}
        onRestoreSavePoint={async (savePointId: string) => {
          try {
            // This would need to be passed as a prop in real implementation
            // For now, we'll show a placeholder toast
            toast({
              title: "Restoration not implemented",
              description: "Save point restoration needs to be implemented in the parent component.",
              variant: "destructive",
            });
            return false;
          } catch (error) {
            return false;
          }
        }}
      />
    </div>
  );
};

export default StoryEditor;
