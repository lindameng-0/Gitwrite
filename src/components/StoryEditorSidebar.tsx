
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { GitBranch, Plus, Users, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import BranchCreationForm from './BranchCreationForm';
import type { StoryBranchWithMeta, ChapterWithReviews } from '@/hooks/useStoryData';

interface StoryEditorSidebarProps {
  branches: StoryBranchWithMeta[];
  chapters: ChapterWithReviews[];
  activeBranch: string;
  activeChapter: string;
  newBranchName: string;
  setNewBranchName: (name: string) => void;
  isCreatingBranch: boolean;
  setIsCreatingBranch: (creating: boolean) => void;
  onCreateChapter: (title: string, chapterOrder?: number) => Promise<string | null>;
  onCreateBranch: () => void;
  onSwitchBranch: (branchId: string) => void;
  onSwitchChapter: React.Dispatch<React.SetStateAction<string>>;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'draft': return <FileText className="w-4 h-4 text-gray-500" />;
    case 'review': return <Clock className="w-4 h-4 text-blue-500" />;
    case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'merged': return <CheckCircle className="w-4 h-4 text-blue-500" />;
    default: return <FileText className="w-4 h-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'bg-gray-100 text-gray-800';
    case 'review': return 'bg-blue-100 text-blue-800';
    case 'approved': return 'bg-green-100 text-green-800';
    case 'merged': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const StoryEditorSidebar: React.FC<StoryEditorSidebarProps> = ({
  branches,
  chapters,
  activeBranch,
  activeChapter,
  newBranchName,
  setNewBranchName,
  isCreatingBranch,
  setIsCreatingBranch,
  onCreateChapter,
  onCreateBranch,
  onSwitchBranch,
  onSwitchChapter
}) => {
  const [isCreatingChapter, setIsCreatingChapter] = React.useState(false);
  const [newChapterTitle, setNewChapterTitle] = React.useState('');

  const handleCreateChapter = async () => {
    if (!newChapterTitle.trim()) return;
    
    try {
      await onCreateChapter(newChapterTitle);
      setNewChapterTitle('');
      setIsCreatingChapter(false);
    } catch (error) {
      console.error('Error creating chapter:', error);
    }
  };

  return (
    <div className="w-full bg-white border-r border-gray-200 shadow-sm h-full overflow-y-auto">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Plot Branch Studio</h1>
        <p className="text-sm text-gray-600">Collaborative story version control</p>
      </div>

      <div className="p-4">
        {/* Branches Section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-story-600" />
            Story Branches
          </h2>
          <Button
            onClick={() => setIsCreatingBranch(true)}
            size="sm"
            className="bg-story-600 hover:bg-story-700"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {isCreatingBranch && (
          <BranchCreationForm
            newBranchName={newBranchName}
            setNewBranchName={setNewBranchName}
            onCreateBranch={onCreateBranch}
            onCancel={() => setIsCreatingBranch(false)}
          />
        )}

        <div className="space-y-2 mb-6">
          {branches.map((branch) => (
            <Card
              key={branch.id}
              className={`p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
                branch.id === activeBranch 
                  ? 'border-story-500 bg-story-50 shadow-sm' 
                  : 'border-gray-200 hover:border-story-300'
              }`}
              onClick={() => onSwitchBranch(branch.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                  {branch.name}
                </h3>
                {branch.id === activeBranch && (
                  <Badge variant="secondary" className="bg-story-100 text-story-800 text-xs">
                    Active
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Users className="w-3 h-3" />
                <span>{branch.author_name}</span>
                <span>•</span>
                <span>{new Date(branch.created_at).toLocaleDateString()}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Chapters Section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-story-600" />
            Chapters
          </h2>
          <Button
            onClick={() => setIsCreatingChapter(true)}
            size="sm"
            variant="outline"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {isCreatingChapter && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <Input
              placeholder="Chapter title..."
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              className="mb-2"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreateChapter}>
                Create
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setIsCreatingChapter(false);
                  setNewChapterTitle('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {chapters.map((chapter) => (
            <Card
              key={chapter.id}
              className={`p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
                chapter.id === activeChapter 
                  ? 'border-story-500 bg-story-50 shadow-sm' 
                  : 'border-gray-200 hover:border-story-300'
              }`}
              onClick={() => onSwitchChapter(chapter.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                  {chapter.title}
                </h3>
                <div className="flex items-center gap-2">
                  {getStatusIcon(chapter.status)}
                  <Badge className={`${getStatusColor(chapter.status)} text-xs`}>
                    {chapter.status}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Order: {chapter.chapter_order}</span>
                <span>•</span>
                <span>{new Date(chapter.created_at).toLocaleDateString()}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoryEditorSidebar;
