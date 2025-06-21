
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Save, GitBranch } from 'lucide-react';
import type { StoryBranchWithMeta } from '@/hooks/useStoryData';

interface StoryEditorHeaderProps {
  currentBranch: StoryBranchWithMeta | undefined;
  isSaving: boolean;
  onSave: () => void;
  onMergeBranch: () => void;
}

const StoryEditorHeader: React.FC<StoryEditorHeaderProps> = ({
  currentBranch,
  isSaving,
  onSave,
  onMergeBranch
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-story-600" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {currentBranch?.name}
            </h1>
            <p className="text-sm text-gray-500">
              By {currentBranch?.author_name} • Last edited {currentBranch ? new Date(currentBranch.updated_at).toLocaleDateString() : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={onSave}
            disabled={isSaving}
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          {currentBranch && !currentBranch.is_main && (
            <Button 
              size="sm" 
              className="bg-story-600 hover:bg-story-700 flex items-center gap-2"
              onClick={onMergeBranch}
            >
              <GitBranch className="w-4 h-4" />
              Merge Branch
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryEditorHeader;
