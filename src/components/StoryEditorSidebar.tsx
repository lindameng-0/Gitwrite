
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Plus, Users } from 'lucide-react';
import BranchCreationForm from './BranchCreationForm';
import type { StoryBranchWithMeta } from '@/hooks/useStoryData';

interface StoryEditorSidebarProps {
  branches: StoryBranchWithMeta[];
  activeBranch: string;
  newBranchName: string;
  setNewBranchName: (name: string) => void;
  isCreatingBranch: boolean;
  setIsCreatingBranch: (creating: boolean) => void;
  onCreateBranch: () => void;
  onSwitchBranch: (branchId: string) => void;
}

const StoryEditorSidebar: React.FC<StoryEditorSidebarProps> = ({
  branches,
  activeBranch,
  newBranchName,
  setNewBranchName,
  isCreatingBranch,
  setIsCreatingBranch,
  onCreateBranch,
  onSwitchBranch
}) => {
  return (
    <div className="w-80 bg-white border-r border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Plot Branch Studio</h1>
        <p className="text-sm text-gray-600">Collaborative story version control</p>
      </div>

      <div className="p-4">
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

        <div className="space-y-2">
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
      </div>
    </div>
  );
};

export default StoryEditorSidebar;
