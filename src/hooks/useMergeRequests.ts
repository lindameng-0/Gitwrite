import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface MergeRequest {
  id: string;
  source_branch_id: string;
  target_branch_id: string;
  source_chapter_id: string | null;
  story_id: string;
  requested_by: string;
  requested_at: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'superseded';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  priority: number;
  has_conflicts: boolean;
  conflicting_requests: string[];
  author_name: string;
  chapter_title: string | null;
  created_at: string;
  updated_at: string;
}

export interface MergeRequestWithDetails extends MergeRequest {
  source_branch?: {
    id: string;
    name: string;
    author_name: string;
    fork_point_chapter_id: string | null;
  };
  conflicting_details?: MergeRequest[];
}

export interface ConflictGroup {
  fork_point_chapter_id: string | null;
  fork_point_title: string;
  requests: MergeRequestWithDetails[];
}

export const useMergeRequests = (storyId?: string) => {
  const { user, profile } = useAuth();
  const [mergeRequests, setMergeRequests] = useState<MergeRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const loadMergeRequests = useCallback(async () => {
    if (!storyId) return;

    try {
      const { data, error } = await supabase
        .from('merge_requests')
        .select('*')
        .eq('story_id', storyId)
        .order('requested_at', { ascending: false });

      if (error) throw error;

      // Load branch details for each request
      const requestsWithDetails: MergeRequestWithDetails[] = await Promise.all(
        (data || []).map(async (request) => {
          const { data: branchData } = await supabase
            .from('story_branches')
            .select('id, name, author_name, fork_point_chapter_id')
            .eq('id', request.source_branch_id)
            .single();

          return {
            ...request,
            source_branch: branchData || undefined,
          } as MergeRequestWithDetails;
        })
      );

      setMergeRequests(requestsWithDetails);
      setPendingCount(requestsWithDetails.filter(r => r.status === 'pending' || r.status === 'under_review').length);
    } catch (error) {
      console.error('Error loading merge requests:', error);
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    loadMergeRequests();
  }, [loadMergeRequests]);

  // Real-time subscription
  useEffect(() => {
    if (!storyId) return;

    const channelName = `merge-requests-${storyId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'merge_requests',
          filter: `story_id=eq.${storyId}`
        },
        () => {
          loadMergeRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storyId, loadMergeRequests]);

  const submitMergeRequest = async (
    sourceBranchId: string,
    targetBranchId: string,
    chapterId?: string,
    chapterTitle?: string
  ): Promise<boolean> => {
    if (!user || !profile || !storyId) return false;

    try {
      // Check if there's already a pending request for this branch/chapter combo
      const { data: existing } = await supabase
        .from('merge_requests')
        .select('id')
        .eq('source_branch_id', sourceBranchId)
        .eq('target_branch_id', targetBranchId)
        .in('status', ['pending', 'under_review'])
        .maybeSingle();

      if (existing) {
        toast({
          title: "Already Submitted",
          description: "You already have a pending merge request for this draft.",
          variant: "destructive"
        });
        return false;
      }

      const { error } = await supabase
        .from('merge_requests')
        .insert({
          source_branch_id: sourceBranchId,
          target_branch_id: targetBranchId,
          source_chapter_id: chapterId || null,
          story_id: storyId,
          requested_by: user.id,
          author_name: profile.username,
          chapter_title: chapterTitle || null,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: "Your merge request has been submitted for admin review."
      });

      await loadMergeRequests();
      return true;
    } catch (error) {
      console.error('Error submitting merge request:', error);
      toast({
        title: "Error",
        description: "Failed to submit merge request.",
        variant: "destructive"
      });
      return false;
    }
  };

  const reviewMergeRequest = async (
    requestId: string,
    status: 'approved' | 'rejected' | 'superseded',
    reviewNote?: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('merge_requests')
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_note: reviewNote || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // If approved, supersede conflicting requests
      if (status === 'approved') {
        const request = mergeRequests.find(r => r.id === requestId);
        if (request?.conflicting_requests?.length) {
          await supabase
            .from('merge_requests')
            .update({
              status: 'superseded',
              review_note: `Superseded by approved request from ${request.author_name}`,
              updated_at: new Date().toISOString()
            })
            .in('id', request.conflicting_requests);
        }
      }

      toast({
        title: status === 'approved' ? "Request Approved" : status === 'rejected' ? "Request Rejected" : "Request Superseded",
        description: status === 'approved' 
          ? "The merge request has been approved. You can now publish the content."
          : status === 'rejected'
          ? "The merge request has been rejected."
          : "The merge request has been superseded."
      });

      await loadMergeRequests();
      return true;
    } catch (error) {
      console.error('Error reviewing merge request:', error);
      toast({
        title: "Error",
        description: "Failed to update merge request.",
        variant: "destructive"
      });
      return false;
    }
  };

  const cancelMergeRequest = async (requestId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('merge_requests')
        .update({
          status: 'rejected',
          review_note: 'Cancelled by author',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('requested_by', user.id);

      if (error) throw error;

      toast({
        title: "Request Cancelled",
        description: "Your merge request has been cancelled."
      });

      await loadMergeRequests();
      return true;
    } catch (error) {
      console.error('Error cancelling merge request:', error);
      return false;
    }
  };

  // Group requests by fork point for conflict visualization
  const getConflictGroups = useCallback((): ConflictGroup[] => {
    const conflictingRequests = mergeRequests.filter(r => 
      r.has_conflicts && ['pending', 'under_review'].includes(r.status)
    );

    const groups: Map<string, MergeRequestWithDetails[]> = new Map();

    conflictingRequests.forEach(request => {
      const key = request.source_branch?.fork_point_chapter_id || 'unknown';
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(request);
    });

    return Array.from(groups.entries()).map(([forkPointId, requests]) => ({
      fork_point_chapter_id: forkPointId === 'unknown' ? null : forkPointId,
      fork_point_title: `Fork Point ${forkPointId?.slice(0, 8) || 'Unknown'}`,
      requests
    }));
  }, [mergeRequests]);

  // Get user's pending requests
  const getUserPendingRequests = useCallback(() => {
    if (!user) return [];
    return mergeRequests.filter(r => 
      r.requested_by === user.id && ['pending', 'under_review'].includes(r.status)
    );
  }, [mergeRequests, user]);

  return {
    mergeRequests,
    loading,
    pendingCount,
    submitMergeRequest,
    reviewMergeRequest,
    cancelMergeRequest,
    getConflictGroups,
    getUserPendingRequests,
    refresh: loadMergeRequests
  };
};
