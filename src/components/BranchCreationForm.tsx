
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface BranchCreationFormProps {
  newBranchName: string;
  setNewBranchName: (name: string) => void;
  onCreateBranch: () => void;
  onCancel: () => void;
}

const BranchCreationForm: React.FC<BranchCreationFormProps> = ({
  newBranchName,
  setNewBranchName,
  onCreateBranch,
  onCancel
}) => {
  return (
    <div className="mb-4 p-3 bg-gray-50 rounded-lg animate-fade-in">
      <Input
        placeholder="Branch name..."
        value={newBranchName}
        onChange={(e) => setNewBranchName(e.target.value)}
        className="mb-2"
        onKeyPress={(e) => e.key === 'Enter' && onCreateBranch()}
      />
      <div className="flex gap-2">
        <Button onClick={onCreateBranch} size="sm" className="bg-story-600 hover:bg-story-700">
          Create
        </Button>
        <Button onClick={onCancel} variant="outline" size="sm">
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default BranchCreationForm;
