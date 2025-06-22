
-- Add chapters table for chapter-by-chapter structure
CREATE TABLE public.chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES public.story_branches(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  chapter_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'merged')),
  author_name TEXT NOT NULL DEFAULT 'Anonymous',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, branch_id, chapter_order)
);

-- Add save points (story commits) table
CREATE TABLE public.save_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES public.story_branches(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  author_name TEXT NOT NULL DEFAULT 'Anonymous',
  snapshot_data JSONB NOT NULL, -- stores chapter states at this point
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add chapter reviews table for collaboration
CREATE TABLE public.chapter_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE NOT NULL,
  reviewer_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'changes_requested')),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for all new tables
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.save_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_reviews ENABLE ROW LEVEL SECURITY;

-- Policies for chapters (public read/write for demo)
CREATE POLICY "Anyone can view chapters" ON public.chapters FOR SELECT USING (true);
CREATE POLICY "Anyone can create chapters" ON public.chapters FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update chapters" ON public.chapters FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete chapters" ON public.chapters FOR DELETE USING (true);

-- Policies for save points
CREATE POLICY "Anyone can view save points" ON public.save_points FOR SELECT USING (true);
CREATE POLICY "Anyone can create save points" ON public.save_points FOR INSERT WITH CHECK (true);

-- Policies for chapter reviews
CREATE POLICY "Anyone can view chapter reviews" ON public.chapter_reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can create chapter reviews" ON public.chapter_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update chapter reviews" ON public.chapter_reviews FOR UPDATE USING (true);

-- Insert sample chapters for the existing story
INSERT INTO public.chapters (story_id, branch_id, title, content, chapter_order, author_name)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Chapter 1: The Mysterious Letter', 
   'The rain drummed against the window as Sarah stared at the mysterious letter that had arrived that morning. The handwriting was elegant, almost archaic, and the paper felt oddly warm to the touch.

"My dear Sarah," it began, "the time has come for you to learn the truth about your family''s legacy. Meet me at the old lighthouse at midnight. Come alone, and bring the amulet your grandmother left you."

Sarah''s heart raced. She had always wondered about the strange silver pendant her grandmother had given her before passing away. It seemed to hum with an energy she couldn''t explain, and sometimes, in the corner of her eye, she thought she saw it glow.', 
   1, 'You'),
  
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Chapter 2: The Decision', 
   'As evening approached, Sarah found herself torn between curiosity and fear. The lighthouse had been abandoned for decades, and local stories spoke of strange lights and unexplained phenomena. But something deep inside her knew she had to go.

She grabbed her coat, slipped the amulet around her neck, and stepped out into the stormy night...', 
   2, 'You');

-- Insert a save point for the main branch
INSERT INTO public.save_points (story_id, branch_id, title, description, author_name, snapshot_data)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'Initial Story Setup',
  'Established Sarah as protagonist and introduced the mysterious letter plot device',
  'You',
  '{"chapters": [{"id": 1, "title": "Chapter 1: The Mysterious Letter", "status": "approved"}, {"id": 2, "title": "Chapter 2: The Decision", "status": "draft"}], "word_count": 234}'
);
