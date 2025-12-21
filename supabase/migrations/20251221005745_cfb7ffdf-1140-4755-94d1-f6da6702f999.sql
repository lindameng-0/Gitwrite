-- Create draft_suggestions table for inline suggestions
CREATE TABLE public.draft_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL,
  branch_id UUID NOT NULL,
  user_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  suggestion_text TEXT NOT NULL,
  original_text TEXT,
  selection_start INT,
  selection_end INT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);

-- Create draft_collaborators table for co-editors
CREATE TABLE public.draft_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL,
  user_id UUID NOT NULL,
  invited_by UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  role TEXT NOT NULL DEFAULT 'editor',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  UNIQUE(branch_id, user_id)
);

-- Enable RLS
ALTER TABLE public.draft_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draft_collaborators ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is draft owner
CREATE OR REPLACE FUNCTION public.is_draft_owner(branch_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.story_branches sb
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE sb.id = branch_uuid 
    AND sb.author_name = p.username
  );
$$;

-- Create helper function to check if user is approved collaborator
CREATE OR REPLACE FUNCTION public.is_draft_collaborator(branch_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.draft_collaborators
    WHERE branch_id = branch_uuid 
    AND user_id = auth.uid()
    AND status = 'approved'
  );
$$;

-- RLS policies for draft_suggestions
CREATE POLICY "Anyone can view suggestions on visible drafts"
ON public.draft_suggestions
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create suggestions"
ON public.draft_suggestions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Draft owners can update suggestions"
ON public.draft_suggestions
FOR UPDATE
USING (is_draft_owner(branch_id));

CREATE POLICY "Suggestion authors can delete their pending suggestions"
ON public.draft_suggestions
FOR DELETE
USING (auth.uid() = user_id AND status = 'pending');

-- RLS policies for draft_collaborators
CREATE POLICY "Anyone can view collaborators"
ON public.draft_collaborators
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can request access"
ON public.draft_collaborators
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Draft owners can update collaborator status"
ON public.draft_collaborators
FOR UPDATE
USING (is_draft_owner(branch_id));

CREATE POLICY "Draft owners can remove collaborators"
ON public.draft_collaborators
FOR DELETE
USING (is_draft_owner(branch_id));