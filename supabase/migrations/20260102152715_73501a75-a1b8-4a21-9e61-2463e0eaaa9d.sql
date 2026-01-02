
-- Add chapters to draft branches (giving each branch their own chapter version)

-- Miranda's New Direction (Ch11 branch) - id: 82c8f111-6da3-402a-b643-ddb27069fe2e
INSERT INTO chapters (story_id, branch_id, chapter_order, title, content, author_name, status) VALUES
('df070c88-cf06-464e-9f92-841e14dc2d5f', '82c8f111-6da3-402a-b643-ddb27069fe2e', 11, 'Chapter 11: Final Preparations', 'Miranda''s version: The preparations took an unexpected turn when Maya discovered a hidden chamber beneath the throne. Inside, she found records of previous Dreamweavers—not all of whom had succeeded. The ritual required more than her grandmother had revealed.', 'Miranda', 'draft');

-- Abigail's Alternative (Ch11 branch) - id: d8c6f6a7-d8b7-4459-8fc1-17f6002ca151
INSERT INTO chapters (story_id, branch_id, chapter_order, title, content, author_name, status) VALUES
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd8c6f6a7-d8b7-4459-8fc1-17f6002ca151', 11, 'Chapter 11: Final Preparations', 'Abigail''s version: Maya chose to prepare through meditation rather than ritual. She sat at the center of the realm, allowing its energy to flow through her naturally. The guardians watched with ancient patience as she became one with the dreamscape.', 'Abigail', 'draft');

-- Amber's Finale (Ch12 branch) - id: 374c8e12-bc03-4f26-8803-dbdbe3b2ff1d
INSERT INTO chapters (story_id, branch_id, chapter_order, title, content, author_name, status) VALUES
('df070c88-cf06-464e-9f92-841e14dc2d5f', '374c8e12-bc03-4f26-8803-dbdbe3b2ff1d', 12, 'Chapter 12: The End', 'Amber''s version: The ending Maya chose surprised everyone, including herself. Rather than sealing the gateway forever, she opened it wider—inviting the dream realm and waking world to coexist. It was not an end, but a beginning.', 'Amber', 'draft');

-- Victor's Conclusion (Ch12 branch) - id: c852b5c6-3fdc-4d12-b0e3-138c4e6543a0
INSERT INTO chapters (story_id, branch_id, chapter_order, title, content, author_name, status) VALUES
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'c852b5c6-3fdc-4d12-b0e3-138c4e6543a0', 12, 'Chapter 12: The End', 'Victor''s version: Maya completed the binding with a thunderous declaration that echoed across dimensions. The gateway sealed with such force that cracks spread through the crystalline walls. She had succeeded—but at a cost the journal never warned her about.', 'Victor', 'draft');

-- Update the fork_point_chapter_id for all branches to reference the actual chapter IDs
UPDATE story_branches SET fork_point_chapter_id = '21bdcc59-7439-41eb-a46a-dbd7d2d4bfd8'
WHERE story_id = 'df070c88-cf06-464e-9f92-841e14dc2d5f' AND fork_point_order = 11;

UPDATE story_branches SET fork_point_chapter_id = 'c25e08d3-7775-43d8-8e92-4a7fad4d76b0'
WHERE story_id = 'df070c88-cf06-464e-9f92-841e14dc2d5f' AND fork_point_order = 12;

-- Also update chapters 1-10 fork points
UPDATE story_branches sb SET fork_point_chapter_id = (
  SELECT c.id FROM chapters c 
  WHERE c.branch_id = 'd84aa869-167f-4b43-9fd6-fd767f79aeee' 
  AND c.chapter_order = sb.fork_point_order
)
WHERE sb.story_id = 'df070c88-cf06-464e-9f92-841e14dc2d5f' 
AND sb.fork_point_order BETWEEN 1 AND 10;

-- Create merge requests for all 4 proposed branches
INSERT INTO merge_requests (story_id, source_branch_id, target_branch_id, author_name, requested_by, chapter_title, status) VALUES
-- Miranda's New Direction
('df070c88-cf06-464e-9f92-841e14dc2d5f', '82c8f111-6da3-402a-b643-ddb27069fe2e', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Miranda', 'ef81f28f-c717-4e49-944a-7e480e8e34a8', 'Chapter 11: Final Preparations', 'pending'),
-- Abigail's Alternative
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd8c6f6a7-d8b7-4459-8fc1-17f6002ca151', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Abigail', 'ef81f28f-c717-4e49-944a-7e480e8e34a8', 'Chapter 11: Final Preparations', 'pending'),
-- Amber's Finale
('df070c88-cf06-464e-9f92-841e14dc2d5f', '374c8e12-bc03-4f26-8803-dbdbe3b2ff1d', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Amber', 'ef81f28f-c717-4e49-944a-7e480e8e34a8', 'Chapter 12: The End', 'pending'),
-- Victor's Conclusion
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'c852b5c6-3fdc-4d12-b0e3-138c4e6543a0', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Victor', 'ef81f28f-c717-4e49-944a-7e480e8e34a8', 'Chapter 12: The End', 'pending');

-- Add chapters to some archived/alternate branches for richer data
-- (Just a few examples to make the data more realistic)

-- Get a couple of archived branch IDs and add chapters to them
INSERT INTO chapters (story_id, branch_id, chapter_order, title, content, author_name, status) 
SELECT 'df070c88-cf06-464e-9f92-841e14dc2d5f', sb.id, 1, 'Chapter 1: The Beginning', 
'Miranda''s alternative opening: The storm had raged for three days when Maya finally stepped through her grandmother''s door. The old woman''s journal lay waiting on the table, as if it knew she would come.', 
'Miranda', 'merged'
FROM story_branches sb WHERE sb.name = 'Miranda''s Ch1 Version' AND sb.story_id = 'df070c88-cf06-464e-9f92-841e14dc2d5f';

INSERT INTO chapters (story_id, branch_id, chapter_order, title, content, author_name, status) 
SELECT 'df070c88-cf06-464e-9f92-841e14dc2d5f', sb.id, 2, 'Chapter 2: First Steps', 
'Mikayla''s expanded version: Every footstep felt deliberate, measured against the silence that surrounded her. Maya counted her breaths—in for four, hold for seven, out for eight—a rhythm her grandmother had taught her for moments of fear.', 
'Mikayla', 'merged'
FROM story_branches sb WHERE sb.name = 'Mikayla''s Ch2 Edit' AND sb.story_id = 'df070c88-cf06-464e-9f92-841e14dc2d5f';

INSERT INTO chapters (story_id, branch_id, chapter_order, title, content, author_name, status) 
SELECT 'df070c88-cf06-464e-9f92-841e14dc2d5f', sb.id, 8, 'Chapter 8: The Turning Point', 
'Miranda''s alternative turning point: The revelation came not as a gentle understanding but as a shattering truth. Maya''s grandmother had not sealed the gateway to protect the realm—she had trapped something inside it. Something that now recognized Maya as blood.', 
'Miranda', 'merged'
FROM story_branches sb WHERE sb.name = 'Miranda''s Ch8' AND sb.story_id = 'df070c88-cf06-464e-9f92-841e14dc2d5f';
