
-- First, let's create a sample story with branches and chapters
INSERT INTO stories (id, title, description) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'The Adventure Begins', 'A thrilling story with multiple plot branches');

-- Create main branch
INSERT INTO story_branches (id, story_id, name, is_main, is_active, author_name) 
VALUES ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Main Story', true, true, 'Main Author');

-- Create alternative branch
INSERT INTO story_branches (id, story_id, name, is_main, is_active, author_name, parent_branch_id) 
VALUES ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Romance Subplot', false, false, 'Romance Writer', '550e8400-e29b-41d4-a716-446655440001');

-- Add chapters to main branch
INSERT INTO chapters (id, story_id, branch_id, title, content, chapter_order, status, author_name) 
VALUES 
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Chapter 1: The Journey Begins', 'Sarah packed her bags with trembling hands. The letter from her grandmother had arrived three days ago, and she still couldn''t believe what it contained. An inheritance. A mansion. And most importantly, answers about her family''s mysterious past that had been hidden from her for twenty-three years.', 1, 'approved', 'Main Author'),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Chapter 2: Arrival', 'The mansion loomed before her as the taxi pulled away, leaving Sarah alone with her suitcase and a head full of questions. The Gothic architecture seemed to whisper secrets in the evening wind, and she couldn''t shake the feeling that she was being watched from the darkened windows above.', 2, 'approved', 'Main Author');

-- Add chapters to romance branch (ready to be merged)
INSERT INTO chapters (id, story_id, branch_id, title, content, chapter_order, status, author_name) 
VALUES 
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', 'Chapter 1.5: An Unexpected Encounter', 'As Sarah struggled with her heavy suitcase on the mansion steps, a warm voice called out from behind her. "Need some help with that?" She turned to see a tall man with kind eyes and paint-stained fingers approaching. "I''m Marcus," he said with a gentle smile. "I''ve been restoring the gardens here. Your grandmother mentioned you might be coming." Sarah felt her heart skip a beat - this definitely wasn''t in grandmother''s letter.', 1, 'approved', 'Romance Writer'),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', 'Chapter 2.5: Growing Closer', 'Over the next few days, Marcus showed Sarah the hidden corners of the estate. As they walked through the overgrown rose garden, their hands accidentally brushed while reaching for the same thorny stem. The electricity between them was undeniable, and Sarah found herself looking forward to their daily garden walks more than exploring the mansion''s mysteries.', 2, 'approved', 'Romance Writer');

-- Add some reviews to show the collaboration aspect
INSERT INTO chapter_reviews (id, chapter_id, reviewer_name, status, feedback) 
VALUES 
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440020', 'Story Editor', 'approved', 'Love the romantic tension! This adds great depth to Sarah''s character development.'),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440021', 'Main Author', 'approved', 'Perfect pacing for the romance subplot. Ready to merge into main story.');

-- Add a save point
INSERT INTO save_points (id, story_id, branch_id, title, description, author_name, snapshot_data) 
VALUES ('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Before Romance Integration', 'Story state before merging romance subplot', 'Main Author', '{"chapters": 2, "status": "ready_for_romance_merge"}');
