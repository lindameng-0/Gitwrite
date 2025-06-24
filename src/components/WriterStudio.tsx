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
    return <div>Loading story data...</div>;
  }

  const handleMergeChapter = async (
    chapterId: string,
    targetBranchId: string,
    mode: 'replace' | 'insert' | 'append' | 'subplot' | 'flashback',
    mergeNote?: string,
    targetPosition?: number,
    replaceChapterId?: string
  ) => {
    try {
      await mergeChapter(chapterId, targetBranchId, mode, mergeNote, targetPosition, replaceChapterId);
    } catch (error) {
      console.error('Error merging chapter in WriterStudio:', error);
    }
  };

  const handleMergeStoryVersion = async (sourceBranchId: string, targetBranchId: string, mergeNote?: string) => {
    try {
      await mergeStoryVersion(sourceBranchId, targetBranchId, mergeNote);
    } catch (error) {
      console.error('Error merging story version in WriterStudio:', error);
    }
  };

  const onLoadTargetChapters = async (branchId: string) => {
    try {
      return await loadChaptersFromBranch(branchId);
    } catch (error) {
      console.error('Error loading target chapters in WriterStudio:', error);
      return [];
    }
  };

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
      />
    </div>
  );
};

export default WriterStudio;
