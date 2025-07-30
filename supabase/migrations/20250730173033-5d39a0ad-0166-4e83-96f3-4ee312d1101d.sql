-- Drop the problematic recursive policies
DROP POLICY IF EXISTS "Users can view members of studios they belong to" ON public.studio_members;
DROP POLICY IF EXISTS "Studio owners and admins can manage members" ON public.studio_members;

-- Create a security definer function to check if user is a studio member
CREATE OR REPLACE FUNCTION public.is_studio_member(studio_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.studio_members 
    WHERE studio_id = studio_uuid 
    AND user_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create a security definer function to check if user is studio owner
CREATE OR REPLACE FUNCTION public.is_studio_owner(studio_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.studios 
    WHERE id = studio_uuid 
    AND owner_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Now create non-recursive policies for studio_members
CREATE POLICY "Users can view their own memberships"
ON public.studio_members 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Studio owners can manage all members"
ON public.studio_members 
FOR ALL 
USING (public.is_studio_owner(studio_id));

CREATE POLICY "Users can join studios when added by owner"
ON public.studio_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Also fix the studios policies to use the function
DROP POLICY IF EXISTS "Users can view studios they are members of" ON public.studios;

CREATE POLICY "Users can view studios where they are members"
ON public.studios 
FOR SELECT 
USING (
  owner_id = auth.uid() 
  OR public.is_studio_member(id)
);