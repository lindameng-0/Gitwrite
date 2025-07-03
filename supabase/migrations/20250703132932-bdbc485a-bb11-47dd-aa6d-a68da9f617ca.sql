
-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Anyone can view stories" ON public.stories;
DROP POLICY IF EXISTS "Authenticated users can create stories" ON public.stories;
DROP POLICY IF EXISTS "Story creators can update their stories" ON public.stories;
DROP POLICY IF EXISTS "Anyone can view story branches" ON public.story_branches;
DROP POLICY IF EXISTS "Authenticated users can create branches" ON public.story_branches;
DROP POLICY IF EXISTS "Anyone can update branches" ON public.story_branches;
DROP POLICY IF EXISTS "Anyone can view chapters" ON public.chapters;
DROP POLICY IF EXISTS "Anyone can create chapters" ON public.chapters;
DROP POLICY IF EXISTS "Anyone can update chapters" ON public.chapters;
DROP POLICY IF EXISTS "Anyone can delete chapters" ON public.chapters;
DROP POLICY IF EXISTS "Anyone can view chapter reviews" ON public.chapter_reviews;
DROP POLICY IF EXISTS "Anyone can create chapter reviews" ON public.chapter_reviews;
DROP POLICY IF EXISTS "Anyone can update chapter reviews" ON public.chapter_reviews;
DROP POLICY IF EXISTS "Anyone can view save points" ON public.save_points;
DROP POLICY IF EXISTS "Anyone can create save points" ON public.save_points;

-- Create a profiles table to store user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create new RLS policies for collaborative access
-- Stories - anyone can view, authenticated users can create
CREATE POLICY "Anyone can view stories" 
  ON public.stories 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create stories" 
  ON public.stories 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Story creators can update their stories" 
  ON public.stories 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = created_by);

-- Story branches - collaborative access
CREATE POLICY "Anyone can view story branches" 
  ON public.story_branches 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create branches" 
  ON public.story_branches 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authors can update their branches" 
  ON public.story_branches 
  FOR UPDATE 
  TO authenticated
  USING (true);

-- Chapters - collaborative access
CREATE POLICY "Anyone can view chapters" 
  ON public.chapters 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create chapters" 
  ON public.chapters 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authors can update chapters" 
  ON public.chapters 
  FOR UPDATE 
  TO authenticated
  USING (true);

-- Chapter reviews - collaborative access
CREATE POLICY "Anyone can view chapter reviews" 
  ON public.chapter_reviews 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create reviews" 
  ON public.chapter_reviews 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Reviewers can update their reviews" 
  ON public.chapter_reviews 
  FOR UPDATE 
  TO authenticated
  USING (true);

-- Save points - collaborative access
CREATE POLICY "Anyone can view save points" 
  ON public.save_points 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create save points" 
  ON public.save_points 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authors can update their save points" 
  ON public.save_points 
  FOR UPDATE 
  TO authenticated
  USING (true);
