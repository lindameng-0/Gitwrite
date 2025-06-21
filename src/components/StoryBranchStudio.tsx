
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GitBranch, FileText, Eye } from 'lucide-react';
import StoryEditor from './StoryEditor';
import BranchVisualizer from './BranchVisualizer';
import { useStoryData } from '@/hooks/useStoryData';

const StoryBranchStudio = () => {
  const { 
    story, 
    branches, 
    activeBranch, 
    loading,
    updateBranchContent,
    createNewBranch,
    switchToBranch,
    mergeBranch
  } = useStoryData();
  
  const [activeTab, setActiveTab] = useState<string>('editor');

  const handleBranchSelect = (branchId: string) => {
    switchToBranch(branchId);
    setActiveTab('editor');
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading story...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <GitBranch className="w-6 h-6 text-story-600" />
                <h1 className="text-xl font-bold text-gray-900">Plot Branch Studio</h1>
              </div>
              <TabsList className="bg-gray-100">
                <TabsTrigger value="editor" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="visualizer" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Branch View
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="text-sm text-gray-600">
              {branches.length} branches • {branches.filter(b => b.author_name !== 'You').length} collaborators
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="editor" className="h-full m-0">
            <StoryEditor 
              branches={branches}
              activeBranch={activeBranch}
              onUpdateContent={updateBranchContent}
              onCreateBranch={createNewBranch}
              onSwitchBranch={switchToBranch}
              onMergeBranch={mergeBranch}
            />
          </TabsContent>
          
          <TabsContent value="visualizer" className="h-full m-0">
            <BranchVisualizer 
              branches={branches}
              activeBranch={activeBranch}
              onBranchSelect={handleBranchSelect}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default StoryBranchStudio;
