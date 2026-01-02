
-- Step 1: Clean up existing data in Dreamweaver
DELETE FROM merge_requests WHERE story_id = 'df070c88-cf06-464e-9f92-841e14dc2d5f';
DELETE FROM chapters WHERE story_id = 'df070c88-cf06-464e-9f92-841e14dc2d5f';
DELETE FROM story_branches WHERE story_id = 'df070c88-cf06-464e-9f92-841e14dc2d5f' AND is_main = false;

-- Step 2: Update main branch position
UPDATE story_branches 
SET position_x = 400, position_y = 0 
WHERE id = 'd84aa869-167f-4b43-9fd6-fd767f79aeee';

-- Step 3: Create 12 main story chapters (using 'approved' status)
INSERT INTO chapters (story_id, branch_id, chapter_order, title, content, author_name, status) VALUES
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 1, 'Chapter 1: The Beginning', 'The morning light filtered through the ancient oaks as Maya stepped onto the forest path. She had waited years for this moment—her first expedition into the Dreamweaver realm. The journal in her hands, passed down through generations, contained the only map known to exist.', 'Linda', 'approved'),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 2, 'Chapter 2: First Steps', 'The path wound deeper into territories unmarked on any conventional map. Maya noticed the subtle shift in the air—a thickness that seemed to carry whispers from another time. Her grandmother''s warnings echoed in her mind, but curiosity had always been her strongest trait.', 'Linda', 'approved'),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 3, 'Chapter 3: The Discovery', 'Hidden beneath centuries of overgrowth, the stone archway stood exactly where the journal described. Maya traced the ancient symbols with trembling fingers. This was the threshold—the gateway between worlds that her ancestors had sealed long ago.', 'Miranda', 'approved'),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 4, 'Chapter 4: Rising Tension', 'Beyond the archway, reality bent in ways Maya had never imagined. Colors she couldn''t name painted the sky, and the ground beneath her feet hummed with dormant power. She wasn''t alone here—she could feel eyes watching from the shadows between dimensions.', 'Mikayla', 'approved'),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 5, 'Chapter 5: The Journey', 'Days blurred together in this realm where time moved differently. Maya learned to navigate by the pattern of the stars—constellations that existed only in dreams. Each step brought new wonders and new dangers, testing the limits of her courage.', 'Linda', 'approved'),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 6, 'Chapter 6: Crossroads', 'The path split into seven directions, each leading to a different fate. Maya consulted the journal, but the pages remained blank—her grandmother''s guidance ended here. She would have to trust her instincts and choose her own way forward.', 'Amber', 'approved'),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 7, 'Chapter 7: Dark Hours', 'The shadows grew hungry as night descended over the Dreamweaver realm. Maya found shelter in a crystalline cave, its walls reflecting memories that weren''t her own. She saw her grandmother as a young woman, walking this same path decades ago.', 'Abigail', 'approved'),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 8, 'Chapter 8: The Turning Point', 'Morning brought revelation. Maya understood now why her grandmother had sealed the gateway—not to keep the realm''s magic contained, but to protect it from those who would exploit its power. The journal''s true purpose was finally clear.', 'Linda', 'approved'),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 9, 'Chapter 9: Revelations', 'At the heart of the realm stood the Dreamweaver''s throne—empty now, but waiting. Maya realized she hadn''t stumbled upon this place by accident. She had been called here, chosen to inherit a responsibility that spanned generations.', 'Miranda', 'approved'),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 10, 'Chapter 10: The Reckoning', 'The shadows that had watched from the periphery finally revealed themselves. Ancient guardians, neither friend nor foe, demanded to know Maya''s intentions. Her answer would determine whether she could complete her grandmother''s unfinished work.', 'Mikayla', 'approved'),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 11, 'Chapter 11: Final Preparations', 'With the guardians'' blessing, Maya began the ritual her grandmother had described in the journal''s final pages. The magic required sacrifice—not of life, but of certainty. She would have to give up everything she thought she knew about herself.', 'Linda', 'approved'),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 12, 'Chapter 12: The End', 'As Maya spoke the final words of the ancient binding, the realm shimmered and stabilized. The gateway was sealed anew, but this time it carried her signature alongside her grandmother''s. She was the Dreamweaver now, guardian of the threshold between worlds.', 'Linda', 'approved');

-- Step 4: Create archived branches for chapters 1-10
INSERT INTO story_branches (story_id, studio_id, parent_branch_id, name, author_name, status, content, fork_point_order, position_x, position_y) VALUES
-- Chapter 1 branches
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Miranda''s Ch1 Version', 'Miranda', 'alternate', 'Alternative take on the opening', 1, 100, 200),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Amber''s Ch1 Take', 'Amber', 'archived', 'Earlier draft of chapter 1', 1, 200, 200),
-- Chapter 2 branches
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Mikayla''s Ch2 Edit', 'Mikayla', 'alternate', 'Expanded chapter 2 content', 2, 300, 200),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Stephanie''s Ch2', 'Stephanie', 'archived', 'Previous ch2 draft', 2, 400, 200),
-- Chapter 3 branches
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Linda''s Ch3 Revision', 'Linda', 'alternate', 'Linda''s alternative approach', 3, 500, 200),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Yuyun''s Ch3', 'Yuyun', 'archived', 'Earlier exploration', 3, 600, 200),
-- Chapter 4 branches
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Linda''s Ch4 Edit', 'Linda', 'alternate', 'More tension variant', 4, 100, 350),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Miranda''s Ch4', 'Miranda', 'archived', 'Miranda''s take', 4, 200, 350),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Mido''s Ch4 Draft', 'Mido', 'archived', 'First draft attempt', 4, 300, 350),
-- Chapter 5 branches
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Mikayla''s Ch5', 'Mikayla', 'alternate', 'Journey expansion', 5, 400, 350),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Victor''s Ch5', 'Victor', 'archived', 'Victor''s version', 5, 500, 350),
-- Chapter 6 branches
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Linda''s Ch6 Revision', 'Linda', 'alternate', 'Different crossroads', 6, 600, 350),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Yujin''s Ch6', 'Yujin', 'archived', 'Previous draft', 6, 700, 350),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Ellie''s Ch6', 'Ellie', 'archived', 'Early exploration', 6, 100, 500),
-- Chapter 7 branches
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Linda''s Ch7 Take', 'Linda', 'alternate', 'Darker version', 7, 200, 500),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Mikayla''s Ch7', 'Mikayla', 'archived', 'Earlier draft', 7, 300, 500),
-- Chapter 8 branches
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Miranda''s Ch8', 'Miranda', 'alternate', 'Alternative turning point', 8, 400, 500),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Abigail''s Ch8', 'Abigail', 'alternate', 'Softer approach', 8, 500, 500),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Erik''s Ch8', 'Erik', 'archived', 'First attempt', 8, 600, 500),
-- Chapter 9 branches
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Linda''s Ch9', 'Linda', 'alternate', 'Different revelations', 9, 700, 500),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Amber''s Ch9', 'Amber', 'archived', 'Previous version', 9, 100, 650),
-- Chapter 10 branches
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Abigail''s Ch10', 'Abigail', 'alternate', 'Gentler reckoning', 10, 200, 650),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Mido''s Ch10', 'Mido', 'archived', 'Different approach', 10, 300, 650),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Victor''s Ch10', 'Victor', 'archived', 'Earlier draft', 10, 400, 650);

-- Step 5: Create unresolved branches for chapters 11-12
INSERT INTO story_branches (story_id, studio_id, parent_branch_id, name, author_name, status, content, fork_point_order, position_x, position_y) VALUES
-- Chapter 11 branches (active)
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Miranda''s New Direction', 'Miranda', 'proposed', 'A completely different approach to the preparations', 11, 500, 650),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Abigail''s Alternative', 'Abigail', 'proposed', 'More mystical approach', 11, 600, 650),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Erik''s WIP', 'Erik', 'draft', 'Work in progress', 11, 700, 650),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Yujin''s Ideas', 'Yujin', 'draft', 'Early exploration', 11, 100, 800),
-- Chapter 12 branches (active)
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Amber''s Finale', 'Amber', 'proposed', 'Alternative ending', 12, 200, 800),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Mikayla''s Ending', 'Mikayla', 'draft', 'Working on finale', 12, 300, 800),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Stephanie''s Draft', 'Stephanie', 'draft', 'First draft of ending', 12, 400, 800),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Victor''s Conclusion', 'Victor', 'proposed', 'Epic finale version', 12, 500, 800),
('df070c88-cf06-464e-9f92-841e14dc2d5f', 'd24acd8f-9858-41dd-a744-5fec60a4c736', 'd84aa869-167f-4b43-9fd6-fd767f79aeee', 'Ellie''s Version', 'Ellie', 'draft', 'Exploring ideas', 12, 600, 800);
