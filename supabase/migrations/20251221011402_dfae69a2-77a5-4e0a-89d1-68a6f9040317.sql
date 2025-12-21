-- Create merge_requests table for tracking draft submissions
CREATE TABLE public.merge_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_branch_id UUID NOT NULL,
  target_branch_id UUID NOT NULL,
  source_chapter_id UUID,
  story_id UUID NOT NULL,
  requested_by UUID NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'superseded')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  priority INTEGER DEFAULT 0,
  has_conflicts BOOLEAN DEFAULT false,
  conflicting_requests UUID[] DEFAULT '{}',
  author_name TEXT NOT NULL,
  chapter_title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.merge_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view merge requests"
ON public.merge_requests FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create merge requests"
ON public.merge_requests FOR INSERT
WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Studio admins can update merge requests"
ON public.merge_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM story_branches sb
    JOIN studio_members sm ON sm.studio_id = sb.studio_id
    WHERE sb.id = source_branch_id
    AND sm.user_id = auth.uid()
    AND sm.role IN ('owner', 'admin')
  )
  OR requested_by = auth.uid()
);

-- Function to detect sibling conflicts (branches forked from same chapter)
CREATE OR REPLACE FUNCTION public.detect_merge_conflicts(p_merge_request_id UUID)
RETURNS TABLE(
  conflicting_request_id UUID,
  conflicting_branch_id UUID,
  branch_name TEXT,
  author_name TEXT,
  chapter_title TEXT,
  fork_point_chapter_id UUID
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH source_info AS (
    SELECT 
      mr.id,
      mr.source_branch_id,
      mr.source_chapter_id,
      sb.fork_point_chapter_id,
      sb.fork_point_order,
      sb.story_id
    FROM merge_requests mr
    JOIN story_branches sb ON sb.id = mr.source_branch_id
    WHERE mr.id = p_merge_request_id
  )
  SELECT 
    mr.id as conflicting_request_id,
    sb.id as conflicting_branch_id,
    sb.name as branch_name,
    mr.author_name,
    mr.chapter_title,
    sb.fork_point_chapter_id
  FROM merge_requests mr
  JOIN story_branches sb ON sb.id = mr.source_branch_id
  JOIN source_info si ON sb.story_id = si.story_id
  WHERE mr.id != si.id
    AND mr.status IN ('pending', 'under_review')
    AND (
      -- Same fork point chapter
      (sb.fork_point_chapter_id IS NOT NULL AND sb.fork_point_chapter_id = si.fork_point_chapter_id)
      -- Or same fork point order
      OR (sb.fork_point_order IS NOT NULL AND sb.fork_point_order = si.fork_point_order)
      -- Or targeting same chapter
      OR (mr.source_chapter_id IS NOT NULL AND mr.source_chapter_id = si.source_chapter_id)
    );
$$;

-- Function to update conflict flags when new merge request is created
CREATE OR REPLACE FUNCTION public.update_merge_conflict_flags()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conflict_ids UUID[];
BEGIN
  -- Get conflicting request IDs
  SELECT ARRAY_AGG(conflicting_request_id) INTO conflict_ids
  FROM detect_merge_conflicts(NEW.id);
  
  -- Update the new request with conflicts
  IF conflict_ids IS NOT NULL AND array_length(conflict_ids, 1) > 0 THEN
    UPDATE merge_requests 
    SET has_conflicts = true, conflicting_requests = conflict_ids
    WHERE id = NEW.id;
    
    -- Also update the conflicting requests to include this one
    UPDATE merge_requests
    SET has_conflicts = true,
        conflicting_requests = array_append(
          array_remove(conflicting_requests, NEW.id),
          NEW.id
        )
    WHERE id = ANY(conflict_ids);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-detect conflicts
CREATE TRIGGER on_merge_request_created
AFTER INSERT ON public.merge_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_merge_conflict_flags();

-- Enable realtime for merge_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.merge_requests;