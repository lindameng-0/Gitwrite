-- Add status column to story_branches for Git-like workflow
-- Status values: 'draft', 'proposed', 'published', 'alternate', 'archived'

ALTER TABLE public.story_branches 
ADD COLUMN status text NOT NULL DEFAULT 'draft';

-- Update existing branches based on is_main
UPDATE public.story_branches SET status = 'published' WHERE is_main = true;
UPDATE public.story_branches SET status = 'draft' WHERE is_main = false;

-- Create index for faster status queries
CREATE INDEX idx_story_branches_status ON public.story_branches(status);
CREATE INDEX idx_story_branches_story_status ON public.story_branches(story_id, status);