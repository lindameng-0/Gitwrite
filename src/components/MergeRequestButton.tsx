import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Users,
  GitMerge
} from 'lucide-react';
import { useMergeRequests, MergeRequestWithDetails } from '@/hooks/useMergeRequests';
import type { StoryBranchWithMeta } from '@/hooks/useStoryData';

interface MergeRequestButtonProps {
  branch: StoryBranchWithMeta;
  mainBranch: StoryBranchWithMeta | undefined;
  storyId: string;
  hasContent: boolean; // Changed from hasApprovedChapters
  onProposeBranch?: (branchId: string) => Promise<boolean>;
}

const MergeRequestButton: React.FC<MergeRequestButtonProps> = ({
  branch,
  mainBranch,
  storyId,
  hasContent,
  onProposeBranch
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    submitMergeRequest, 
    getUserPendingRequests,
    cancelMergeRequest 
  } = useMergeRequests(storyId);

  const pendingRequests = getUserPendingRequests();
  const currentBranchRequest = pendingRequests.find(r => r.source_branch_id === branch.id);

  const handleSubmit = async () => {
    if (!mainBranch) return;
    
    setIsSubmitting(true);
    try {
      await submitMergeRequest(branch.id, mainBranch.id);
      // Also update branch status to proposed
      if (onProposeBranch) {
        await onProposeBranch(branch.id);
      }
      setIsDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!currentBranchRequest) return;
    await cancelMergeRequest(currentBranchRequest.id);
  };

  // Already submitted
  if (currentBranchRequest) {
    return (
      <div className="space-y-2">
        <Card className="p-3 bg-muted/50 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Merge Request Pending</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {currentBranchRequest.status === 'under_review' ? 'Under Review' : 'Waiting'}
            </Badge>
          </div>
          
          {currentBranchRequest.has_conflicts && (
            <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3 h-3" />
              <span>
                {currentBranchRequest.conflicting_requests?.length || 0} competing version(s) submitted
              </span>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-xs text-muted-foreground hover:text-destructive"
            onClick={handleCancel}
          >
            Cancel Request
          </Button>
        </Card>
      </div>
    );
  }

  // Not ready to submit
  if (!hasContent) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="w-full opacity-50"
      >
        <GitMerge className="w-4 h-4 mr-2" />
        No Content to Propose
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
      >
        <Send className="w-4 h-4 mr-2" />
        Propose Changes
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitMerge className="w-5 h-5 text-primary" />
              Submit Draft for Review
            </DialogTitle>
            <DialogDescription>
              Submit your draft "{branch.name}" for admin review and potential publishing to the main story.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Card className="p-4 bg-muted/30">
              <h4 className="text-sm font-medium mb-2">What happens next?</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Admin will review your approved chapters</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <span>If other writers submitted from the same fork point, admin will compare versions</span>
                </li>
                <li className="flex items-start gap-2">
                  <GitMerge className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                  <span>Best version gets published to the official story</span>
                </li>
              </ul>
            </Card>

            {pendingRequests.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
                <AlertTriangle className="w-4 h-4" />
                <span>You have {pendingRequests.length} other pending request(s)</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MergeRequestButton;
