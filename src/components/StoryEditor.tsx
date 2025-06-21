
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Save, Plus, FileText, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { StoryBranchWithMeta } from '@/hooks/useStoryData';

interface StoryEditorProps {
  branches: StoryBranchWithMeta[];
  activeBranch: string;
  onUpdateContent: (branchId: string, content: string) => Promise<void>;
  onCreateBranch: (name: string, parentBranchId?: string) => Promise<string | null>;
  onSwitchBranch: (branchId: string) => Promise<void>;
  onMergeBranch: (sourceBranchId: string, targetBranchId: string) => Promise<boolean>;
}

const StoryEditor: React.FC<StoryEditorProps> = ({
  branches,
  activeBranch,
  onUpdateContent,
  onCreateBranch,
  onSwitchBranch,
  onMergeBranch
}) => {
  const [newBranchName, setNewBranchName] = useState('');
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const getCurrentBranch = () => branches.find(b => b.id === activeBranch);

  const updateContent = (content: string) => {
    // Update content optimistically in local state
    const currentBranch = getCurrentBranch();
    if (currentBranch) {
      currentBranch.content = content;
    }
  };

  const handleSave = async () => {
    const currentBranch = getCurrentBranch();
    if (!currentBranch) return;

    setIsSaving(true);
    try {
      await onUpdateContent(currentBranch.id, currentBranch.content);
      toast({
        title: "Saved!",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const createNewBranch = async () => {
    if (!newBranchName.trim()) return;
    
    try {
      const newBranchId = await onCreateBranch(newBranchName);
      if (newBranchId) {
        toast({
          title: "Branch created!",
          description: `Created new branch: ${newBranchName}`,
        });
        setNewBranchName('');
        setIsCreatingBranch(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create branch.",
        variant: "destructive",
      });
    }
  };

  const handleMergeBranch = async () => {
    const currentBranch = getCurrentBranch();
    const mainBranch = branches.find(b => b.is_main);
    
    if (!currentBranch || !mainBranch || currentBranch.is_main) return;

    try {
      const success = await onMergeBranch(currentBranch.id, mainBranch.id);
      if (success) {
        toast({
          title: "Branch merged!",
          description: `Merged "${currentBranch.name}" into main story.`,
        });
        // Switch to main branch after merge
        await onSwitchBranch(mainBranch.id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to merge branch.",
        variant: "destructive",
      });
    }
  };

  const switchBranch = async (branchId: string) => {
    try {
      await onSwitchBranch(branchId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to switch branch.",
        variant: "destructive",
      });
    }
  };

  const currentBranch = getCurrentBranch();

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Sidebar */}
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
            <div className="mb-4 p-3 bg-gray-50 rounded-lg animate-fade-in">
              <Input
                placeholder="Branch name..."
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                className="mb-2"
                onKeyPress={(e) => e.key === 'Enter' && createNewBranch()}
              />
              <div className="flex gap-2">
                <Button onClick={createNewBranch} size="sm" className="bg-story-600 hover:bg-story-700">
                  Create
                </Button>
                <Button onClick={() => setIsCreatingBranch(false)} variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
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
                onClick={() => switchBranch(branch.id)}
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

      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
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
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              {currentBranch && !currentBranch.is_main && (
                <Button 
                  size="sm" 
                  className="bg-story-600 hover:bg-story-700 flex items-center gap-2"
                  onClick={handleMergeBranch}
                >
                  <GitBranch className="w-4 h-4" />
                  Merge Branch
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <Textarea
              value={currentBranch?.content || ''}
              onChange={(e) => updateContent(e.target.value)}
              className="w-full h-full min-h-[600px] story-editor text-lg leading-relaxed resize-none border-0 shadow-none focus:ring-0 p-8 bg-white rounded-lg shadow-sm"
              placeholder="Begin writing your story..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryEditor;
