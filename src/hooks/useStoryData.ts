import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { analyzeContent } from '@/utils/contentAnalyzer';
import { useAuth } from './useAuth';

// Manual type definitions matching database schema
interface Story {
  id: string;
  title: string;
  description: string | null;
  studio_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type BranchStatus = 'draft' | 'proposed' | 'published' | 'alternate' | 'archived';

interface StoryBranch {
  id: string;
  story_id: string;
  studio_id: string | null;
  parent_branch_id: string | null;
  name: string;
  content: string;
  author_name: string;
  is_main: boolean;
  is_active: boolean;
  is_protected: boolean;
  fork_point_chapter_id: string | null;
  fork_point_order: number | null;
  created_at: string;
  updated_at: string;
  position_x: number | null;
  position_y: number | null;
  status: BranchStatus;
}

interface Chapter {
  id: string;
  story_id: string;
  branch_id: string;
  chapter_order: number;
  title: string;
  content: string;
  status: string;
  author_name: string;
  branch_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChapterVersion {
  id: string;
  chapter_id: string;
  version_number: number;
  content: string;
  merged_from_branch_id: string | null;
  merge_note: string | null;
  author_name: string;
  is_current: boolean;
  created_at: string;
}

export interface SavePoint {
  id: string;
  story_id: string;
  branch_id: string;
  title: string;
  description: string | null;
  author_name: string;
  snapshot_data: any;
  created_at: string;
}

interface ChapterReview {
  id: string;
  chapter_id: string;
  reviewer_name: string;
  status: string;
  feedback: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoryBranchWithMeta extends StoryBranch {
  isActive: boolean;
  chapterCount?: number;
}

export interface ChapterWithReviews extends Chapter {
  reviews: ChapterReview[];
  canMerge: boolean;
  isInherited?: boolean; // True if chapter is after fork point (read-only in drafts)
}

export const useStoryData = (studioId?: string | null, initialBranchId?: string | null, initialChapterId?: string | null) => {
  const { profile } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [branches, setBranches] = useState<StoryBranchWithMeta[]>([]);
  const [chapters, setChapters] = useState<ChapterWithReviews[]>([]);
  const [mainBranchChapters, setMainBranchChapters] = useState<ChapterWithReviews[]>([]); // Always holds main branch chapters for sidebar
  const [savePoints, setSavePoints] = useState<SavePoint[]>([]);
  const [activeBranch, setActiveBranch] = useState<string>(initialBranchId || '');
  const [activeChapter, setActiveChapter] = useState<string>(initialChapterId || '');
  const [loading, setLoading] = useState(true);
  const [chaptersLoading, setChaptersLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    if (studioId) {
      loadStoryData();
    }
  }, [studioId]);

  // Load chapters when active branch changes - non-blocking
  useEffect(() => {
    if (activeBranch) {
      setChaptersLoading(true);
      Promise.all([loadChapters(), loadSavePoints()]).finally(() => {
        setChaptersLoading(false);
      });
    }
  }, [activeBranch]);

  // Load main branch chapters separately for sidebar structure (runs once after branches load)
  useEffect(() => {
    const mainBranch = branches.find(b => b.is_main);
    if (mainBranch) {
      loadMainBranchChapters(mainBranch.id);
    }
  }, [branches]);

  const loadMainBranchChapters = async (mainBranchId: string) => {
    try {
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select(`
          *,
          chapter_reviews (*)
        `)
        .eq('branch_id', mainBranchId)
        .order('chapter_order', { ascending: true });

      if (chaptersError) throw chaptersError;

      const chaptersWithReviews: ChapterWithReviews[] = chaptersData.map(chapter => ({
        ...chapter,
        reviews: (chapter.chapter_reviews || []) as ChapterReview[],
        canMerge: chapter.status === 'approved' && (chapter.chapter_reviews || []).every((review: any) => review.status === 'approved'),
        isInherited: false
      }));

      setMainBranchChapters(chaptersWithReviews);
    } catch (error) {
      console.error('Error loading main branch chapters:', error);
    }
  };

  const loadStoryData = async () => {
    if (!studioId) return;
    
    try {
      // Load stories for the specific studio
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('studio_id', studioId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (storyError) throw storyError;

      let currentStory: Story;
      
      // Use the first story or create a default one if none exists
      if (storyData && storyData.length > 0) {
        currentStory = storyData[0];
        setStory(currentStory);
      } else {
        // Create a default story for this studio
        const { data: newStory, error: createError } = await supabase
          .from('stories')
          .insert({
            title: 'New Collaborative Story',
            description: 'A new story for collaborative writing',
            studio_id: studioId,
            created_by: profile?.id
          })
          .select()
          .single();

        if (createError) throw createError;
        currentStory = newStory;
        setStory(newStory);
        
        // Auto-create main branch for new story (protected by default)
        const { data: mainBranch, error: branchError } = await supabase
          .from('story_branches')
        .insert({
          story_id: currentStory.id,
          studio_id: studioId,
          name: 'Main Story',
          content: '',
          author_name: profile?.username || 'System',
          parent_branch_id: null,
          is_main: true,
          is_active: true,
          is_protected: true,
          status: 'published'
        })
          .select()
          .single();
          
        if (branchError) throw branchError;

      }

      // Load branches for the story (not just studio)
      const { data: branchData, error: branchError } = await supabase
        .from('story_branches')
        .select('*')
        .eq('story_id', currentStory.id)
        .order('created_at', { ascending: true });

      if (branchError) throw branchError;

      // Convert to our format and find active branch
      const branchesWithMeta: StoryBranchWithMeta[] = (branchData || []).map(branch => ({
        ...branch,
        status: branch.status as BranchStatus,
        isActive: branch.is_active
      }));
      
      setBranches(branchesWithMeta);
      
      // Set active branch - prefer initialBranchId, then existing active, then first
      const targetBranchId = (initialBranchId && branchesWithMeta.find(b => b.id === initialBranchId)) 
        ? initialBranchId 
        : branchesWithMeta.find(b => b.is_active)?.id || branchesWithMeta[0]?.id || '';
      setActiveBranch(targetBranchId);
      
    } catch (error) {
      console.error('Error loading story data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChapters = async () => {
    if (!activeBranch) return;

    try {
      // Get current branch info to check for fork point
      const currentBranch = branches.find(b => b.id === activeBranch);
      const forkPointOrder = currentBranch?.fork_point_order;
      const isNonMainBranch = currentBranch && !currentBranch.is_main;

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
        canMerge: chapter.status === 'approved' && (chapter.chapter_reviews || []).every((review: any) => review.status === 'approved'),
        // Mark chapters after fork point as inherited (read-only) for non-main branches
        isInherited: isNonMainBranch && forkPointOrder !== null && forkPointOrder !== undefined 
          ? chapter.chapter_order > forkPointOrder 
          : false
      }));

      setChapters(chaptersWithReviews);
      
      // Set active chapter - prefer initialChapterId, then existing, then first
      if (chaptersWithReviews.length > 0 && !activeChapter) {
        const targetChapterId = (initialChapterId && chaptersWithReviews.find(c => c.id === initialChapterId))
          ? initialChapterId
          : chaptersWithReviews[0].id;
        setActiveChapter(targetChapterId);
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
    if (!story) return null;
    
    try {
      const nextOrder = chapterOrder || (chapters.length > 0 ? Math.max(...chapters.map(c => c.chapter_order)) + 1 : 1);
      
      const { data, error } = await supabase
        .from('chapters')
        .insert({
          story_id: story.id,
          branch_id: activeBranch,
          title,
          content: '',
          chapter_order: nextOrder,
          author_name: profile?.username || 'Anonymous',
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
    if (!story) return null;
    
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
          story_id: story.id,
          branch_id: activeBranch,
          title,
          description,
          author_name: profile?.username || 'Anonymous',
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
          reviewer_name: profile?.username || 'Anonymous',
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
    if (!story || !studioId) return null;
    
    try {
      const parentBranch = branches.find(b => b.id === (parentBranchId || activeBranch));
      const isFirstBranch = branches.length === 0;
      const parentId = parentBranchId || activeBranch || null;
      
      const { data, error } = await supabase
        .from('story_branches')
        .insert({
          story_id: story.id,
          studio_id: studioId,
          name,
          content: parentBranch?.content || '',
          author_name: profile?.username || 'Anonymous',
          parent_branch_id: parentId,
          is_main: isFirstBranch,
          is_active: isFirstBranch,
          is_protected: isFirstBranch, // Only first/main branch is protected
          status: isFirstBranch ? 'published' : 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      const newBranch: StoryBranchWithMeta = {
        ...data,
        status: data.status as BranchStatus,
        isActive: data.is_active
      };

      setBranches(prev => [...prev, newBranch]);
      
      return data.id;
    } catch (error) {
      console.error('Error creating branch:', error);
      throw error;
    }
  };

  // Fork a story from a specific chapter (Git-style fork)
  const forkFromChapter = async (name: string, forkChapterId: string) => {
    if (!story || !studioId) return null;
    
    try {
      const forkChapter = chapters.find(c => c.id === forkChapterId);
      if (!forkChapter) {
        console.error('Fork chapter not found');
        return null;
      }

      const parentBranch = branches.find(b => b.id === activeBranch);
      
      // Create new draft with fork point information
      const { data: newBranchData, error: branchError } = await supabase
        .from('story_branches')
        .insert({
          story_id: story.id,
          studio_id: studioId,
          name,
          content: '',
          author_name: profile?.username || 'Anonymous',
          parent_branch_id: activeBranch,
          is_main: false,
          is_active: false,
          is_protected: false,
          fork_point_chapter_id: forkChapterId,
          fork_point_order: forkChapter.chapter_order,
          status: 'draft'
        })
        .select()
        .single();

      if (branchError) throw branchError;

      // Copy ALL chapters from the parent branch to the new draft
      // Chapters at or before fork point are editable, after are inherited (read-only)
      const allChapters = chapters
        .sort((a, b) => a.chapter_order - b.chapter_order);

      for (const chapter of allChapters) {
        const { error: copyError } = await supabase
          .from('chapters')
          .insert({
            story_id: story.id,
            branch_id: newBranchData.id,
            title: chapter.title,
            content: chapter.content,
            chapter_order: chapter.chapter_order,
            author_name: chapter.author_name,
            // Chapters after fork point start as 'draft' but will be treated as inherited
            status: 'draft'
          });

        if (copyError) {
          console.error('Error copying chapter:', copyError);
        }
      }

      // Update draft count on the fork chapter
      await supabase
        .from('chapters')
        .update({ branch_count: (forkChapter.branch_count || 0) + 1 })
        .eq('id', forkChapterId);

      const newBranch: StoryBranchWithMeta = {
        ...newBranchData,
        status: newBranchData.status as BranchStatus,
        isActive: false
      };

      setBranches(prev => [...prev, newBranch]);
      
      // Update local chapter state
      setChapters(prev => prev.map(c => 
        c.id === forkChapterId 
          ? { ...c, branch_count: (c.branch_count || 0) + 1 }
          : c
      ));
      
      return newBranchData.id;
    } catch (error) {
      console.error('Error creating draft from chapter:', error);
      throw error;
    }
  };

  const switchToBranch = async (branchId: string) => {
    if (!story || branchId === activeBranch) return;
    
    // Optimistically update UI first for responsiveness
    setBranches(prev => prev.map(branch => ({
      ...branch,
      isActive: branch.id === branchId,
      is_active: branch.id === branchId
    })));
    setActiveBranch(branchId);
    setActiveChapter(''); // Reset active chapter when switching branches

    try {
      // Update database in background - batch both updates
      await Promise.all([
        supabase
          .from('story_branches')
          .update({ is_active: false })
          .eq('story_id', story.id)
          .neq('id', branchId),
        supabase
          .from('story_branches')
          .update({ is_active: true })
          .eq('id', branchId)
      ]);
    } catch (error) {
      console.error('Error switching branch:', error);
      // Revert on error
      await loadStoryData();
    }
  };

  const mergeBranch = async (sourceBranchId: string, targetBranchId: string) => {
    try {
      const sourceBranch = branches.find(b => b.id === sourceBranchId);
      const targetBranch = branches.find(b => b.id === targetBranchId);
      
      if (!sourceBranch || !targetBranch) return false;

      // PROTECTION: Cannot merge FROM a protected (main) branch
      if (sourceBranch.is_protected) {
        console.error('Cannot merge from protected branch (Main Story)');
        return false;
      }

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
    console.log('Starting mergeChapter with params:', { chapterId, targetBranchId, mode, targetPosition, replaceChapterId });
    
    try {
      const sourceChapter = chapters.find(c => c.id === chapterId);
      if (!sourceChapter || sourceChapter.status !== 'approved') {
        console.error('Chapter not found or not approved:', { sourceChapter, status: sourceChapter?.status });
        return false;
      }

      // Load target chapters for analysis
      const targetChapters = await loadChaptersFromBranch(targetBranchId);
      console.log('Target chapters loaded:', targetChapters.length);

      if (mode === 'replace' && replaceChapterId) {
        console.log('Executing replace mode for chapter:', replaceChapterId);
        
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

        if (updateError) {
          console.error('Replace update error:', updateError);
          throw updateError;
        }

      } else {
        // Insert, append, subplot, or flashback
        let newChapterOrder: number;
        let chapterTitle = sourceChapter.title;
        
        if (mode === 'insert' && targetPosition) {
          console.log('Executing insert mode at position:', targetPosition);
          
          // Get all chapters at or after the target position
          const { data: chaptersToUpdate, error: selectError } = await supabase
            .from('chapters')
            .select('id, chapter_order')
            .eq('branch_id', targetBranchId)
            .gte('chapter_order', targetPosition)
            .order('chapter_order', { ascending: true });

          if (selectError) {
            console.error('Select chapters error:', selectError);
            throw selectError;
          }

          console.log('Chapters to shift:', chaptersToUpdate?.length || 0);

          // Shift all subsequent chapters by 1
          if (chaptersToUpdate && chaptersToUpdate.length > 0) {
            // Update in reverse order to avoid conflicts
            for (let i = chaptersToUpdate.length - 1; i >= 0; i--) {
              const chapter = chaptersToUpdate[i];
              const { error: updateError } = await supabase
                .from('chapters')
                .update({ chapter_order: chapter.chapter_order + 1 })
                .eq('id', chapter.id);

              if (updateError) {
                console.error('Chapter order update error:', updateError);
                throw updateError;
              }
            }
          }
          
          newChapterOrder = targetPosition;
        } else {
          // For append, subplot, and flashback modes
          const maxOrder = targetChapters.length > 0 ? Math.max(...targetChapters.map(c => c.chapter_order)) : 0;
          newChapterOrder = maxOrder + 1;
          
          if (mode === 'subplot') {
            chapterTitle = `[Subplot] ${sourceChapter.title}`;
          } else if (mode === 'flashback') {
            chapterTitle = `[Flashback] ${sourceChapter.title}`;
          }
        }

        console.log('Creating new chapter with order:', newChapterOrder);

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

        if (insertError) {
          console.error('Chapter insert error:', insertError);
          throw insertError;
        }
      }

      // Update source chapter status
      const { error: updateSourceError } = await supabase
        .from('chapters')
        .update({ status: 'merged' })
        .eq('id', chapterId);

      if (updateSourceError) {
        console.error('Source chapter update error:', updateSourceError);
        throw updateSourceError;
      }

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
      
      console.log('Merge completed successfully');
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
          story_id: story?.id,
          branch_id: activeBranch,
          title: chapter.title,
          content: '', // We don't store full content in snapshots
          chapter_order: index + 1,
          author_name: profile?.username || 'Anonymous',
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

  const moveChapterToBranch = async (chapterId: string, targetBranchId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('chapters')
        .update({ branch_id: targetBranchId })
        .eq('id', chapterId);

      if (error) throw error;

      // Reload chapters to reflect the move
      await loadChapters();
      return true;
    } catch (error) {
      console.error('Error moving chapter:', error);
      return false;
    }
  };

  const saveBranchPosition = async (branchId: string, x: number, y: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('story_branches')
        .update({ 
          position_x: Math.round(x), 
          position_y: Math.round(y) 
        })
        .eq('id', branchId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving branch position:', error);
      return false;
    }
  };

  // Delete a branch (only drafts owned by user, not main/protected)
  const deleteBranch = async (branchId: string): Promise<boolean> => {
    try {
      const branch = branches.find(b => b.id === branchId);
      if (!branch) return false;
      
      // Cannot delete main or protected branches
      if (branch.is_main || branch.is_protected) {
        console.error('Cannot delete main or protected branches');
        return false;
      }
      
      // Only the author can delete their own drafts
      if (branch.author_name !== profile?.username) {
        console.error('Only the author can delete their draft');
        return false;
      }

      // Delete all chapters in this branch first
      const { error: chaptersError } = await supabase
        .from('chapters')
        .delete()
        .eq('branch_id', branchId);

      if (chaptersError) throw chaptersError;

      // Delete the branch
      const { error: branchError } = await supabase
        .from('story_branches')
        .delete()
        .eq('id', branchId);

      if (branchError) throw branchError;

      // Update local state
      setBranches(prev => prev.filter(b => b.id !== branchId));
      
      // Switch to main branch if we deleted the active branch
      if (activeBranch === branchId) {
        const mainBranch = branches.find(b => b.is_main);
        if (mainBranch) {
          setActiveBranch(mainBranch.id);
        }
      }

      return true;
    } catch (error) {
      console.error('Error deleting branch:', error);
      return false;
    }
  };

  // Fork from any branch (not just active) - useful for forking from alternates
  const forkFromBranch = async (name: string, sourceBranchId: string): Promise<string | null> => {
    if (!story || !studioId) return null;
    
    try {
      const sourceBranch = branches.find(b => b.id === sourceBranchId);
      if (!sourceBranch) {
        console.error('Source branch not found');
        return null;
      }

      // Load chapters from source branch
      const sourceChapters = await loadChaptersFromBranch(sourceBranchId);
      const lastChapter = sourceChapters.length > 0 
        ? sourceChapters.reduce((max, c) => c.chapter_order > max.chapter_order ? c : max, sourceChapters[0])
        : null;
      
      // Create new draft
      const { data: newBranchData, error: branchError } = await supabase
        .from('story_branches')
        .insert({
          story_id: story.id,
          studio_id: studioId,
          name,
          content: '',
          author_name: profile?.username || 'Anonymous',
          parent_branch_id: sourceBranchId,
          is_main: false,
          is_active: false,
          is_protected: false,
          fork_point_chapter_id: lastChapter?.id || null,
          fork_point_order: lastChapter?.chapter_order || null,
          status: 'draft'
        })
        .select()
        .single();

      if (branchError) throw branchError;

      // Copy all chapters from source branch
      for (const chapter of sourceChapters) {
        await supabase
          .from('chapters')
          .insert({
            story_id: story.id,
            branch_id: newBranchData.id,
            title: chapter.title,
            content: chapter.content,
            chapter_order: chapter.chapter_order,
            author_name: chapter.author_name,
            status: 'draft'
          });
      }

      const newBranch: StoryBranchWithMeta = {
        ...newBranchData,
        status: newBranchData.status as BranchStatus,
        isActive: false
      };

      setBranches(prev => [...prev, newBranch]);
      return newBranchData.id;
    } catch (error) {
      console.error('Error forking from branch:', error);
      return null;
    }
  };

  // Continue writing on an alternate branch (original author only)
  const continueBranch = async (branchId: string): Promise<string | null> => {
    const branch = branches.find(b => b.id === branchId);
    if (!branch) return null;
    
    // Only the original author can continue an alternate
    if (branch.author_name !== profile?.username) {
      console.error('Only the original author can continue this branch');
      return null;
    }
    
    // Only alternates can be continued
    if (branch.status !== 'alternate') {
      console.error('Only alternate branches can be continued');
      return null;
    }

    // Create a new draft that continues from this alternate
    const newName = `${branch.name} (continued)`;
    return forkFromBranch(newName, branchId);
  };

  // Update branch status (for admin actions)
  const setBranchStatus = async (branchId: string, status: BranchStatus): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('story_branches')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', branchId);

      if (error) throw error;

      setBranches(prev => prev.map(b => 
        b.id === branchId ? { ...b, status } : b
      ));

      return true;
    } catch (error) {
      console.error('Error updating branch status:', error);
      return false;
    }
  };

  // Set branch as proposed (for writers submitting for review)
  const proposeBranch = async (branchId: string): Promise<boolean> => {
    return setBranchStatus(branchId, 'proposed');
  };

  return {
    story,
    branches,
    chapters,
    mainBranchChapters, // Always contains main branch chapters for sidebar structure
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
    forkFromChapter,
    forkFromBranch,
    continueBranch,
    deleteBranch,
    setBranchStatus,
    proposeBranch,
    switchToBranch,
    mergeBranch,
    mergeChapter,
    mergeStoryVersion,
    restoreSavePoint,
    loadChaptersFromBranch,
    moveChapterToBranch,
    saveBranchPosition,
  };
};
