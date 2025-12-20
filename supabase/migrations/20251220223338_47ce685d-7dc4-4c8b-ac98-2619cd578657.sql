-- Create studio_invites table for invite links
CREATE TABLE public.studio_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  invite_code text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  expires_at timestamp with time zone,
  max_uses integer,
  uses_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.studio_invites ENABLE ROW LEVEL SECURITY;

-- Studio owners can manage invites
CREATE POLICY "Studio owners can manage invites"
ON public.studio_invites
FOR ALL
USING (is_studio_owner(studio_id));

-- Anyone can view invites by code (for joining)
CREATE POLICY "Anyone can view invites by code"
ON public.studio_invites
FOR SELECT
USING (true);

-- Studio members can view invites for their studios
CREATE POLICY "Studio members can view studio invites"
ON public.studio_invites
FOR SELECT
USING (is_studio_member(studio_id));