
-- Create a table for stories (main story containers)
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Story',
  description TEXT,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create a table for story branches
CREATE TABLE public.story_branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  author_name TEXT NOT NULL DEFAULT 'Anonymous',
  parent_branch_id UUID REFERENCES public.story_branches(id),
  is_main BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_branches ENABLE ROW LEVEL SECURITY;

-- Create policies for stories (public read, authenticated write for now)
CREATE POLICY "Anyone can view stories" 
  ON public.stories 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create stories" 
  ON public.stories 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Story creators can update their stories" 
  ON public.stories 
  FOR UPDATE 
  USING (auth.uid() = created_by);

-- Create policies for story branches (public read, authenticated write)
CREATE POLICY "Anyone can view story branches" 
  ON public.story_branches 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create branches" 
  ON public.story_branches 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Anyone can update branches" 
  ON public.story_branches 
  FOR UPDATE 
  USING (true);

-- Insert a default story and branches for demo
INSERT INTO public.stories (id, title, description)
VALUES ('00000000-0000-0000-0000-000000000001', 'The Mysterious Letter', 'A collaborative story about Sarah and a mysterious letter');

-- Insert the main branch
INSERT INTO public.story_branches (id, story_id, name, content, author_name, is_main, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Main Story',
  'Chapter 1: The Beginning

The rain drummed against the window as Sarah stared at the mysterious letter that had arrived that morning. The handwriting was elegant, almost archaic, and the paper felt oddly warm to the touch.

"My dear Sarah," it began, "the time has come for you to learn the truth about your family''s legacy. Meet me at the old lighthouse at midnight. Come alone, and bring the amulet your grandmother left you."

Sarah''s heart raced. She had always wondered about the strange silver pendant her grandmother had given her before passing away. It seemed to hum with an energy she couldn''t explain, and sometimes, in the corner of her eye, she thought she saw it glow.

As evening approached, Sarah found herself torn between curiosity and fear. The lighthouse had been abandoned for decades, and local stories spoke of strange lights and unexplained phenomena. But something deep inside her knew she had to go.

She grabbed her coat, slipped the amulet around her neck, and stepped out into the stormy night...',
  'You',
  true,
  true
);

-- Insert alternate branches
INSERT INTO public.story_branches (id, story_id, name, content, author_name, parent_branch_id)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'Alternate Path: Sarah Ignores the Letter',
  'Chapter 1: The Cautious Choice

Sarah crumpled the mysterious letter and tossed it into the fireplace. She had learned long ago not to trust strange messages from unknown senders. Whatever game someone was playing, she wanted no part of it.

But as the flames consumed the paper, something unexpected happened. The fire turned from orange to deep blue, and for a moment, Sarah could swear she heard whispers in the crackling flames.

The amulet around her neck grew warm, then hot. She quickly removed it, setting it on the mantelpiece. As soon as the pendant left her skin, the fire returned to normal.

Sarah stared at the amulet, her grandmother''s final gift. Perhaps ignoring the letter hadn''t been the end of the mystery after all. The answers she sought might be closer than she had imagined...',
  'Alex',
  '00000000-0000-0000-0000-000000000002'
);

INSERT INTO public.story_branches (id, story_id, name, content, author_name, parent_branch_id)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'Mystery Branch: The Letter''s Origin',
  'Chapter 1: The Investigation

Instead of rushing to the lighthouse, Sarah decided to investigate the letter''s origin. The paper was unusual - thick, cream-colored, and watermarked with what looked like an ancient symbol.

She took photos of the handwriting and uploaded them to a handwriting analysis app. Within minutes, she had her first clue: the writing style was consistent with 19th-century penmanship, specifically from the Victorian era.

But that was impossible. The letter had arrived by regular mail, with a contemporary postmark. Sarah examined the envelope more closely and noticed something she had missed before - the stamp was wrong. It depicted a lighthouse, but when she held it up to the light, she could see it was actually a very sophisticated hologram.

Someone was playing an elaborate game, and Sarah was determined to figure out who...',
  'Maya',
  '00000000-0000-0000-0000-000000000002'
);
