import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  GitMerge,
  Users,
  FileText,
  Eye,
  ArrowRight,
  Layers,
  User,
  Combine,
  Archive,
  Sparkles,
  Loader2,
  GitCompare,
  Wand2
} from 'lucide-react';
import { useMergeRequests, MergeRequestWithDetails, ConflictGroup } from '@/hooks/useMergeRequests';
import ConflictComparePanel from './ConflictComparePanel';
import FusionMergeDialog from './FusionMergeDialog';
import AIMergePlanDialog from './AIMergePlanDialog';
import VisualDiffMergeDialog from './VisualDiffMergeDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { ChapterWithReviews } from '@/hooks/useStoryData';

interface AdminMergeQueueProps {
  storyId: string;
  onLoadChaptersFromBranch: (branchId: string) => Promise<ChapterWithReviews[]>;
  onMergeChapter: (chapterId: string, targetBranchId: string, mode: string, mergeNote?: string) => Promise<boolean>;
  onSetBranchStatus?: (branchId: string, status: 'alternate' | 'archived') => Promise<boolean>;
  mainBranchId?: string;
}

const AdminMergeQueue: React.FC<AdminMergeQueueProps> = ({
  storyId,
  onLoadChaptersFromBranch,
  onMergeChapter,
  onSetBranchStatus,
  mainBranchId
}) => {
  const {
    mergeRequests,
    loading,
    pendingCount,
    reviewMergeRequest,
    getConflictGroups
  } = useMergeRequests(storyId);

  const [selectedRequest, setSelectedRequest] = useState<MergeRequestWithDetails | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [compareDialog, setCompareDialog] = useState<{ isOpen: boolean; group: ConflictGroup | null }>({ 
    isOpen: false, 
    group: null 
  });
  const [previewDialog, setPreviewDialog] = useState<{ isOpen: boolean; request: MergeRequestWithDetails | null; chapters: ChapterWithReviews[] }>({
    isOpen: false,
    request: null,
    chapters: []
  });
  const [fusionDialog, setFusionDialog] = useState<{ 
    isOpen: boolean; 
    versions: { request: MergeRequestWithDetails; chapters: ChapterWithReviews[]; wordCount: number; approvedCount: number }[] 
  }>({
    isOpen: false,
    versions: []
  });
  const [summaries, setSummaries] = useState<Record<string, { summary: string; loading: boolean; error?: string }>>({});
  const [aiMergePlanDialog, setAiMergePlanDialog] = useState<{
    isOpen: boolean;
    request: MergeRequestWithDetails | null;
    sourceContent: string;
    targetContent: string;
  }>({ isOpen: false, request: null, sourceContent: '', targetContent: '' });
  const [visualDiffDialog, setVisualDiffDialog] = useState<{
    isOpen: boolean;
    request: MergeRequestWithDetails | null;
    sourceContent: string;
    targetContent: string;
  }>({ isOpen: false, request: null, sourceContent: '', targetContent: '' });
  const conflictGroups = getConflictGroups();
  const pendingRequests = mergeRequests.filter(r => r.status === 'pending');
  const underReviewRequests = mergeRequests.filter(r => r.status === 'under_review');
  const resolvedRequests = mergeRequests.filter(r => ['approved', 'rejected', 'superseded'].includes(r.status));

  const generateSummary = async (request: MergeRequestWithDetails) => {
    if (summaries[request.id]?.summary || summaries[request.id]?.loading) return;

    setSummaries(prev => ({ ...prev, [request.id]: { summary: '', loading: true } }));

    try {
      const chapters = await onLoadChaptersFromBranch(request.source_branch_id);
      
      const { data, error } = await supabase.functions.invoke('summarize-merge-request', {
        body: {
          branchName: request.source_branch?.name || 'Unknown Branch',
          authorName: request.author_name,
          chapters: chapters.map(ch => ({
            title: ch.title,
            content: ch.content,
            status: ch.status
          }))
        }
      });

      if (error) throw error;

      setSummaries(prev => ({ 
        ...prev, 
        [request.id]: { summary: data.summary, loading: false } 
      }));
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummaries(prev => ({ 
        ...prev, 
        [request.id]: { summary: '', loading: false, error: 'Failed to generate summary' } 
      }));
      toast({
        title: "Summary Error",
        description: "Could not generate AI summary for this request.",
        variant: "destructive"
      });
    }
  };

  const handleApprove = async (request: MergeRequestWithDetails) => {
    setIsProcessing(true);
    try {
      await reviewMergeRequest(request.id, 'approved', reviewNote);
      setSelectedRequest(null);
      setReviewNote('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeepAsAlternate = async (request: MergeRequestWithDetails) => {
    setIsProcessing(true);
    try {
      // Set branch status to alternate
      if (onSetBranchStatus) {
        await onSetBranchStatus(request.source_branch_id, 'alternate');
      }
      // Mark merge request as approved but kept as alternate
      await reviewMergeRequest(request.id, 'approved', `Kept as alternate storyline: ${reviewNote || 'Preserved as parallel version'}`);
      setSelectedRequest(null);
      setReviewNote('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (request: MergeRequestWithDetails) => {
    if (!reviewNote.trim()) {
      return; // Require note for rejection
    }
    setIsProcessing(true);
    try {
      await reviewMergeRequest(request.id, 'rejected', reviewNote);
      setSelectedRequest(null);
      setReviewNote('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePreview = async (request: MergeRequestWithDetails) => {
    const chapters = await onLoadChaptersFromBranch(request.source_branch_id);
    setPreviewDialog({ isOpen: true, request, chapters });
  };

  const handleCompareConflicts = (group: ConflictGroup) => {
    setCompareDialog({ isOpen: true, group });
  };

  const handleCombineVersions = async (group: ConflictGroup) => {
    // Load chapters for all versions in the conflict group
    const versionsData = await Promise.all(
      group.requests.map(async (request) => {
        const chapters = await onLoadChaptersFromBranch(request.source_branch_id);
        // Count all chapters with content, not just approved ones
        const chaptersWithContent = chapters.filter(c => c.content && c.content.trim().length > 0);
        const wordCount = chaptersWithContent.reduce((acc, c) => {
          const text = c.content.replace(/<[^>]*>/g, '').trim();
          return acc + (text ? text.split(/\s+/).length : 0);
        }, 0);
        return {
          request,
          chapters,
          wordCount,
          approvedCount: chaptersWithContent.length
        };
      })
    );
    setFusionDialog({ isOpen: true, versions: versionsData });
  };

  const handleFusionComplete = async (fusedContent: string, selectedVersionIds: string[], fusionNote: string) => {
    // Mark selected versions as approved/superseded and create fused chapter
    for (const versionId of selectedVersionIds) {
      await reviewMergeRequest(versionId, 'approved', `Included in fusion: ${fusionNote}`);
    }
    
    // Here you would typically create the fused chapter in the main branch
    // For now, we'll just close the dialog - the parent component should handle the actual merge
    setFusionDialog({ isOpen: false, versions: [] });
  };

  const handleOpenAIMergePlan = async (request: MergeRequestWithDetails) => {
    // Load source and target content
    const sourceChapters = await onLoadChaptersFromBranch(request.source_branch_id);
    const sourceContent = sourceChapters
      .filter(c => c.content && c.content.trim().length > 0)
      .map(c => c.content)
      .join('\n\n');

    // Load main branch content for comparison
    let targetContent = '';
    if (mainBranchId) {
      const targetChapters = await onLoadChaptersFromBranch(mainBranchId);
      targetContent = targetChapters
        .filter(c => c.content && c.content.trim().length > 0)
        .map(c => c.content)
        .join('\n\n');
    }

    setAiMergePlanDialog({
      isOpen: true,
      request,
      sourceContent,
      targetContent: targetContent || '<p>No existing content in main branch</p>'
    });
  };

  const handleOpenVisualDiff = async (request: MergeRequestWithDetails) => {
    // Load source and target content
    const sourceChapters = await onLoadChaptersFromBranch(request.source_branch_id);
    const sourceContent = sourceChapters
      .filter(c => c.content && c.content.trim().length > 0)
      .map(c => c.content)
      .join('\n\n');

    // Load main branch content for comparison
    let targetContent = '';
    if (mainBranchId) {
      const targetChapters = await onLoadChaptersFromBranch(mainBranchId);
      targetContent = targetChapters
        .filter(c => c.content && c.content.trim().length > 0)
        .map(c => c.content)
        .join('\n\n');
    }

    setVisualDiffDialog({
      isOpen: true,
      request,
      sourceContent,
      targetContent: targetContent || ''
    });
  };

  const handleMergePlanComplete = async (mergedContent: string, note: string) => {
    if (!aiMergePlanDialog.request) return;
    
    // Approve the merge request with the merged content
    await reviewMergeRequest(aiMergePlanDialog.request.id, 'approved', note);
    setAiMergePlanDialog({ isOpen: false, request: null, sourceContent: '', targetContent: '' });
  };

  const handleVisualDiffComplete = async (mergedContent: string, note: string) => {
    if (!visualDiffDialog.request) return;
    
    // Approve the merge request with the merged content
    await reviewMergeRequest(visualDiffDialog.request.id, 'approved', note);
    setVisualDiffDialog({ isOpen: false, request: null, sourceContent: '', targetContent: '' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Pending</Badge>;
      case 'under_review':
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Under Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">Rejected</Badge>;
      case 'superseded':
        return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300">Superseded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitMerge className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Merge Queue</h2>
            {pendingCount > 0 && (
              <Badge className="bg-primary text-primary-foreground">{pendingCount}</Badge>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Conflict Groups - Priority Section */}
          {conflictGroups.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Conflicts to Resolve ({conflictGroups.length})
              </h3>
              <div className="space-y-3">
                {conflictGroups.map((group, index) => (
                  <Card key={index} className="p-4 border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-amber-600" />
                          <span className="font-medium text-sm">
                            {group.requests.length} Competing Versions
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Writers from the same fork point have submitted different versions
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {group.requests.map(req => (
                            <Badge key={req.id} variant="outline" className="text-xs">
                              {req.author_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCompareConflicts(group)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Compare
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleCombineVersions(group)}
                          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                        >
                          <Combine className="w-4 h-4 mr-1" />
                          Combine
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Pending Review ({pendingRequests.length})
              </h3>
              <div className="space-y-2">
                {pendingRequests.filter(r => !r.has_conflicts).map(request => (
                  <Card 
                    key={request.id}
                    className={`p-4 cursor-pointer transition-all hover:border-primary/50 ${
                      selectedRequest?.id === request.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {request.source_branch?.name || 'Unknown Branch'}
                          </span>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <User className="w-3 h-3" />
                          {request.author_name}
                          <span>•</span>
                          {new Date(request.requested_at).toLocaleDateString()}
                        </p>
                        {request.chapter_title && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Chapter: {request.chapter_title}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); handleOpenAIMergePlan(request); }}
                          className="border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-300"
                          title="AI Merge Plan"
                        >
                          <Wand2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); handleOpenVisualDiff(request); }}
                          className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300"
                          title="Visual Compare"
                        >
                          <GitCompare className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); generateSummary(request); }}
                          disabled={summaries[request.id]?.loading}
                          title="AI Summary"
                        >
                          {summaries[request.id]?.loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); handlePreview(request); }}
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* AI Summary Section */}
                    {summaries[request.id]?.summary && (
                      <div className="mt-3 p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
                        <div className="flex items-center gap-2 text-xs font-medium text-violet-700 dark:text-violet-300 mb-1">
                          <Sparkles className="w-3 h-3" />
                          AI Summary
                        </div>
                        <p className="text-sm text-violet-900 dark:text-violet-100">
                          {summaries[request.id].summary}
                        </p>
                      </div>
                    )}

                    {selectedRequest?.id === request.id && (
                      <div className="mt-4 pt-4 border-t border-border space-y-3">
                        <Textarea
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                          placeholder="Add review note (required for rejection)..."
                          className="min-h-[60px]"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request)}
                            disabled={isProcessing}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Publish
                          </Button>
                          {onSetBranchStatus && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleKeepAsAlternate(request)}
                              disabled={isProcessing}
                              className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950/30"
                            >
                              <Archive className="w-4 h-4 mr-1" />
                              Keep as Alternate
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(request)}
                            disabled={isProcessing || !reviewNote.trim()}
                            className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recently Resolved */}
          {resolvedRequests.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-500" />
                Recently Resolved ({resolvedRequests.length})
              </h3>
              <div className="space-y-2">
                {resolvedRequests.slice(0, 5).map(request => (
                  <Card key={request.id} className="p-3 opacity-75">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{request.source_branch?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">
                          {request.author_name} • {new Date(request.reviewed_at || request.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    {request.review_note && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        "{request.review_note}"
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {pendingRequests.length === 0 && conflictGroups.length === 0 && resolvedRequests.length === 0 && (
            <Card className="p-8 text-center">
              <GitMerge className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Merge Requests</h3>
              <p className="text-muted-foreground text-sm">
                Writers can submit their approved drafts for review here.
              </p>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Compare Dialog */}
      <Dialog open={compareDialog.isOpen} onOpenChange={(open) => setCompareDialog({ isOpen: open, group: null })}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Compare Conflicting Versions
            </DialogTitle>
            <DialogDescription>
              Review and choose which version to publish to the main story
            </DialogDescription>
          </DialogHeader>
          {compareDialog.group && (
            <ConflictComparePanel
              group={compareDialog.group}
              onLoadChaptersFromBranch={onLoadChaptersFromBranch}
              onSelectWinner={async (requestId) => {
                await reviewMergeRequest(requestId, 'approved', 'Selected as winner from conflict resolution');
                setCompareDialog({ isOpen: false, group: null });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog.isOpen} onOpenChange={(open) => setPreviewDialog({ isOpen: open, request: null, chapters: [] })}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Preview: {previewDialog.request?.source_branch?.name}
            </DialogTitle>
            <DialogDescription>
              By {previewDialog.request?.author_name}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-4 p-4">
              {previewDialog.chapters.filter(c => c.status === 'approved').map(chapter => (
                <Card key={chapter.id} className="p-4">
                  <h4 className="font-medium mb-2">{chapter.title}</h4>
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none text-sm"
                    dangerouslySetInnerHTML={{ __html: chapter.content.slice(0, 500) + '...' }}
                  />
                </Card>
              ))}
              {previewDialog.chapters.filter(c => c.status === 'approved').length === 0 && (
                <p className="text-muted-foreground text-center py-8">No approved chapters in this branch</p>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialog({ isOpen: false, request: null, chapters: [] })}>
              Close
            </Button>
            {previewDialog.request && (
              <Button
                onClick={() => {
                  handleApprove(previewDialog.request!);
                  setPreviewDialog({ isOpen: false, request: null, chapters: [] });
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Request
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fusion Dialog */}
      <FusionMergeDialog
        isOpen={fusionDialog.isOpen}
        onClose={() => setFusionDialog({ isOpen: false, versions: [] })}
        versions={fusionDialog.versions}
        onFusionComplete={handleFusionComplete}
        chapterTitle={fusionDialog.versions[0]?.request.chapter_title || undefined}
      />

      {/* AI Merge Plan Dialog */}
      {aiMergePlanDialog.request && (
        <AIMergePlanDialog
          isOpen={aiMergePlanDialog.isOpen}
          onClose={() => setAiMergePlanDialog({ isOpen: false, request: null, sourceContent: '', targetContent: '' })}
          sourceContent={aiMergePlanDialog.sourceContent}
          targetContent={aiMergePlanDialog.targetContent}
          sourceAuthor={aiMergePlanDialog.request.author_name}
          targetAuthor="Main Branch"
          sourceBranch={aiMergePlanDialog.request.source_branch?.name || 'Unknown'}
          targetBranch="Main"
          chapterTitle={aiMergePlanDialog.request.chapter_title || undefined}
          onMergeComplete={handleMergePlanComplete}
        />
      )}

      {/* Visual Diff Dialog */}
      {visualDiffDialog.request && (
        <VisualDiffMergeDialog
          isOpen={visualDiffDialog.isOpen}
          onClose={() => setVisualDiffDialog({ isOpen: false, request: null, sourceContent: '', targetContent: '' })}
          sourceContent={visualDiffDialog.sourceContent}
          targetContent={visualDiffDialog.targetContent}
          sourceAuthor={visualDiffDialog.request.author_name}
          targetAuthor="Main Branch"
          sourceBranch={visualDiffDialog.request.source_branch?.name || 'Unknown'}
          targetBranch="Main"
          chapterTitle={visualDiffDialog.request.chapter_title || undefined}
          onMergeComplete={handleVisualDiffComplete}
        />
      )}
    </div>
  );
};

export default AdminMergeQueue;
