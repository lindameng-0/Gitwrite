
import React from 'react';
import StoryBranchStudio from './StoryBranchStudio';
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
    updateBranchContent,
    createNewBranch,
    switchToBranch,
    mergeBranch,
    mergeChapter,
    mergeStoryVersion,
    restoreSavePoint,
    loadChaptersFromBranch
  } = useStoryData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading story data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
      />
    </div>
  );
};

export default WriterStudio;
