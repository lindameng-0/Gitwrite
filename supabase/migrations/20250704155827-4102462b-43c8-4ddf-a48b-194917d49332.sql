-- Create studios table for private collaborative spaces
CREATE TABLE public.studios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create studio members table for collaboration
CREATE TABLE public.studio_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid REFERENCES public.studios(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
  invited_at timestamp with time zone DEFAULT now(),
  joined_at timestamp with time zone DEFAULT now(),
  UNIQUE(studio_id, user_id)
);

-- Add studio_id to existing tables
ALTER TABLE public.stories ADD COLUMN studio_id uuid REFERENCES public.studios(id) ON DELETE CASCADE;
ALTER TABLE public.story_branches ADD COLUMN studio_id uuid REFERENCES public.studios(id) ON DELETE CASCADE;

-- Enable RLS on new tables
ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_members ENABLE ROW LEVEL SECURITY;

-- Studio policies
CREATE POLICY "Users can view studios they are members of"
  ON public.studios
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM public.studio_members 
      WHERE studio_id = studios.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own studios"
  ON public.studios
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Studio owners can update their studios"
  ON public.studios
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Studio members policies
CREATE POLICY "Users can view members of studios they belong to"
  ON public.studio_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.studio_members sm
      WHERE sm.studio_id = studio_members.studio_id AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Studio owners and admins can manage members"
  ON public.studio_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.studios s
      WHERE s.id = studio_id AND s.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.studio_members sm
      WHERE sm.studio_id = studio_members.studio_id 
      AND sm.user_id = auth.uid() 
      AND sm.role IN ('owner', 'admin')
    )
  );

-- Update existing story policies to respect studio membership
DROP POLICY IF EXISTS "Authenticated users can create stories" ON public.stories;
CREATE POLICY "Studio members can create stories in their studios"
  ON public.stories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    (studio_id IS NULL OR EXISTS (
      SELECT 1 FROM public.studio_members
      WHERE studio_id = stories.studio_id AND user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Story creators can update their stories" ON public.stories;
CREATE POLICY "Studio members can update stories in their studios"
  ON public.stories
  FOR UPDATE
  TO authenticated
  USING (
    studio_id IS NULL OR EXISTS (
      SELECT 1 FROM public.studio_members
      WHERE studio_id = stories.studio_id AND user_id = auth.uid()
    )
  );

-- Update story branches policies
DROP POLICY IF EXISTS "Authenticated users can create branches" ON public.story_branches;
CREATE POLICY "Studio members can create branches in their studios"
  ON public.story_branches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    studio_id IS NULL OR EXISTS (
      SELECT 1 FROM public.studio_members
      WHERE studio_id = story_branches.studio_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authors can update their branches" ON public.story_branches;
CREATE POLICY "Studio members can update branches in their studios"
  ON public.story_branches
  FOR UPDATE
  TO authenticated
  USING (
    studio_id IS NULL OR EXISTS (
      SELECT 1 FROM public.studio_members
      WHERE studio_id = story_branches.studio_id AND user_id = auth.uid()
    )
  );

-- Create function to automatically add studio owner as member
CREATE OR REPLACE FUNCTION public.add_studio_owner_as_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.studio_members (studio_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$;

-- Create trigger to auto-add studio owner as member
CREATE TRIGGER on_studio_created
  AFTER INSERT ON public.studios
  FOR EACH ROW
  EXECUTE FUNCTION public.add_studio_owner_as_member();

-- Create a default "Demo Studio" and migrate existing data
INSERT INTO public.studios (id, name, description, owner_id) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'Demo Studio',
  'Collaborative demo studio with sample stories',
  (SELECT id FROM auth.users LIMIT 1)
);

-- Update existing stories and branches to belong to demo studio
UPDATE public.stories 
SET studio_id = '550e8400-e29b-41d4-a716-446655440001'
WHERE studio_id IS NULL;

UPDATE public.story_branches 
SET studio_id = '550e8400-e29b-41d4-a716-446655440001'
WHERE studio_id IS NULL;