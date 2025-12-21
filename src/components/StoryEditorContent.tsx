import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Save, MessageSquare, Lock, MessageSquarePlus, Users, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import RichTextEditor from './RichTextEditor';
import SuggestionsSidebar from './SuggestionsSidebar';
import DraftCollaboratorsPanel from './DraftCollaboratorsPanel';
import CollaboratorRequestButton from './CollaboratorRequestButton';
import SuggestionDialog from './SuggestionDialog';
import { useDraftCollaboration } from '@/hooks/useDraftCollaboration';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ChapterWithReviews, StoryBranchWithMeta } from '@/hooks/useStoryData';

interface StoryEditorContentProps {
  chapters: ChapterWithReviews[];
  activeChapter: string;
  onUpdateChapterContent: (chapterId: string, content: string) => Promise<void>;
  onSubmitChapterForReview: (chapterId: string) => Promise<void>;
  activeBranch?: StoryBranchWithMeta;
  isAdmin?: boolean;
}

interface ChapterContentProps {
  chapter: ChapterWithReviews;
  activeBranch?: StoryBranchWithMeta;
  onUpdateChapterContent: (chapterId: string, content: string) => Promise<void>;
  onSubmitChapterForReview: (chapterId: string) => Promise<void>;
  isReadOnly?: boolean;
  isAdmin?: boolean;
}

const ChapterContent: React.FC<ChapterContentProps> = ({ 
  chapter, 
  activeBranch,
  onUpdateChapterContent, 
  onSubmitChapterForReview,
  isReadOnly = false,
  isAdmin = false
}) => {
  const [content, setContent] = useState(chapter.content);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'suggestions' | 'collaborators'>('suggestions');
  const { toast } = useToast();

  // Draft collaboration hook
  const {
    suggestions,
    collaborators,
    myCollaboratorStatus,
    isDraftOwner,
    hasEditAccess,
    canSuggest,
    pendingSuggestionsCount,
    pendingCollaboratorRequestsCount,
    addSuggestion,
    resolveSuggestion,
    deleteSuggestion,
    requestCollaboratorAccess,
    updateCollaboratorStatus,
    removeCollaborator,
  } = useDraftCollaboration({
    branchId: activeBranch?.id || null,
    chapterId: chapter.id,
    draftOwnerName: activeBranch?.author_name,
  });

  // Determine if user can edit this chapter
  const canEdit = isAdmin || isDraftOwner || hasEditAccess;
  const effectiveReadOnly = isReadOnly || !canEdit;

  // Update content when chapter changes
  useEffect(() => {
    setContent(chapter.content);
  }, [chapter.content, chapter.id]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateChapterContent(chapter.id, content);
      toast({
        title: "Chapter saved",
        description: "Your chapter has been saved.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    try {
      await onSubmitChapterForReview(chapter.id);
      toast({
        title: "Chapter submitted for review",
        description: "Your chapter has been submitted for review.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
      });
    }
  };

  const handleSuggestionSubmit = async (suggestionText: string) => {
    const success = await addSuggestion(
      chapter.id,
      suggestionText,
      selectedText || undefined
    );
    
    if (success) {
      toast({
        title: "Suggestion submitted",
        description: "Your suggestion has been sent to the draft owner.",
      });
      setSelectedText('');
    } else {
      toast({
        variant: "destructive",
        title: "Failed to submit suggestion",
        description: "There was a problem submitting your suggestion.",
      });
    }
    
    return success;
  };

  const handleAcceptSuggestion = async (suggestionId: string) => {
    const success = await resolveSuggestion(suggestionId, 'accepted');
    if (success) {
      toast({
        title: "Suggestion accepted",
        description: "The suggestion has been accepted.",
      });
    }
    return success;
  };

  const handleRejectSuggestion = async (suggestionId: string) => {
    const success = await resolveSuggestion(suggestionId, 'rejected');
    if (success) {
      toast({
        title: "Suggestion rejected",
        description: "The suggestion has been rejected.",
      });
    }
    return success;
  };

  // Check if we're on a non-main branch (draft)
  const isOnDraft = activeBranch && !activeBranch.is_main;

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Read-only Banner for inherited chapters */}
        {isReadOnly && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center gap-2 flex-shrink-0">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm text-amber-800 dark:text-amber-200">
              This chapter is from the published version. To edit, create a new draft from an earlier chapter.
            </span>
          </div>
        )}

        {/* No edit access banner */}
        {!isReadOnly && !canEdit && isOnDraft && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800 px-4 py-2 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-800 dark:text-blue-200">
                This is {activeBranch?.author_name}'s draft. You can suggest changes or request edit access.
              </span>
            </div>
            <CollaboratorRequestButton
              myStatus={myCollaboratorStatus}
              onRequestAccess={requestCollaboratorAccess}
              draftOwnerName={activeBranch?.author_name}
            />
          </div>
        )}
        
        {/* Chapter Header */}
        <div className="bg-background border-b border-border px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{chapter.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`text-xs ${
                chapter.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                chapter.status === 'review' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                'bg-muted text-muted-foreground'
              }`}>
                {chapter.status}
              </Badge>
              <span className="text-sm text-muted-foreground">by {chapter.author_name}</span>
              {effectiveReadOnly && !canSuggest && (
                <Badge variant="outline" className="text-xs text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700">
                  Read-only
                </Badge>
              )}
              {canSuggest && (
                <Badge variant="outline" className="text-xs text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                  Suggest Mode
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Suggestion button for non-owners */}
            {canSuggest && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowSuggestionDialog(true)}
              >
                <MessageSquarePlus className="w-4 h-4 mr-2" />
                Suggest
              </Button>
            )}

            {/* Toggle sidebar button */}
            {isOnDraft && (
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setShowSidebar(!showSidebar)}
                className="relative"
              >
                {showSidebar ? (
                  <PanelRightClose className="w-4 h-4" />
                ) : (
                  <PanelRightOpen className="w-4 h-4" />
                )}
                {(pendingSuggestionsCount > 0 || pendingCollaboratorRequestsCount > 0) && !showSidebar && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                    {pendingSuggestionsCount + pendingCollaboratorRequestsCount}
                  </span>
                )}
              </Button>
            )}

            {!effectiveReadOnly && (
              <>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
                {chapter.status === 'draft' && (
                  <Button size="sm" variant="secondary" onClick={handleSubmitForReview}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Submit for Review
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Rich Text Editor */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <RichTextEditor
            content={content}
            onChange={handleContentChange}
            placeholder="Begin writing your chapter..."
            editable={!effectiveReadOnly}
          />
        </div>
      </div>

      {/* Collaboration Sidebar */}
      {showSidebar && isOnDraft && (
        <div className="w-80 border-l border-border bg-background flex flex-col">
          <Tabs value={sidebarTab} onValueChange={(v) => setSidebarTab(v as 'suggestions' | 'collaborators')} className="flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
              <TabsTrigger value="suggestions" className="relative">
                Suggestions
                {pendingSuggestionsCount > 0 && (
                  <Badge className="ml-1.5 h-4 w-4 p-0 text-xs bg-amber-500 text-white">
                    {pendingSuggestionsCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="collaborators" className="relative">
                Team
                {pendingCollaboratorRequestsCount > 0 && (
                  <Badge className="ml-1.5 h-4 w-4 p-0 text-xs bg-amber-500 text-white">
                    {pendingCollaboratorRequestsCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="suggestions" className="flex-1 mt-0 overflow-hidden">
              <SuggestionsSidebar
                suggestions={suggestions}
                isDraftOwner={isDraftOwner}
                currentUserId={undefined}
                onAccept={handleAcceptSuggestion}
                onReject={handleRejectSuggestion}
                onDelete={deleteSuggestion}
              />
            </TabsContent>
            <TabsContent value="collaborators" className="flex-1 mt-0 overflow-hidden">
              <DraftCollaboratorsPanel
                collaborators={collaborators}
                isDraftOwner={isDraftOwner}
                onApprove={(id) => updateCollaboratorStatus(id, 'approved')}
                onReject={(id) => updateCollaboratorStatus(id, 'rejected')}
                onRemove={removeCollaborator}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Suggestion Dialog */}
      <SuggestionDialog
        isOpen={showSuggestionDialog}
        onClose={() => {
          setShowSuggestionDialog(false);
          setSelectedText('');
        }}
        onSubmit={handleSuggestionSubmit}
        selectedText={selectedText}
      />
    </div>
  );
};

const StoryEditorContent: React.FC<StoryEditorContentProps> = ({ 
  chapters, 
  activeChapter, 
  onUpdateChapterContent, 
  onSubmitChapterForReview,
  activeBranch,
  isAdmin = false
}) => {
  const chapter = chapters.find(c => c.id === activeChapter);

  if (!chapter) {
    return (
      <div className="h-full overflow-y-auto scroll-stable bg-background">
        <div className="min-h-full flex items-center justify-center">
          <Card className="p-6 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Chapter Selected</h3>
            <p className="text-muted-foreground">Select a chapter from the sidebar to start writing.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <ChapterContent 
      key={chapter.id}
      chapter={chapter} 
      activeBranch={activeBranch}
      onUpdateChapterContent={onUpdateChapterContent}
      onSubmitChapterForReview={onSubmitChapterForReview}
      isReadOnly={chapter.isInherited}
      isAdmin={isAdmin}
    />
  );
};

export default StoryEditorContent;
