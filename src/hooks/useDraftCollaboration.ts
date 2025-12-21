import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DraftSuggestion {
  id: string;
  chapter_id: string;
  branch_id: string;
  user_id: string;
  author_name: string;
  suggestion_text: string;
  original_text: string | null;
  selection_start: number | null;
  selection_end: number | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface DraftCollaborator {
  id: string;
  branch_id: string;
  user_id: string;
  invited_by: string | null;
  status: 'pending' | 'approved' | 'rejected';
  role: 'editor' | 'viewer';
  requested_at: string;
  approved_at: string | null;
}

interface UseDraftCollaborationProps {
  branchId: string | null;
  chapterId?: string | null;
  draftOwnerName?: string;
}

export const useDraftCollaboration = ({ branchId, chapterId, draftOwnerName }: UseDraftCollaborationProps) => {
  const { profile } = useAuth();
  const [suggestions, setSuggestions] = useState<DraftSuggestion[]>([]);
  const [collaborators, setCollaborators] = useState<DraftCollaborator[]>([]);
  const [myCollaboratorStatus, setMyCollaboratorStatus] = useState<DraftCollaborator | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if current user is the draft owner
  const isDraftOwner = profile?.username === draftOwnerName;

  // Check if current user has edit access
  const hasEditAccess = isDraftOwner || 
    (myCollaboratorStatus?.status === 'approved' && myCollaboratorStatus?.role === 'editor');

  // Check if current user can make suggestions
  const canSuggest = !isDraftOwner && !hasEditAccess && !!profile;

  // Load suggestions for current chapter/branch
  const loadSuggestions = useCallback(async () => {
    if (!branchId) return;

    try {
      let query = supabase
        .from('draft_suggestions')
        .select('*')
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false });

      if (chapterId) {
        query = query.eq('chapter_id', chapterId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSuggestions((data || []) as DraftSuggestion[]);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  }, [branchId, chapterId]);

  // Load collaborators for branch
  const loadCollaborators = useCallback(async () => {
    if (!branchId) return;

    try {
      const { data, error } = await supabase
        .from('draft_collaborators')
        .select('*')
        .eq('branch_id', branchId)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      
      const collaboratorData = (data || []) as DraftCollaborator[];
      setCollaborators(collaboratorData);

      // Find current user's collaborator status
      if (profile?.id) {
        const myStatus = collaboratorData.find(c => c.user_id === profile.id);
        setMyCollaboratorStatus(myStatus || null);
      }
    } catch (error) {
      console.error('Error loading collaborators:', error);
    }
  }, [branchId, profile?.id]);

  // Load data when branch/chapter changes
  useEffect(() => {
    if (branchId) {
      setLoading(true);
      Promise.all([loadSuggestions(), loadCollaborators()])
        .finally(() => setLoading(false));
    }
  }, [branchId, chapterId, loadSuggestions, loadCollaborators]);

  // Add a suggestion
  const addSuggestion = async (
    chapterId: string,
    suggestionText: string,
    originalText?: string,
    selectionStart?: number,
    selectionEnd?: number
  ): Promise<boolean> => {
    if (!branchId || !profile) return false;

    try {
      const { error } = await supabase
        .from('draft_suggestions')
        .insert({
          chapter_id: chapterId,
          branch_id: branchId,
          user_id: profile.id,
          author_name: profile.username,
          suggestion_text: suggestionText,
          original_text: originalText || null,
          selection_start: selectionStart || null,
          selection_end: selectionEnd || null,
          status: 'pending'
        });

      if (error) throw error;
      await loadSuggestions();
      return true;
    } catch (error) {
      console.error('Error adding suggestion:', error);
      return false;
    }
  };

  // Resolve a suggestion (accept or reject)
  const resolveSuggestion = async (
    suggestionId: string,
    status: 'accepted' | 'rejected'
  ): Promise<boolean> => {
    if (!profile) return false;

    try {
      const { error } = await supabase
        .from('draft_suggestions')
        .update({
          status,
          resolved_at: new Date().toISOString(),
          resolved_by: profile.username
        })
        .eq('id', suggestionId);

      if (error) throw error;
      await loadSuggestions();
      return true;
    } catch (error) {
      console.error('Error resolving suggestion:', error);
      return false;
    }
  };

  // Delete a suggestion (only author can delete pending suggestions)
  const deleteSuggestion = async (suggestionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('draft_suggestions')
        .delete()
        .eq('id', suggestionId);

      if (error) throw error;
      await loadSuggestions();
      return true;
    } catch (error) {
      console.error('Error deleting suggestion:', error);
      return false;
    }
  };

  // Request collaborator access
  const requestCollaboratorAccess = async (role: 'editor' | 'viewer' = 'editor'): Promise<boolean> => {
    if (!branchId || !profile) return false;

    try {
      const { error } = await supabase
        .from('draft_collaborators')
        .insert({
          branch_id: branchId,
          user_id: profile.id,
          role,
          status: 'pending'
        });

      if (error) throw error;
      await loadCollaborators();
      return true;
    } catch (error) {
      console.error('Error requesting access:', error);
      return false;
    }
  };

  // Approve/reject collaborator request
  const updateCollaboratorStatus = async (
    collaboratorId: string,
    status: 'approved' | 'rejected'
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('draft_collaborators')
        .update({
          status,
          approved_at: status === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', collaboratorId);

      if (error) throw error;
      await loadCollaborators();
      return true;
    } catch (error) {
      console.error('Error updating collaborator status:', error);
      return false;
    }
  };

  // Remove collaborator
  const removeCollaborator = async (collaboratorId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('draft_collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (error) throw error;
      await loadCollaborators();
      return true;
    } catch (error) {
      console.error('Error removing collaborator:', error);
      return false;
    }
  };

  // Get pending counts for notifications
  const pendingSuggestionsCount = suggestions.filter(s => s.status === 'pending').length;
  const pendingCollaboratorRequestsCount = collaborators.filter(c => c.status === 'pending').length;

  return {
    // Data
    suggestions,
    collaborators,
    myCollaboratorStatus,
    loading,
    
    // Permissions
    isDraftOwner,
    hasEditAccess,
    canSuggest,
    
    // Counts
    pendingSuggestionsCount,
    pendingCollaboratorRequestsCount,
    
    // Actions
    addSuggestion,
    resolveSuggestion,
    deleteSuggestion,
    requestCollaboratorAccess,
    updateCollaboratorStatus,
    removeCollaborator,
    
    // Refresh
    refreshSuggestions: loadSuggestions,
    refreshCollaborators: loadCollaborators,
  };
};
