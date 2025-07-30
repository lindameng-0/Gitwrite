-- First, let's see what policies exist on studio_members
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'studio_members';

-- Also check the studios table policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'studios';

-- Drop all existing policies on studio_members that might be causing recursion
DROP POLICY IF EXISTS "Studio members can view other members in same studio" ON public.studio_members;
DROP POLICY IF EXISTS "Studio members can be viewed by studio members" ON public.studio_members;
DROP POLICY IF EXISTS "Users can view studios they are members of" ON public.studios;
DROP POLICY IF EXISTS "Users can view their own studio memberships" ON public.studio_members;

-- Create simple, non-recursive policies for studio_members
CREATE POLICY "Users can view their own studio memberships" 
ON public.studio_members 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Studio owners can manage members" 
ON public.studio_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.studios 
    WHERE id = studio_id 
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can insert themselves as members when invited"
ON public.studio_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create simple policies for studios
CREATE POLICY "Users can view studios they own" 
ON public.studios 
FOR SELECT 
USING (owner_id = auth.uid());

CREATE POLICY "Users can view studios they are members of" 
ON public.studios 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.studio_members 
    WHERE studio_id = id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own studios" 
ON public.studios 
FOR INSERT 
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Studio owners can update their studios" 
ON public.studios 
FOR UPDATE 
USING (owner_id = auth.uid());

CREATE POLICY "Studio owners can delete their studios" 
ON public.studios 
FOR DELETE 
USING (owner_id = auth.uid());