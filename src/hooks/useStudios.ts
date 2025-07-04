import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Studio {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface StudioMember {
  id: string;
  studio_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  invited_at: string;
  joined_at: string;
  profiles?: {
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export const useStudios = () => {
  const { user } = useAuth();
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStudios();
    }
  }, [user]);

  const loadStudios = async () => {
    try {
      const { data, error } = await supabase
        .from('studios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudios(data || []);
    } catch (error) {
      console.error('Error loading studios:', error);
    } finally {
      setLoading(false);
    }
  };

  const createStudio = async (name: string, description?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('studios')
        .insert({
          name,
          description,
          owner_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setStudios(prev => [data, ...prev]);
      return data.id;
    } catch (error) {
      console.error('Error creating studio:', error);
      return null;
    }
  };

  const updateStudio = async (studioId: string, updates: Partial<Pick<Studio, 'name' | 'description'>>) => {
    try {
      const { error } = await supabase
        .from('studios')
        .update(updates)
        .eq('id', studioId);

      if (error) throw error;

      setStudios(prev => prev.map(studio => 
        studio.id === studioId 
          ? { ...studio, ...updates, updated_at: new Date().toISOString() }
          : studio
      ));
      return true;
    } catch (error) {
      console.error('Error updating studio:', error);
      return false;
    }
  };

  const getStudioMembers = async (studioId: string): Promise<StudioMember[]> => {
    try {
      const { data, error } = await supabase
        .from('studio_members')
        .select(`
          id,
          studio_id,
          user_id,
          role,
          invited_at,
          joined_at
        `)
        .eq('studio_id', studioId);

      if (error) throw error;

      // Fetch profiles separately
      if (data && data.length > 0) {
        const userIds = data.map(member => member.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        // Merge the data
        return data.map(member => ({
          ...member,
          role: member.role as 'owner' | 'admin' | 'member',
          profiles: profiles?.find(p => p.id === member.user_id)
        }));
      }

      return [];
    } catch (error) {
      console.error('Error loading studio members:', error);
      return [];
    }
  };

  const inviteMember = async (studioId: string, username: string, role: 'admin' | 'member' = 'member') => {
    try {
      // Find the user by username
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();

      if (userError) {
        throw new Error('User not found');
      }

      const { error } = await supabase
        .from('studio_members')
        .insert({
          studio_id: studioId,
          user_id: userData.id,
          role
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error inviting member:', error);
      return false;
    }
  };

  const removeMember = async (studioId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('studio_members')
        .delete()
        .eq('studio_id', studioId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      return false;
    }
  };

  return {
    studios,
    loading,
    createStudio,
    updateStudio,
    getStudioMembers,
    inviteMember,
    removeMember,
    loadStudios
  };
};