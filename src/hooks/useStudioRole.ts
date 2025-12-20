import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type StudioRole = 'owner' | 'admin' | 'writer' | 'member' | 'viewer' | null;

interface StudioRoleState {
  role: StudioRole;
  isOwner: boolean;
  isAdmin: boolean;
  isWriter: boolean;
  isViewer: boolean;
  canMerge: boolean;
  canReview: boolean;
  canCreateBranch: boolean;
  canEditAnyChapter: boolean;
  loading: boolean;
}

export const useStudioRole = (studioId: string | null): StudioRoleState => {
  const { user } = useAuth();
  const [role, setRole] = useState<StudioRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!studioId || !user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        // First check if user is the studio owner
        const { data: studio } = await supabase
          .from('studios')
          .select('owner_id')
          .eq('id', studioId)
          .single();

        if (studio?.owner_id === user.id) {
          setRole('owner');
          setLoading(false);
          return;
        }

        // Then check studio_members for their role
        const { data: membership } = await supabase
          .from('studio_members')
          .select('role')
          .eq('studio_id', studioId)
          .eq('user_id', user.id)
          .single();

        if (membership) {
          // Normalize role values
          const normalizedRole = membership.role as StudioRole;
          setRole(normalizedRole);
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error('Error fetching studio role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [studioId, user]);

  // Derive permissions from role
  const isOwner = role === 'owner';
  const isAdmin = role === 'admin' || isOwner;
  const isWriter = role === 'writer' || role === 'member' || isAdmin;
  const isViewer = role === 'viewer' || isWriter;

  // Admin-only capabilities
  const canMerge = isAdmin;
  const canReview = isAdmin;
  const canEditAnyChapter = isAdmin;
  
  // Writer+ capabilities
  const canCreateBranch = isWriter;

  return {
    role,
    isOwner,
    isAdmin,
    isWriter,
    isViewer,
    canMerge,
    canReview,
    canCreateBranch,
    canEditAnyChapter,
    loading
  };
};
