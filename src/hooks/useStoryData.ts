import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Story = Database['public']['Tables']['stories']['Row'];
type StoryBranch = Database['public']['Tables']['story_branches']['Row'];
type Chapter = Database['public']['Tables']['chapters']['Row'];
export type SavePoint = Database['public']['Tables']['save_points']['Row'];
type ChapterReview = Database['public']['Tables']['chapter_reviews']['Row'];

export interface StoryBranchWithMeta extends StoryBranch {
  isActive: boolean;
  chapterCount?: number;
}

export interface ChapterWithReviews extends Chapter {
  reviews: ChapterReview[];
  canMerge: boolean;
}

export const useStoryData = () => {
  const [story, setStory] = useState<Story | null>(null);
  const [branches, setBranches] = useState<StoryBranchWithMeta[]>([]);
  const [chapters, setChapters] = useState<ChapterWithReviews[]>([]);
  const [savePoints, setSavePoints] = useState<SavePoint[]>([]);
  const [activeBranch, setActiveBranch] = useState<string>('');
  const [activeChapter, setActiveChapter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    loadStoryData();
  }, []);

  // Load chapters when active branch changes
  useEffect(() => {
    if (activeBranch) {
      loadChapters();
      loadSavePoints();
    }
  }, [activeBranch]);

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

  const loadChapters = async () => {
    if (!activeBranch) return;

    try {
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select(`
          *,
          chapter_reviews (*)
        `)
        .eq('branch_id', activeBranch)
        .order('chapter_order', { ascending: true });

      if (chaptersError) throw chaptersError;

      const chaptersWithReviews: ChapterWithReviews[] = chaptersData.map(chapter => ({
        ...chapter,
        reviews: (chapter.chapter_reviews || []) as ChapterReview[],
        canMerge: chapter.status === 'approved' && (chapter.chapter_reviews || []).every((review: any) => review.status === 'approved')
      }));

      setChapters(chaptersWithReviews);
      
      // Set active chapter to first one if none selected
      if (chaptersWithReviews.length > 0 && !activeChapter) {
        setActiveChapter(chaptersWithReviews[0].id);
      }
    } catch (error) {
      console.error('Error loading chapters:', error);
    }
  };

  const loadChaptersFromBranch = async (branchId: string): Promise<ChapterWithReviews[]> => {
    try {
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select(`
          *,
          chapter_reviews (*)
        `)
        .eq('branch_id', branchId)
        .order('chapter_order', { ascending: true });

      if (chaptersError) throw chaptersError;

      return chaptersData.map(chapter => ({
        ...chapter,
        reviews: (chapter.chapter_reviews || []) as ChapterReview[],
        canMerge: chapter.status === 'approved' && (chapter.chapter_reviews || []).every((review: any) => review.status === 'approved')
      }));
    } catch (error) {
      console.error('Error loading chapters from branch:', error);
      return [];
    }
  };

  const loadSavePoints = async () => {
    if (!activeBranch) return;

    try {
      const { data: savePointsData, error } = await supabase
        .from('save_points')
        .select('*')
        .eq('branch_id', activeBranch)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavePoints(savePointsData || []);
    } catch (error) {
      console.error('Error loading save points:', error);
    }
  };

  const updateChapterContent = async (chapterId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('chapters')
        .update({ 
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', chapterId);

      if (error) throw error;

      // Update local state
      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId 
          ? { ...chapter, content, updated_at: new Date().toISOString() }
          : chapter
      ));
    } catch (error) {
      console.error('Error updating chapter content:', error);
      throw error;
    }
  };

  const createNewChapter = async (title: string, chapterOrder?: number) => {
    try {
      const nextOrder = chapterOrder || (chapters.length > 0 ? Math.max(...chapters.map(c => c.chapter_order)) + 1 : 1);
      
      const { data, error } = await supabase
        .from('chapters')
        .insert({
          story_id: '00000000-0000-0000-0000-000000000001',
          branch_id: activeBranch,
          title,
          content: '',
          chapter_order: nextOrder,
          author_name: 'You',
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      const newChapter: ChapterWithReviews = {
        ...data,
        reviews: [],
        canMerge: false
      };

      setChapters(prev => [...prev, newChapter].sort((a, b) => a.chapter_order - b.chapter_order));
      setActiveChapter(data.id);
      
      return data.id;
    } catch (error) {
      console.error('Error creating chapter:', error);
      return null;
    }
  };

  const createSavePoint = async (title: string, description?: string) => {
    try {
      const snapshotData = {
        chapters: chapters.map(chapter => ({
          id: chapter.id,
          title: chapter.title,
          status: chapter.status,
          word_count: chapter.content.split(' ').length
        })),
        total_word_count: chapters.reduce((acc, chapter) => acc + chapter.content.split(' ').length, 0),
        timestamp: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('save_points')
        .insert({
          story_id: '00000000-0000-0000-0000-000000000001',
          branch_id: activeBranch,
          title,
          description,
          author_name: 'You',
          snapshot_data: snapshotData
        })
        .select()
        .single();

      if (error) throw error;

      setSavePoints(prev => [data, ...prev]);
      return data.id;
    } catch (error) {
      console.error('Error creating save point:', error);
      return null;
    }
  };

  const submitChapterForReview = async (chapterId: string) => {
    try {
      const { error } = await supabase
        .from('chapters')
        .update({ status: 'review' })
        .eq('id', chapterId);

      if (error) throw error;

      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId 
          ? { ...chapter, status: 'review' as const }
          : chapter
      ));
    } catch (error) {
      console.error('Error submitting chapter for review:', error);
      throw error;
    }
  };

  const reviewChapter = async (chapterId: string, status: 'approved' | 'changes_requested', feedback?: string) => {
    try {
      // Add review
      const { error: reviewError } = await supabase
        .from('chapter_reviews')
        .insert({
          chapter_id: chapterId,
          reviewer_name: 'Reviewer', // In real app, this would be current user
          status,
          feedback
        });

      if (reviewError) throw reviewError;

      // Update chapter status if approved
      if (status === 'approved') {
        const { error: chapterError } = await supabase
          .from('chapters')
          .update({ status: 'approved' })
          .eq('id', chapterId);

        if (chapterError) throw chapterError;
      }

      // Reload chapters to get updated reviews
      await loadChapters();
    } catch (error) {
      console.error('Error reviewing chapter:', error);
      throw error;
    }
  };

  // Keep existing branch operations
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
      
      return data.id;
    } catch (error) {
      console.error('Error creating branch:', error);
      return null;
    }
  };

  const switchToBranch = async (branchId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('story_branches')
        .update({ is_active: false })
        .eq('story_id', '00000000-0000-0000-0000-000000000001');

      if (updateError) throw updateError;

      const { error: activateError } = await supabase
        .from('story_branches')
        .update({ is_active: true })
        .eq('id', branchId);

      if (activateError) throw activateError;

      setBranches(prev => prev.map(branch => ({
        ...branch,
        isActive: branch.id === branchId,
        is_active: branch.id === branchId
      })));

      setActiveBranch(branchId);
      setActiveChapter(''); // Reset active chapter when switching branches
    } catch (error) {
      console.error('Error switching branch:', error);
    }
  };

  const mergeBranch = async (sourceBranchId: string, targetBranchId: string) => {
    try {
      const sourceBranch = branches.find(b => b.id === sourceBranchId);
      const targetBranch = branches.find(b => b.id === targetBranchId);
      
      if (!sourceBranch || !targetBranch) return false;

      const mergedContent = `${targetBranch.content}\n\n--- Merged from "${sourceBranch.name}" ---\n\n${sourceBranch.content}`;

      const { error } = await supabase
        .from('story_branches')
        .update({ 
          content: mergedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetBranchId);

      if (error) throw error;

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

  const mergeChapter = async (
    chapterId: string, 
    targetBranchId: string, 
    mode: 'replace' | 'insert' | 'append' | 'subplot' | 'flashback' = 'append',
    mergeNote?: string,
    targetPosition?: number,
    replaceChapterId?: string
  ) => {
    try {
      const sourceChapter = chapters.find(c => c.id === chapterId);
      if (!sourceChapter || sourceChapter.status !== 'approved') {
        console.error('Chapter not found or not approved');
        return false;
      }

      if (mode === 'replace' && replaceChapterId) {
        // Replace existing chapter
        const { error: updateError } = await supabase
          .from('chapters')
          .update({
            title: sourceChapter.title,
            content: sourceChapter.content,
            author_name: sourceChapter.author_name,
            status: 'merged',
            updated_at: new Date().toISOString()
          })
          .eq('id', replaceChapterId);

        if (updateError) throw updateError;

      } else {
        // Insert, append, subplot, or flashback
        const { data: targetChapters, error: targetChaptersError } = await supabase
          .from('chapters')
          .select('chapter_order')
          .eq('branch_id', targetBranchId)
          .order('chapter_order', { ascending: false })
          .limit(1);

        if (targetChaptersError) throw targetChaptersError;

        let newChapterOrder: number;
        let chapterTitle = sourceChapter.title;
        
        if (mode === 'insert' && targetPosition) {
          // First, get all chapters that need their order updated
          const { data: chaptersToUpdate, error: selectError } = await supabase
            .from('chapters')
            .select('id, chapter_order')
            .eq('branch_id', targetBranchId)
            .gte('chapter_order', targetPosition);

          if (selectError) throw selectError;

          // Update each chapter's order individually
          for (const chapter of chaptersToUpdate || []) {
            const { error: updateError } = await supabase
              .from('chapters')
              .update({ chapter_order: chapter.chapter_order + 1 })
              .eq('id', chapter.id);

            if (updateError) throw updateError;
          }
          
          newChapterOrder = targetPosition;
        } else if (mode === 'subplot') {
          // For subplot, we might want to add a prefix to the title
          chapterTitle = `[Subplot] ${sourceChapter.title}`;
          newChapterOrder = targetChapters.length > 0 ? targetChapters[0].chapter_order + 1 : 1;
        } else if (mode === 'flashback') {
          // For flashback, add a prefix
          chapterTitle = `[Flashback] ${sourceChapter.title}`;
          newChapterOrder = targetChapters.length > 0 ? targetChapters[0].chapter_order + 1 : 1;
        } else {
          // Append mode
          newChapterOrder = targetChapters.length > 0 ? targetChapters[0].chapter_order + 1 : 1;
        }

        // Create new chapter
        const { error: insertError } = await supabase
          .from('chapters')
          .insert({
            story_id: sourceChapter.story_id,
            branch_id: targetBranchId,
            title: chapterTitle,
            content: sourceChapter.content,
            chapter_order: newChapterOrder,
            author_name: sourceChapter.author_name,
            status: 'merged'
          });

        if (insertError) throw insertError;
      }

      // Update source chapter status
      const { error: updateSourceError } = await supabase
        .from('chapters')
        .update({ status: 'merged' })
        .eq('id', chapterId);

      if (updateSourceError) throw updateSourceError;

      // Create save point
      const sourceBranch = branches.find(b => b.id === activeBranch);
      const targetBranch = branches.find(b => b.id === targetBranchId);
      
      await createSavePoint(
        `${mode === 'replace' ? 'Replaced' : mode === 'insert' ? 'Inserted' : 
           mode === 'subplot' ? 'Added subplot' : mode === 'flashback' ? 'Added flashback' : 'Added'} "${sourceChapter.title}" from ${sourceBranch?.name || 'branch'} to ${targetBranch?.name || 'Main Story'}`,
        mergeNote
      );

      // Reload chapters
      await loadChapters();
      
      return true;
    } catch (error) {
      console.error('Error merging chapter:', error);
      return false;
    }
  };

  const restoreSavePoint = async (savePointId: string) => {
    try {
      const savePoint = savePoints.find(sp => sp.id === savePointId);
      if (!savePoint) {
        console.error('Save point not found');
        return false;
      }

      const snapshotData = typeof savePoint.snapshot_data === 'string' 
        ? JSON.parse(savePoint.snapshot_data) 
        : savePoint.snapshot_data;

      // Delete all current chapters in this branch
      const { error: deleteError } = await supabase
        .from('chapters')
        .delete()
        .eq('branch_id', activeBranch);

      if (deleteError) throw deleteError;

      // Restore chapters from snapshot
      if (snapshotData.chapters && snapshotData.chapters.length > 0) {
        const chaptersToRestore = snapshotData.chapters.map((chapter: any, index: number) => ({
          story_id: '00000000-0000-0000-0000-000000000001',
          branch_id: activeBranch,
          title: chapter.title,
          content: '', // We don't store full content in snapshots
          chapter_order: index + 1,
          author_name: 'Restored',
          status: chapter.status || 'draft'
        }));

        const { error: insertError } = await supabase
          .from('chapters')
          .insert(chaptersToRestore);

        if (insertError) throw insertError;
      }

      // Create a save point to mark this restoration
      await createSavePoint(
        `Restored to: ${savePoint.title}`,
        `Restored story state from ${new Date(savePoint.created_at).toLocaleString()}`
      );

      // Reload data
      await loadChapters();
      await loadSavePoints();
      
      return true;
    } catch (error) {
      console.error('Error restoring save point:', error);
      return false;
    }
  };

  const mergeStoryVersion = async (sourceBranchId: string, targetBranchId: string, mergeNote?: string) => {
    try {
      const sourceBranch = branches.find(b => b.id === sourceBranchId);
      const targetBranch = branches.find(b => b.id === targetBranchId);
      
      if (!sourceBranch || !targetBranch) {
        console.error('Source or target branch not found');
        return false;
      }

      // Get all approved chapters from source branch
      const { data: sourceChapters, error: sourceChaptersError } = await supabase
        .from('chapters')
        .select('*')
        .eq('branch_id', sourceBranchId)
        .eq('status', 'approved');

      if (sourceChaptersError) throw sourceChaptersError;

      if (sourceChapters.length === 0) {
        console.error('No approved chapters to merge');
        return false;
      }

      // Get current max chapter order in target branch
      const { data: targetChapters, error: targetChaptersError } = await supabase
        .from('chapters')
        .select('chapter_order')
        .eq('branch_id', targetBranchId)
        .order('chapter_order', { ascending: false })
        .limit(1);

      if (targetChaptersError) throw targetChaptersError;

      let nextChapterOrder = targetChapters.length > 0 ? targetChapters[0].chapter_order + 1 : 1;

      // Insert all approved chapters into target branch
      const chaptersToInsert = sourceChapters.map(chapter => ({
        story_id: chapter.story_id,
        branch_id: targetBranchId,
        title: chapter.title,
        content: chapter.content,
        chapter_order: nextChapterOrder++,
        author_name: chapter.author_name,
        status: 'merged' as const
      }));

      const { error: insertError } = await supabase
        .from('chapters')
        .insert(chaptersToInsert);

      if (insertError) throw insertError;

      // Update source chapters to merged status
      const sourceChapterIds = sourceChapters.map(c => c.id);
      const { error: updateError } = await supabase
        .from('chapters')
        .update({ status: 'merged' })
        .in('id', sourceChapterIds);

      if (updateError) throw updateError;

      // Create a save point to record this merge
      await createSavePoint(
        `Merged story version "${sourceBranch.name}" into "${targetBranch.is_main ? 'Main Story' : targetBranch.name}"`,
        mergeNote
      );

      // Reload data to reflect changes
      await loadChapters();
      
      return true;
    } catch (error) {
      console.error('Error merging story version:', error);
      return false;
    }
  };

  return {
    story,
    branches,
    chapters,
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
    switchToBranch,
    mergeBranch,
    mergeChapter,
    mergeStoryVersion,
    restoreSavePoint,
    loadChaptersFromBranch
  };
};
