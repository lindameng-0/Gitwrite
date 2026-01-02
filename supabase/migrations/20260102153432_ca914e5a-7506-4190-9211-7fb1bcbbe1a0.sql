-- Fix remaining branch names to be natural draft names
UPDATE story_branches SET name = 'Opening Take' WHERE id = '1dda70a4-0284-4953-9303-c1058374f5f6';
UPDATE story_branches SET name = 'Discovery Revision' WHERE id = 'b4b3b3d4-dbd9-4e76-9015-27c4a36b4542';
UPDATE story_branches SET name = 'Journal Draft' WHERE id = '44ecb3a3-0d94-4043-8f8f-00dc55c0a0ce';
UPDATE story_branches SET name = 'Journal Sketch' WHERE id = 'be0684a4-e480-4d3d-a0f8-eb12b071066d';
UPDATE story_branches SET name = 'First Sign Revision' WHERE id = '75f457e3-2555-4ce5-b6f2-33773732d8bd';
UPDATE story_branches SET name = 'Warning Sketch' WHERE id = 'fbc1d27d-44db-4fc9-b1fb-45f0ead1c885';
UPDATE story_branches SET name = 'First Sign Draft' WHERE id = 'dd61de14-513f-471f-88d5-d5aecdc436ea';
UPDATE story_branches SET name = 'Storm Draft' WHERE id = 'd9794a48-b8ff-4bc1-9caf-44b97d802627';
UPDATE story_branches SET name = 'Storm Variation' WHERE id = '6a71d6bf-406d-4556-a510-7aa72124932b';
UPDATE story_branches SET name = 'Vision Sketch' WHERE id = '28304e31-39f4-4541-a243-ab0bb6bf7cdc';
UPDATE story_branches SET name = 'Vision Edit' WHERE id = 'df38aa57-0be8-4be4-8452-bb62b2ea02df';
UPDATE story_branches SET name = 'Glimpse Draft' WHERE id = '36224bb0-df67-4a02-8bd0-93a5a29f68fc';
UPDATE story_branches SET name = 'Confrontation Take' WHERE id = '55cdbdce-303e-47d2-ba93-614f1ebdd3d7';
UPDATE story_branches SET name = 'Showdown Sketch' WHERE id = '5c7ff845-b1dc-4604-8f85-18c95c7e4f2a';
UPDATE story_branches SET name = 'Sacrifice Take' WHERE id = 'e1e226ed-bb61-4e71-9b7c-73a8925c4124';
UPDATE story_branches SET name = 'Sacrifice Sketch' WHERE id = '28cf2dac-3dfe-4ca8-b377-3ebddaa03d1d';
UPDATE story_branches SET name = 'Aftermath Revision' WHERE id = '84d5144e-bd5c-49e4-84fc-4bd081af6a91';
UPDATE story_branches SET name = 'Aftermath Take' WHERE id = '766f082d-e85b-472c-8673-c1356ce77fc4';
UPDATE story_branches SET name = 'Return Take' WHERE id = '28cccda2-b3f0-406d-b9c1-d6057c31744a';
UPDATE story_branches SET name = 'Homecoming Sketch' WHERE id = 'e6b966cc-c995-4f44-81d5-d6eb89f4c9fa';
UPDATE story_branches SET name = 'Return Variation' WHERE id = '4305cd89-b2b6-429c-9e30-5850987c0b92';
UPDATE story_branches SET name = 'Revelation WIP' WHERE id = '4a5dac9c-648c-44c3-afcf-b2cca278c898';
UPDATE story_branches SET name = 'Revelation Ideas' WHERE id = '90d30533-5b49-4531-a5d0-db9719658513';
UPDATE story_branches SET name = 'Ending Version' WHERE id = '499227f8-04c8-4b24-ac2b-2eeffef5a826';
UPDATE story_branches SET name = 'Ending Sketch' WHERE id = '98b57a02-d10a-4b22-bcf7-38150b731281';
UPDATE story_branches SET name = 'Finale Draft' WHERE id = 'b8b1f9cb-17ae-4b84-8d12-513bd54d614d';

-- Reorganize positions: Main branch at center, drafts spread by fork_point_order
-- Main branch at x=400
UPDATE story_branches SET position_x = 400, position_y = 0 WHERE id = 'd84aa869-167f-4b43-9fd6-fd767f79aeee';

-- Chapter 1 drafts (fork_point_order=1) - row 1
UPDATE story_branches SET position_x = 100, position_y = 150 WHERE id = '1dda70a4-0284-4953-9303-c1058374f5f6';
UPDATE story_branches SET position_x = 300, position_y = 150 WHERE id = '52d63c8f-72f3-4025-a177-494bddb66ec9';

-- Chapter 2 drafts (fork_point_order=2) - row 2
UPDATE story_branches SET position_x = 500, position_y = 150 WHERE id = 'eb2dcb4e-6066-4d27-8e02-f88d7bfd1555';
UPDATE story_branches SET position_x = 700, position_y = 150 WHERE id = 'b4b3b3d4-dbd9-4e76-9015-27c4a36b4542';

-- Chapter 3 drafts (fork_point_order=3) - row 3
UPDATE story_branches SET position_x = 100, position_y = 280 WHERE id = '44ecb3a3-0d94-4043-8f8f-00dc55c0a0ce';
UPDATE story_branches SET position_x = 300, position_y = 280 WHERE id = 'be0684a4-e480-4d3d-a0f8-eb12b071066d';

-- Chapter 4 drafts (fork_point_order=4) - row 4
UPDATE story_branches SET position_x = 500, position_y = 280 WHERE id = '75f457e3-2555-4ce5-b6f2-33773732d8bd';
UPDATE story_branches SET position_x = 700, position_y = 280 WHERE id = 'fbc1d27d-44db-4fc9-b1fb-45f0ead1c885';
UPDATE story_branches SET position_x = 900, position_y = 280 WHERE id = 'dd61de14-513f-471f-88d5-d5aecdc436ea';

-- Chapter 5 drafts (fork_point_order=5) - row 5
UPDATE story_branches SET position_x = 100, position_y = 410 WHERE id = 'd9794a48-b8ff-4bc1-9caf-44b97d802627';
UPDATE story_branches SET position_x = 300, position_y = 410 WHERE id = '6a71d6bf-406d-4556-a510-7aa72124932b';

-- Chapter 6 drafts (fork_point_order=6) - row 6
UPDATE story_branches SET position_x = 500, position_y = 410 WHERE id = '28304e31-39f4-4541-a243-ab0bb6bf7cdc';
UPDATE story_branches SET position_x = 700, position_y = 410 WHERE id = 'df38aa57-0be8-4be4-8452-bb62b2ea02df';
UPDATE story_branches SET position_x = 900, position_y = 410 WHERE id = '36224bb0-df67-4a02-8bd0-93a5a29f68fc';

-- Chapter 7 drafts (fork_point_order=7) - row 7
UPDATE story_branches SET position_x = 100, position_y = 540 WHERE id = '55cdbdce-303e-47d2-ba93-614f1ebdd3d7';
UPDATE story_branches SET position_x = 300, position_y = 540 WHERE id = '5c7ff845-b1dc-4604-8f85-18c95c7e4f2a';

-- Chapter 8 drafts (fork_point_order=8) - row 8
UPDATE story_branches SET position_x = 500, position_y = 540 WHERE id = 'e1e226ed-bb61-4e71-9b7c-73a8925c4124';
UPDATE story_branches SET position_x = 700, position_y = 540 WHERE id = '28cf2dac-3dfe-4ca8-b377-3ebddaa03d1d';
UPDATE story_branches SET position_x = 900, position_y = 540 WHERE id = '7930d6f4-37b4-4abc-bd33-933abd96a285';

-- Chapter 9 drafts (fork_point_order=9) - row 9
UPDATE story_branches SET position_x = 100, position_y = 670 WHERE id = '84d5144e-bd5c-49e4-84fc-4bd081af6a91';
UPDATE story_branches SET position_x = 300, position_y = 670 WHERE id = '766f082d-e85b-472c-8673-c1356ce77fc4';

-- Chapter 10 drafts (fork_point_order=10) - row 10
UPDATE story_branches SET position_x = 500, position_y = 670 WHERE id = '28cccda2-b3f0-406d-b9c1-d6057c31744a';
UPDATE story_branches SET position_x = 700, position_y = 670 WHERE id = 'e6b966cc-c995-4f44-81d5-d6eb89f4c9fa';
UPDATE story_branches SET position_x = 900, position_y = 670 WHERE id = '4305cd89-b2b6-429c-9e30-5850987c0b92';

-- Chapter 11 drafts (fork_point_order=11) - row 11 (active proposals)
UPDATE story_branches SET position_x = 100, position_y = 800 WHERE id = '82c8f111-6da3-402a-b643-ddb27069fe2e';
UPDATE story_branches SET position_x = 300, position_y = 800 WHERE id = 'd8c6f6a7-d8b7-4459-8fc1-17f6002ca151';
UPDATE story_branches SET position_x = 500, position_y = 800 WHERE id = '4a5dac9c-648c-44c3-afcf-b2cca278c898';
UPDATE story_branches SET position_x = 700, position_y = 800 WHERE id = '90d30533-5b49-4531-a5d0-db9719658513';

-- Chapter 12 drafts (fork_point_order=12) - row 12 (active proposals)
UPDATE story_branches SET position_x = 100, position_y = 930 WHERE id = '374c8e12-bc03-4f26-8803-dbdbe3b2ff1d';
UPDATE story_branches SET position_x = 300, position_y = 930 WHERE id = 'c852b5c6-3fdc-4d12-b0e3-138c4e6543a0';
UPDATE story_branches SET position_x = 500, position_y = 930 WHERE id = '499227f8-04c8-4b24-ac2b-2eeffef5a826';
UPDATE story_branches SET position_x = 700, position_y = 930 WHERE id = '98b57a02-d10a-4b22-bcf7-38150b731281';
UPDATE story_branches SET position_x = 900, position_y = 930 WHERE id = 'b8b1f9cb-17ae-4b84-8d12-513bd54d614d';

-- Add chapter versions (edits) to some alternate branches
-- These represent the merged/published version history
INSERT INTO chapter_versions (chapter_id, version_number, content, author_name, merged_from_branch_id, merge_note, is_current) VALUES
-- Opening Revision was merged as version 2 of chapter 1
((SELECT id FROM chapters WHERE story_id = 'df070c88-cf06-464e-9f92-841e14dc2d5f' AND branch_id = 'd84aa869-167f-4b43-9fd6-fd767f79aeee' AND chapter_order = 1), 2, 'The manuscript arrived on a Tuesday morning, wrapped in brown paper and sealed with crimson wax. Eleanor traced the unfamiliar seal—an intricate knot that seemed to shift beneath her fingers—before breaking it with trembling hands. Inside lay pages yellowed with age, covered in handwriting that matched her grandmother''s but spoke of impossible things.

The first line read: "To whoever finds this, know that the boundaries between worlds grow thin in autumn."

Eleanor set down her coffee cup, suddenly cold despite the morning sun streaming through her apartment window. Her grandmother had been dead for three years. How could she be receiving mail from her now?', 'Miranda', '52d63c8f-72f3-4025-a177-494bddb66ec9', 'Miranda''s opening revision incorporated - stronger hook', false),

-- Discovery Edit was merged as version 2 of chapter 2
((SELECT id FROM chapters WHERE story_id = 'df070c88-cf06-464e-9f92-841e14dc2d5f' AND branch_id = 'd84aa869-167f-4b43-9fd6-fd767f79aeee' AND chapter_order = 2), 2, 'The library''s restricted section was exactly as Eleanor''s grandmother had described it: cramped, dusty, and completely ignored by the university staff. Eleanor navigated between towering shelves, her grandmother''s journal tucked under her arm, searching for the texts referenced in those impossible pages.

"You shouldn''t be here," a voice said from the shadows.

Eleanor spun around to find a man about her age, dark-haired and sharp-eyed, watching her with an expression caught between curiosity and concern. "Neither should you, apparently," she replied.

"Touché." He stepped into the feeble light. "I''m Marcus Chen. I study folklore. And you''re reading a journal that, according to university records, doesn''t exist."', 'Mikayla', 'eb2dcb4e-6066-4d27-8e02-f88d7bfd1555', 'Mikayla''s discovery edit - improved Marcus introduction', false),

-- Sacrifice Revision was merged as version 2 of chapter 8
((SELECT id FROM chapters WHERE story_id = 'df070c88-cf06-464e-9f92-841e14dc2d5f' AND branch_id = 'd84aa869-167f-4b43-9fd6-fd767f79aeee' AND chapter_order = 8), 2, 'The ritual chamber pulsed with an otherworldly glow as Eleanor stood at its center, the manuscript clutched to her chest. Around her, the symbols her grandmother had drawn decades ago flared to life, responding to her presence.

"You don''t have to do this alone," Marcus said from the doorway, his voice tight with fear.

Eleanor met his eyes, seeing in them everything she might be sacrificing—the future they''d barely begun to imagine together. "That''s exactly why I have to," she said. "Some doors, once opened, can only be closed from the inside."

The light intensified, and Eleanor felt the boundary between worlds thin to nothing beneath her feet.', 'Miranda', '7930d6f4-37b4-4abc-bd33-933abd96a285', 'Miranda''s sacrifice revision - emotional stakes heightened', false);