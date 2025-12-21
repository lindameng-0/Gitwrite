import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  CheckCircle, 
  FileText, 
  XCircle, 
  MessageSquare,
  GitBranch,
  Layers,
  Brain,
  MousePointer,
  User
} from 'lucide-react';
import SmartMergeDialog, { type MergeMode } from './SmartMergeDialog';
import ManualMergeDialog from './ManualMergeDialog';
import type { StoryBranchWithMeta, ChapterWithReviews } from '@/hooks/useStoryData';

interface ReviewModePanelProps {
  branches: StoryBranchWithMeta[];
  chapters: ChapterWithReviews[];
  activeBranch: string;
  onReviewChapter: (chapterId: string, status: 'approved' | 'changes_requested', feedback?: string) => Promise<void>;
  onMergeChapter: (chapterId: string, targetBranchId: string, mode: MergeMode, mergeNote?: string, targetPosition?: number, replaceChapterId?: string) => Promise<boolean>;
  onMergeStoryVersion: (sourceBranchId: string, targetBranchId: string, mergeNote?: string) => Promise<boolean>;
  onLoadTargetChapters: (branchId: string) => Promise<ChapterWithReviews[]>;
  onSwitchBranch: (branchId: string) => Promise<void>;
}

const ReviewModePanel: React.FC<ReviewModePanelProps> = ({
  branches,
  chapters,
  activeBranch,
  onReviewChapter,
  onMergeChapter,
  onMergeStoryVersion,
  onLoadTargetChapters,
  onSwitchBranch
}) => {
  const [selectedChapter, setSelectedChapter] = useState<ChapterWithReviews | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDraftFilter, setSelectedDraftFilter] = useState<string>('all');
  const [targetChapters, setTargetChapters] = useState<ChapterWithReviews[]>([]);
  const [smartMergeDialog, setSmartMergeDialog] = useState<{ isOpen: boolean; chapter: ChapterWithReviews | null }>({ isOpen: false, chapter: null });
  const [manualMergeDialog, setManualMergeDialog] = useState<{ isOpen: boolean; chapter: ChapterWithReviews | null }>({ isOpen: false, chapter: null });

  const mainBranch = branches.find(b => b.is_main);
  const draftBranches = branches.filter(b => !b.is_main);

  // Load target chapters (main branch) for merging
  React.useEffect(() => {
    if (mainBranch) {
      onLoadTargetChapters(mainBranch.id).then(setTargetChapters);
    }
  }, [mainBranch?.id]);

  // Get all chapters from selected draft(s)
  const reviewableChapters = useMemo(() => {
    // For now, we show chapters from the active branch
    // In a real implementation, you'd load chapters from all drafts
    return chapters.filter(c => {
      if (selectedDraftFilter === 'all') return true;
      return c.branch_id === selectedDraftFilter;
    });
  }, [chapters, selectedDraftFilter]);

  // Group chapters by status
  const pendingReview = reviewableChapters.filter(c => c.status === 'review');
  const approved = reviewableChapters.filter(c => c.status === 'approved');
  const published = reviewableChapters.filter(c => c.status === 'merged');

  const currentBranch = branches.find(b => b.id === activeBranch);

  const handleApprove = async () => {
    if (!selectedChapter) return;
    setIsProcessing(true);
    try {
      await onReviewChapter(selectedChapter.id, 'approved', feedback);
      setFeedback('');
      setSelectedChapter(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!selectedChapter || !feedback.trim()) return;
    setIsProcessing(true);
    try {
      await onReviewChapter(selectedChapter.id, 'changes_requested', feedback);
      setFeedback('');
      setSelectedChapter(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSmartMerge = (chapter: ChapterWithReviews) => {
    setSmartMergeDialog({ isOpen: true, chapter });
  };

  const handleManualMerge = (chapter: ChapterWithReviews) => {
    setManualMergeDialog({ isOpen: true, chapter });
  };

  const handleMergeWithOptions = async (
    chapterId: string,
    mode: MergeMode,
    targetPosition?: number,
    replaceChapterId?: string,
    mergeNote?: string
  ) => {
    if (!mainBranch) return false;
    const success = await onMergeChapter(chapterId, mainBranch.id, mode, mergeNote, targetPosition, replaceChapterId);
    if (success) {
      onLoadTargetChapters(mainBranch.id).then(setTargetChapters);
    }
    return success;
  };

  const getWordCount = (content: string) => {
    const text = content.replace(/<[^>]*>/g, '').trim();
    return text ? text.split(/\s+/).length : 0;
  };

  return (
    <div className="h-full flex">
      {/* Left Panel - Review Queue */}
      <div className="w-2/5 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border bg-muted/30">
          <h2 className="text-lg font-semibold mb-3">Review Queue</h2>
          
          {/* Draft Filter */}
          <Select value={selectedDraftFilter} onValueChange={setSelectedDraftFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by draft" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Drafts</SelectItem>
              {draftBranches.map(branch => (
                <SelectItem key={branch.id} value={branch.id}>
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-3 h-3" />
                    {branch.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {currentBranch && !currentBranch.is_main && (
            <p className="text-xs text-muted-foreground mt-2">
              Currently viewing: <span className="font-medium">{currentBranch.name}</span>
            </p>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Pending Review */}
            {pendingReview.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  Pending Review ({pendingReview.length})
                </h3>
                <div className="space-y-2">
                  {pendingReview.map(chapter => (
                    <Card 
                      key={chapter.id}
                      className={`p-3 cursor-pointer transition-all hover:border-blue-300 ${
                        selectedChapter?.id === chapter.id ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : ''
                      }`}
                      onClick={() => setSelectedChapter(chapter)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{chapter.title || 'Untitled'}</p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <User className="w-3 h-3" />
                            {chapter.author_name}
                            <span className="text-muted-foreground">•</span>
                            {getWordCount(chapter.content)} words
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          Review
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Approved - Ready to Publish */}
            {approved.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Ready to Publish ({approved.length})
                </h3>
                <div className="space-y-2">
                  {approved.map(chapter => (
                    <Card 
                      key={chapter.id}
                      className={`p-3 cursor-pointer transition-all hover:border-green-300 ${
                        selectedChapter?.id === chapter.id ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' : ''
                      }`}
                      onClick={() => setSelectedChapter(chapter)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{chapter.title || 'Untitled'}</p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <User className="w-3 h-3" />
                            {chapter.author_name}
                            <span className="text-muted-foreground">•</span>
                            {getWordCount(chapter.content)} words
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            Approved
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={(e) => { e.stopPropagation(); handleManualMerge(chapter); }}
                        >
                          <MousePointer className="w-3 h-3 mr-1" />
                          Quick Publish
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                          onClick={(e) => { e.stopPropagation(); handleSmartMerge(chapter); }}
                        >
                          <Brain className="w-3 h-3 mr-1" />
                          AI Publish
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Published */}
            {published.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-500" />
                  Recently Published ({published.length})
                </h3>
                <div className="space-y-2">
                  {published.map(chapter => (
                    <Card 
                      key={chapter.id}
                      className={`p-3 cursor-pointer transition-all hover:border-purple-300 ${
                        selectedChapter?.id === chapter.id ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20' : ''
                      }`}
                      onClick={() => setSelectedChapter(chapter)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{chapter.title || 'Untitled'}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {chapter.author_name} • {getWordCount(chapter.content)} words
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          Published
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {pendingReview.length === 0 && approved.length === 0 && published.length === 0 && (
              <Card className="p-6 text-center">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  No chapters to review. Writers will submit chapters for review.
                </p>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Chapter Preview & Actions */}
      <div className="w-3/5 flex flex-col">
        {selectedChapter ? (
          <>
            {/* Chapter Header */}
            <div className="p-4 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{selectedChapter.title || 'Untitled Chapter'}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    By {selectedChapter.author_name} • Chapter {selectedChapter.chapter_order} • {getWordCount(selectedChapter.content)} words
                  </p>
                </div>
                <Badge 
                  className={
                    selectedChapter.status === 'review' 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : selectedChapter.status === 'approved'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                  }
                >
                  {selectedChapter.status === 'review' ? 'Pending Review' : 
                   selectedChapter.status === 'approved' ? 'Approved' : 'Published'}
                </Badge>
              </div>
            </div>

            {/* Chapter Content (Read-only) */}
            <ScrollArea className="flex-1 p-6">
              <div 
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedChapter.content || '<p class="text-muted-foreground italic">No content yet.</p>' }}
              />
            </ScrollArea>

            {/* Review Actions */}
            {selectedChapter.status === 'review' && (
              <div className="p-4 border-t border-border bg-muted/30">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4" />
                      Feedback (required for requesting changes)
                    </label>
                    <Textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Add feedback for the writer..."
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={handleRequestChanges}
                      disabled={isProcessing || !feedback.trim()}
                      variant="outline"
                      className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Request Changes
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Publish Actions for Approved */}
            {selectedChapter.status === 'approved' && selectedChapter.canMerge && (
              <div className="p-4 border-t border-border bg-muted/30">
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleManualMerge(selectedChapter)}
                    variant="outline"
                    className="flex-1"
                  >
                    <MousePointer className="w-4 h-4 mr-2" />
                    Quick Publish
                  </Button>
                  <Button
                    onClick={() => handleSmartMerge(selectedChapter)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    AI Publish
                  </Button>
                </div>
              </div>
            )}

            {/* Review History */}
            {selectedChapter.reviews && selectedChapter.reviews.length > 0 && (
              <div className="p-4 border-t border-border">
                <h4 className="text-sm font-medium mb-2">Review History</h4>
                <div className="space-y-2">
                  {selectedChapter.reviews.map(review => (
                    <div key={review.id} className="text-xs p-2 bg-muted rounded">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{review.reviewer_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {review.status}
                        </Badge>
                      </div>
                      {review.feedback && (
                        <p className="text-muted-foreground mt-1">{review.feedback}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Select a chapter to review</p>
            </div>
          </div>
        )}
      </div>

      {/* Merge Dialogs */}
      <SmartMergeDialog
        isOpen={smartMergeDialog.isOpen}
        onClose={() => setSmartMergeDialog({ isOpen: false, chapter: null })}
        chapter={smartMergeDialog.chapter}
        targetChapters={targetChapters}
        sourceBranchName={currentBranch?.name || 'Current Draft'}
        targetBranchName="Published Version"
        onMerge={handleMergeWithOptions}
      />
      <ManualMergeDialog
        isOpen={manualMergeDialog.isOpen}
        onClose={() => setManualMergeDialog({ isOpen: false, chapter: null })}
        chapter={manualMergeDialog.chapter}
        targetChapters={targetChapters}
        sourceBranchName={currentBranch?.name || 'Current Draft'}
        targetBranchName="Published Version"
        onMerge={handleMergeWithOptions}
      />
    </div>
  );
};

export default ReviewModePanel;
