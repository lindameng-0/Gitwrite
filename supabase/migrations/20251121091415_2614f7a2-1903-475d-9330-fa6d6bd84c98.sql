-- Ensure all chapters without a valid branch are assigned to a main branch
-- This migration handles orphaned chapters

-- First, for each story, ensure there's at least one main branch
DO $$
DECLARE
  story_record RECORD;
  main_branch_id UUID;
BEGIN
  FOR story_record IN SELECT DISTINCT story_id FROM chapters
  LOOP
    -- Check if story has a main branch
    SELECT id INTO main_branch_id 
    FROM story_branches 
    WHERE story_id = story_record.story_id AND is_main = true
    LIMIT 1;
    
    -- If no main branch exists, create one
    IF main_branch_id IS NULL THEN
      INSERT INTO story_branches (
        story_id,
        studio_id,
        name,
        content,
        author_name,
        parent_branch_id,
        is_main,
        is_active
      )
      SELECT 
        story_id,
        studio_id,
        'Main Branch',
        '',
        'System',
        NULL,
        true,
        true
      FROM stories
      WHERE id = story_record.story_id
      RETURNING id INTO main_branch_id;
    END IF;
    
    -- Update chapters that don't have a valid branch
    UPDATE chapters c
    SET branch_id = main_branch_id
    WHERE c.story_id = story_record.story_id
    AND NOT EXISTS (
      SELECT 1 FROM story_branches sb 
      WHERE sb.id = c.branch_id
    );
  END LOOP;
END $$;