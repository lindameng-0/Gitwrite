
import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import StoryEditorSidebar from './StoryEditorSidebar';
import StoryEditorHeader from './StoryEditorHeader';
import StoryEditorContent from './StoryEditorContent';
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
  const [localContent, setLocalContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const getCurrentBranch = () => branches.find(b => b.id === activeBranch);

  // Update local content when branch changes
  useEffect(() => {
    const currentBranch = getCurrentBranch();
    if (currentBranch) {
      setLocalContent(currentBranch.content);
    }
  }, [activeBranch, branches]);

  const handleContentChange = (content: string) => {
    setLocalContent(content);
  };

  const handleSave = async () => {
    const currentBranch = getCurrentBranch();
    if (!currentBranch) return;

    setIsSaving(true);
    try {
      await onUpdateContent(currentBranch.id, localContent);
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
      <StoryEditorSidebar
        branches={branches}
        activeBranch={activeBranch}
        newBranchName={newBranchName}
        setNewBranchName={setNewBranchName}
        isCreatingBranch={isCreatingBranch}
        setIsCreatingBranch={setIsCreatingBranch}
        onCreateBranch={createNewBranch}
        onSwitchBranch={switchBranch}
      />

      <div className="flex-1 flex flex-col">
        <StoryEditorHeader
          currentBranch={currentBranch}
          isSaving={isSaving}
          onSave={handleSave}
          onMergeBranch={handleMergeBranch}
        />

        <StoryEditorContent
          localContent={localContent}
          onContentChange={handleContentChange}
          textareaRef={textareaRef}
        />
      </div>
    </div>
  );
};

export default StoryEditor;
