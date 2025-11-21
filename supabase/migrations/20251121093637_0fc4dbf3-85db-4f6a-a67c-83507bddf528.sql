-- Add position fields to story_branches for custom layouts
ALTER TABLE public.story_branches 
ADD COLUMN IF NOT EXISTS position_x integer,
ADD COLUMN IF NOT EXISTS position_y integer;

-- Add comment explaining the fields
COMMENT ON COLUMN public.story_branches.position_x IS 'X coordinate for custom node positioning in visualizer';
COMMENT ON COLUMN public.story_branches.position_y IS 'Y coordinate for custom node positioning in visualizer';