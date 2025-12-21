-- Add is_protected flag to story_branches to lock the main branch
ALTER TABLE public.story_branches 
ADD COLUMN IF NOT EXISTS is_protected boolean NOT NULL DEFAULT false;

-- Update existing main branches to be protected
UPDATE public.story_branches 
SET is_protected = true 
WHERE is_main = true;

-- Add fork_point_chapter_id to track where a branch forked from
ALTER TABLE public.story_branches 
ADD COLUMN IF NOT EXISTS fork_point_chapter_id uuid REFERENCES public.chapters(id);

-- Add fork_point_order to track the chapter order at fork time
ALTER TABLE public.story_branches 
ADD COLUMN IF NOT EXISTS fork_point_order integer;

-- Create chapter_versions table for version history
CREATE TABLE IF NOT EXISTS public.chapter_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  content text NOT NULL DEFAULT '',
  merged_from_branch_id uuid REFERENCES public.story_branches(id),
  merge_note text,
  author_name text NOT NULL DEFAULT 'Anonymous',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_current boolean NOT NULL DEFAULT true
);

-- Enable RLS on chapter_versions
ALTER TABLE public.chapter_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies for chapter_versions
CREATE POLICY "Anyone can view chapter versions"
ON public.chapter_versions
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create chapter versions"
ON public.chapter_versions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authors can update chapter versions"
ON public.chapter_versions
FOR UPDATE
USING (true);

-- Add branch_count to chapters for quick lookup (denormalized for performance)
ALTER TABLE public.chapters
ADD COLUMN IF NOT EXISTS branch_count integer NOT NULL DEFAULT 0;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_chapter_versions_chapter_id ON public.chapter_versions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_versions_is_current ON public.chapter_versions(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_story_branches_fork_point ON public.story_branches(fork_point_chapter_id) WHERE fork_point_chapter_id IS NOT NULL;