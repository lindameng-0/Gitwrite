-- Add deleted_at column for soft delete of branches
ALTER TABLE public.story_branches
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for efficient filtering of non-deleted branches
CREATE INDEX idx_story_branches_deleted_at ON public.story_branches(deleted_at) WHERE deleted_at IS NULL;

-- Add comment explaining the soft delete behavior
COMMENT ON COLUMN public.story_branches.deleted_at IS 'Soft delete timestamp. Branches with non-null deleted_at are considered deleted and should be hidden from UI. Can be recovered within 30 days.';