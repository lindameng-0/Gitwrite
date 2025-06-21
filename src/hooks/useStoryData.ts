
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Story = Database['public']['Tables']['stories']['Row'];
type StoryBranch = Database['public']['Tables']['story_branches']['Row'];

export interface StoryBranchWithMeta extends StoryBranch {
  isActive: boolean;
}

export const useStoryData = () => {
  const [story, setStory] = useState<Story | null>(null);
  const [branches, setBranches] = useState<StoryBranchWithMeta[]>([]);
  const [activeBranch, setActiveBranch] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    loadStoryData();
  }, []);

  const loadStoryData = async () => {
    try {
      // Load the default story
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single();

      if (storyError) throw storyError;

      // Load all branches for this story
      const { data: branchData, error: branchError } = await supabase
        .from('story_branches')
        .select('*')
        .eq('story_id', '00000000-0000-0000-0000-000000000001')
        .order('created_at', { ascending: true });

      if (branchError) throw branchError;

      setStory(storyData);
      
      // Convert to our format and find active branch
      const branchesWithMeta: StoryBranchWithMeta[] = branchData.map(branch => ({
        ...branch,
        isActive: branch.is_active
      }));
      
      setBranches(branchesWithMeta);
      
      // Set active branch (main branch or first one)
      const activeBranchId = branchData.find(b => b.is_active)?.id || branchData[0]?.id || '';
      setActiveBranch(activeBranchId);
      
    } catch (error) {
      console.error('Error loading story data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBranchContent = async (branchId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('story_branches')
        .update({ 
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', branchId);

      if (error) throw error;

      // Update local state
      setBranches(prev => prev.map(branch => 
        branch.id === branchId 
          ? { ...branch, content, updated_at: new Date().toISOString() }
          : branch
      ));
    } catch (error) {
      console.error('Error updating branch content:', error);
    }
  };

  const createNewBranch = async (name: string, parentBranchId?: string) => {
    try {
      const parentBranch = branches.find(b => b.id === (parentBranchId || activeBranch));
      
      const { data, error } = await supabase
        .from('story_branches')
        .insert({
          story_id: '00000000-0000-0000-0000-000000000001',
          name,
          content: parentBranch?.content || '',
          author_name: 'You',
          parent_branch_id: parentBranchId || activeBranch,
          is_main: false,
          is_active: false
        })
        .select()
        .single();

      if (error) throw error;

      const newBranch: StoryBranchWithMeta = {
        ...data,
        isActive: false
      };

      setBranches(prev => [...prev, newBranch]);
      setActiveBranch(data.id);
      
      return data.id;
    } catch (error) {
      console.error('Error creating branch:', error);
      return null;
    }
  };

  const switchToBranch = async (branchId: string) => {
    try {
      // Update all branches to inactive
      const { error: updateError } = await supabase
        .from('story_branches')
        .update({ is_active: false })
        .eq('story_id', '00000000-0000-0000-0000-000000000001');

      if (updateError) throw updateError;

      // Set the selected branch as active
      const { error: activateError } = await supabase
        .from('story_branches')
        .update({ is_active: true })
        .eq('id', branchId);

      if (activateError) throw activateError;

      // Update local state
      setBranches(prev => prev.map(branch => ({
        ...branch,
        isActive: branch.id === branchId,
        is_active: branch.id === branchId
      })));

      setActiveBranch(branchId);
    } catch (error) {
      console.error('Error switching branch:', error);
    }
  };

  const mergeBranch = async (sourceBranchId: string, targetBranchId: string) => {
    try {
      const sourceBranch = branches.find(b => b.id === sourceBranchId);
      const targetBranch = branches.find(b => b.id === targetBranchId);
      
      if (!sourceBranch || !targetBranch) return false;

      // For now, simple merge: append source content to target
      const mergedContent = `${targetBranch.content}\n\n--- Merged from "${sourceBranch.name}" ---\n\n${sourceBranch.content}`;

      const { error } = await supabase
        .from('story_branches')
        .update({ 
          content: mergedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetBranchId);

      if (error) throw error;

      // Update local state
      setBranches(prev => prev.map(branch => 
        branch.id === targetBranchId 
          ? { ...branch, content: mergedContent, updated_at: new Date().toISOString() }
          : branch
      ));

      return true;
    } catch (error) {
      console.error('Error merging branch:', error);
      return false;
    }
  };

  return {
    story,
    branches,
    activeBranch,
    loading,
    updateBranchContent,
    createNewBranch,
    switchToBranch,
    mergeBranch
  };
};
