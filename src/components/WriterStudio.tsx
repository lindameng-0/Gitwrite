
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GitBranch, FileText, Eye, Book, ArrowRightLeft } from 'lucide-react';
import StoryEditor from './StoryEditor';
import VersionVisualizer from './VersionVisualizer';
import MergeInterface from './MergeInterface';
import { useStoryData } from '@/hooks/useStoryData';

const WriterStudio = () => {
  const { 
    story, 
    branches, 
    chapters,
    savePoints,
    activeBranch, 
    activeChapter,
    loading,
    setActiveChapter,
    updateChapterContent,
    createNewChapter,
    createSavePoint,
    submitChapterForReview,
    reviewChapter,
    createNewBranch,
    switchToBranch,
    mergeBranch,
    mergeChapter,
    mergeStoryVersion
  } = useStoryData();
  
  const [activeTab, setActiveTab] = useState<string>('editor');

  const handleVersionSelect = (branchId: string) => {
    switchToBranch(branchId);
    setActiveTab('editor');
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Book className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <div className="text-xl text-gray-600">Loading your story...</div>
        </div>
      </div>
    );
  }

  const approvedChaptersCount = chapters.filter(c => c.status === 'approved' && c.canMerge).length;

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Book className="w-7 h-7 text-indigo-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Writer's Studio</h1>
                  <p className="text-sm text-gray-600">Collaborative writing with version control</p>
                </div>
              </div>
              <TabsList className="bg-gray-100">
                <TabsTrigger value="editor" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Write & Edit
                </TabsTrigger>
                <TabsTrigger value="versions" className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Story Versions
                </TabsTrigger>
                <TabsTrigger value="merge" className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4" />
                  Merge & Collaborate
                  {approvedChaptersCount > 0 && (
                    <span className="ml-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {approvedChaptersCount}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              {branches.length} story versions • {chapters.length} chapters • {savePoints.length} save points
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="editor" className="h-full m-0">
            <StoryEditor 
              branches={branches}
              chapters={chapters}
              savePoints={savePoints}
              activeBranch={activeBranch}
              activeChapter={activeChapter}
              onUpdateChapterContent={updateChapterContent}
              onCreateChapter={createNewChapter}
              onCreateSavePoint={createSavePoint}
              onSubmitChapterForReview={submitChapterForReview}
              onReviewChapter={reviewChapter}
              onCreateBranch={createNewBranch}
              onSwitchBranch={switchToBranch}
              onSwitchChapter={setActiveChapter}
            />
          </TabsContent>
          
          <TabsContent value="versions" className="h-full m-0">
            <VersionVisualizer 
              branches={branches}
              activeBranch={activeBranch}
              onVersionSelect={handleVersionSelect}
            />
          </TabsContent>

          <TabsContent value="merge" className="h-full m-0 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Merge & Collaborate</h2>
                <p className="text-gray-600">
                  Combine approved chapters and story versions. Merge content between different story branches safely.
                </p>
              </div>
              
              <MergeInterface
                branches={branches}
                chapters={chapters}
                activeBranch={activeBranch}
                onMergeChapter={mergeChapter}
                onMergeStoryVersion={mergeStoryVersion}
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default WriterStudio;
