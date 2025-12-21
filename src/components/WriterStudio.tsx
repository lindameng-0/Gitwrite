import React, { useState, useEffect, useCallback } from 'react';
import StoryBranchStudio from './StoryBranchStudio';
import StudioSelector from './StudioSelector';
import StudioSettings from './StudioSettings';
import UserMenu from './UserMenu';
import ModeToggle, { type StudioMode } from './ModeToggle';
import { Button } from '@/components/ui/button';
import { useStoryData } from '@/hooks/useStoryData';
import { useAuth } from '@/hooks/useAuth';
import { useStudios } from '@/hooks/useStudios';
import { useStudioRole } from '@/hooks/useStudioRole';
import { ArrowLeft, Settings } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

const STUDIO_MODE_KEY = 'studio-mode-preference';

const WriterStudio = () => {
  const { profile, user } = useAuth();
  const { studios } = useStudios();
  const { studioId, branchId, chapterId } = useParams<{ studioId: string; branchId?: string; chapterId?: string }>();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Mode state with localStorage persistence
  const [currentMode, setCurrentMode] = useState<StudioMode>(() => {
    const saved = localStorage.getItem(STUDIO_MODE_KEY);
    return (saved === 'admin' || saved === 'writer') ? saved : 'writer';
  });
  
  const selectedStudioId = studioId || null;
  const selectedStudio = studios.find(s => s.id === selectedStudioId);
  
  // Get user's role in this studio
  const { isAdmin, canSwitchModes, loading: roleLoading } = useStudioRole(selectedStudioId);
  
  // Handle mode change with persistence
  const handleModeChange = useCallback((mode: StudioMode) => {
    setCurrentMode(mode);
    localStorage.setItem(STUDIO_MODE_KEY, mode);
  }, []);
  
  // Determine if we're in "admin view" - only true if user is admin AND in admin mode
  const isInAdminMode = canSwitchModes && currentMode === 'admin';
  
  const {
    story,
    branches,
    chapters,
    mainBranchChapters,
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
    forkFromChapter,
    switchToBranch,
    mergeBranch,
    mergeChapter,
    mergeStoryVersion,
    restoreSavePoint,
    loadChaptersFromBranch,
    moveChapterToBranch,
    saveBranchPosition
  } = useStoryData(selectedStudioId, branchId, chapterId);

  // Sync URL with active branch/chapter
  useEffect(() => {
    if (selectedStudioId && activeBranch) {
      const newPath = activeChapter 
        ? `/studio/${selectedStudioId}/${activeBranch}/${activeChapter}`
        : `/studio/${selectedStudioId}/${activeBranch}`;
      
      // Only update if different to avoid loops
      const currentPath = window.location.pathname;
      if (currentPath !== newPath) {
        navigate(newPath, { replace: true });
      }
    }
  }, [selectedStudioId, activeBranch, activeChapter, navigate]);

  // Wrapper for branch switching
  const handleSwitchBranch = useCallback(async (newBranchId: string) => {
    await switchToBranch(newBranchId);
  }, [switchToBranch]);

  // Wrapper for chapter switching
  const handleSwitchChapter = useCallback((newChapterId: React.SetStateAction<string>) => {
    setActiveChapter(newChapterId);
  }, [setActiveChapter]);

  // Get current user's display name for chapter ownership
  const currentUserName = profile?.full_name || profile?.username || 'Anonymous';

  if (!selectedStudioId || !selectedStudio) {
    return <StudioSelector onStudioSelect={(id) => navigate(`/studio/${id}`)} />;
  }

  if (loading || roleLoading) {
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
    <div className="h-dvh min-h-screen bg-background flex flex-col overflow-hidden">
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
          <div className="flex items-center gap-3">
            {/* Mode Toggle for admins */}
            <ModeToggle
              currentMode={currentMode}
              onModeChange={handleModeChange}
              canSwitchModes={canSwitchModes}
            />
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
      
      <div className="flex-1 min-h-0 overflow-hidden">
        <StoryBranchStudio
          branches={branches}
          chapters={chapters}
          mainBranchChapters={mainBranchChapters}
          savePoints={savePoints}
          activeBranch={activeBranch}
          activeChapter={activeChapter}
          onUpdateChapterContent={updateChapterContent}
          onCreateChapter={createNewChapter}
          onCreateSavePoint={createSavePoint}
          onSubmitChapterForReview={submitChapterForReview}
          onReviewChapter={reviewChapter}
          onCreateBranch={createNewBranch}
          onForkFromChapter={forkFromChapter}
          onSwitchBranch={handleSwitchBranch}
          onSwitchChapter={handleSwitchChapter}
          onRestoreSavePoint={restoreSavePoint}
          onLoadTargetChapters={loadChaptersFromBranch}
          onMergeChapter={mergeChapter}
          onMergeStoryVersion={mergeStoryVersion}
          onMoveChapter={moveChapterToBranch}
          onSaveBranchPosition={saveBranchPosition}
          isAdmin={isInAdminMode}
          currentUserName={currentUserName}
          storyId={story?.id}
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
