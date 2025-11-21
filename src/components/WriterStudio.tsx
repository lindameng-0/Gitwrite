
import React, { useState } from 'react';
import StoryBranchStudio from './StoryBranchStudio';
import StudioSelector from './StudioSelector';
import StudioSettings from './StudioSettings';
import UserMenu from './UserMenu';
import { Button } from '@/components/ui/button';
import { useStoryData } from '@/hooks/useStoryData';
import { useAuth } from '@/hooks/useAuth';
import { useStudios, type Studio } from '@/hooks/useStudios';
import { ArrowLeft, Settings } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

const WriterStudio = () => {
  const { profile } = useAuth();
  const { studios } = useStudios();
  const { studioId } = useParams<{ studioId: string }>();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const selectedStudioId = studioId || null;
  const selectedStudio = studios.find(s => s.id === selectedStudioId);
  
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
    updateBranchContent,
    createNewBranch,
    switchToBranch,
    mergeBranch,
    mergeChapter,
    mergeStoryVersion,
    restoreSavePoint,
    loadChaptersFromBranch,
    moveChapterToBranch,
    saveBranchPosition
  } = useStoryData(selectedStudioId);

  if (!selectedStudioId || !selectedStudio) {
    return <StudioSelector onStudioSelect={(id) => navigate(`/studio/${id}`)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading story data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with user menu */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Studios
          </Button>
            <div className="border-l border-gray-300 pl-4">
              <h1 className="text-lg font-semibold text-gray-900">{selectedStudio.name}</h1>
              {profile && (
                <p className="text-sm text-gray-600">Welcome back, {profile.full_name || profile.username}!</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsSettingsOpen(true)}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Studio Settings
            </Button>
            <UserMenu />
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <StoryBranchStudio
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
        onRestoreSavePoint={restoreSavePoint}
        onLoadTargetChapters={loadChaptersFromBranch}
        onMergeChapter={mergeChapter}
        onMergeStoryVersion={mergeStoryVersion}
        onMoveChapter={moveChapterToBranch}
        onSaveBranchPosition={saveBranchPosition}
      />
      </div>
      
      {/* Studio Settings Dialog */}
      <StudioSettings
        studio={selectedStudio}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default WriterStudio;
