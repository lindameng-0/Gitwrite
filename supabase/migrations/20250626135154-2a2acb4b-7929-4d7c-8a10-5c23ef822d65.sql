
-- First, let's create the missing story branches
INSERT INTO story_branches (id, story_id, name, content, author_name, parent_branch_id, is_main, is_active) VALUES 
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Thriller Branch', 'Mystery/thriller approach where Eleanor dies before Sarah arrives, creating a crime scene investigation scenario.', 'James Patterson Jr.', '550e8400-e29b-41d4-a716-446655440001', false, false);

-- Clear existing demo data and create comprehensive collaborative novel scenario
DELETE FROM chapter_reviews;
DELETE FROM chapters;
DELETE FROM save_points;

-- Insert comprehensive collaborative novel chapters for Main Story
INSERT INTO chapters (id, story_id, branch_id, title, content, chapter_order, status, author_name) VALUES 
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 
'Chapter 1: The Inheritance', 
'Detective Sarah Chen received the call at 3:47 AM. Her grandmother''s lawyer, speaking in hushed tones, explained that Eleanor McKenzie had left her something extraordinary: a Victorian mansion called Ravenshollow Manor, along with a cryptic note.

"The truth about your parents lies in the hidden chamber beneath the library," the note read. "Trust no one, especially the Ashford family. They have been watching our bloodline for generations."

Sarah had always believed her parents died in a car accident when she was five. Now, twenty years later, standing in her cramped Chicago apartment, she realized her entire life might have been built on lies.

The mansion was located in a small town called Millbrook, three hours north of the city. Sarah booked the first train out, her detective instincts already piecing together fragments of suppressed memories.',
1, 'approved', 'Sarah Williams'
),

('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 
'Chapter 2: Arrival at Millbrook', 
'The town of Millbrook seemed frozen in time. Victorian houses lined cobblestone streets, their shutters painted in faded pastels. Sarah''s taxi wound through narrow lanes until Ravenshollow Manor appeared through the morning fog.

The three-story mansion loomed before her, its Gothic architecture both beautiful and foreboding. Gargoyles perched on the corners seemed to follow her movements, and ivy crept up the walls like grasping fingers.

As Sarah approached the front door, she noticed fresh tire tracks in the gravel driveway. Someone had been here recently. Her hand instinctively moved to her service weapon as she inserted the ornate key her grandmother''s lawyer had provided.

The door swung open with a prolonged creak, revealing a grand foyer with a crystal chandelier and portraits of stern-faced ancestors. But what caught her attention was the muddy footprint on the marble floor – still wet.',
2, 'approved', 'Michael Rodriguez'
),

('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 
'Chapter 3: The Intruder', 
'Sarah drew her weapon and called out, "Police! Show yourself!" Her voice echoed through the empty halls, but only silence answered back.

Moving carefully through the mansion, she noticed signs of recent activity: books pulled from shelves in the library, drawers left partially open, dust disturbed on various surfaces. Someone had been searching for something.

In the library, she found what appeared to be the entrance to the hidden chamber her grandmother had mentioned – a section of the bookshelf that looked slightly askew. But before she could investigate further, a floorboard creaked behind her.

"Don''t turn around," a man''s voice said quietly. "I''m not here to hurt you, but there are things you need to know about this place. About why your parents really died."',
3, 'approved', 'Sarah Williams'
);

-- Insert Romance Branch chapters with character development conflicts
INSERT INTO chapters (id, story_id, branch_id, title, content, chapter_order, status, author_name) VALUES 
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', 
'Chapter 1: The Inheritance (Alternate)', 
'Detective Sarah Chen had always prided herself on being logical, methodical. So when her grandmother''s lawyer called at nearly 4 AM with news of an inheritance, she approached it with professional skepticism.

"Eleanor McKenzie has left you Ravenshollow Manor," Mr. Whitmore explained, his voice carrying an undertone of concern. "But Miss Chen, I must advise caution. The previous owners... well, there have been unexplained incidents."

Unlike the rushed decision Sarah might have made in her younger years, she took time to research the property online. What she found intrigued her: the mansion had been in her family for four generations, passing only to women, and each previous owner had lived as a recluse.

The cryptic note troubled her most: "The Ashford family has protected our secrets, but the price grows heavier with each generation. Trust Marcus – he may be your only ally."

Sarah packed methodically, including her service weapon and forensics kit. If her parents'' death was indeed more than an accident, she would approach this mystery like any other case.',
1, 'approved', 'Emma Thompson'
),

('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', 
'Chapter 2: Marcus Ashford', 
'Sarah''s taxi pulled away, leaving her alone with her luggage before the imposing facade of Ravenshollow Manor. As she struggled with the heavy iron gate, she heard footsteps on gravel.

"You must be Sarah Chen," said a warm voice behind her. She spun around to face a tall man in his early thirties, with intelligent green eyes and hands stained with soil. "I''m Marcus Ashford. Your grandmother asked me to watch over the property."

The name Ashford sent a chill through her, remembering the warning in Eleanor''s note. But this man''s gentle demeanor seemed at odds with any threat. He wore simple work clothes and carried pruning shears – clearly the groundskeeper.

"Your grandmother spoke of you often," Marcus continued, helping her with the gate. "She said you had her gift for seeing patterns others missed. She also said..." He hesitated, glancing toward the mansion''s upper windows. "She said you''d need someone you could trust when the truth finally surfaced."

Sarah studied his face, her detective instincts analyzing every micro-expression. Whatever secrets this place held, Marcus Ashford seemed genuinely concerned for her welfare.',
2, 'approved', 'Emma Thompson'
),

('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', 
'Chapter 3: Conflicting Loyalties', 
'As Marcus led her through the mansion''s rooms, Sarah noticed his intimate knowledge of the house''s layout and history. He knew which floorboards creaked, which windows stuck, and where Eleanor had kept her most precious belongings.

"How long have you been working here?" Sarah asked, examining a family portrait that showed a woman bearing a striking resemblance to herself.

"Three years," Marcus replied. "Ever since my father passed. The Ashford family has been... connected to this place for generations." His expression darkened. "Not always in ways I''m proud of."

They entered the library, where Sarah immediately noticed the displaced books and disturbed dust patterns. Someone had been searching recently. But Marcus seemed genuinely surprised by the disarray.

"This wasn''t like this yesterday," he said, concern evident in his voice. "Sarah, there''s something I need to tell you about your parents. About why Eleanor really called you here." He paused, conflict playing across his features. "But first, there''s someone else you should meet. My sister Catherine has been waiting for you to arrive."

Sarah''s hand moved instinctively toward her weapon. Eleanor''s note had warned about trusting the Ashfords, but Marcus seemed torn between loyalty to his family and protecting her.',
3, 'approved', 'Emma Thompson'
);

-- Insert Mystery/Thriller Branch with plot contradictions
INSERT INTO chapters (id, story_id, branch_id, title, content, chapter_order, status, author_name) VALUES 
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440003', 
'Chapter 1: The Phone Call', 
'Detective Sarah Chen was reviewing case files when her personal phone rang at 11:30 PM. The caller ID showed an unknown number, but something compelled her to answer.

"Detective Chen?" The voice was elderly, female, with a slight accent. "This is Eleanor McKenzie. I believe I am your grandmother."

Sarah nearly dropped the phone. According to her adoption records, both her grandparents had died before she was born. "I''m sorry, but there must be some mistake—"

"Your parents, David and Maria Chen, were murdered twenty years ago," Eleanor interrupted. "The car accident was a cover-up. I have proof, but I cannot discuss this over the phone. You must come to Ravenshollow Manor immediately. I may not have much time left."

The line went dead. Sarah stared at her phone, her mind racing. She had always felt something was wrong about the official story of her parents'' death. As a detective, she had even pulled the files years ago, but they had been suspiciously thin.

By midnight, she was in her car, driving north toward a town called Millbrook and answers she had been seeking her entire life.',
1, 'approved', 'James Patterson Jr.'
),

('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440003', 
'Chapter 2: Too Late', 
'Sarah arrived at Ravenshollow Manor to find police cars lining the circular driveway, their red and blue lights painting the Gothic facade in ominous colors. A uniformed officer approached her as she parked.

"I''m sorry, miss, but this is a crime scene," he said. "An elderly woman was found deceased this morning."

Sarah showed her badge. "Detective Sarah Chen, Chicago PD. I believe the victim may have been my grandmother." The words felt strange on her tongue.

The local detective, a weathered man named Frank Morrison, filled her in. Eleanor McKenzie had been found at the bottom of the main staircase at 6 AM by her groundskeeper. Initial assessment suggested an accidental fall, but Morrison had his doubts.

"Thing is," Morrison said, leading Sarah through the foyer, "Mrs. McKenzie called the station yesterday afternoon, asking for extra patrols. Said she felt like someone was watching the house. And look at this."

He showed Sarah to the library, where papers were scattered across the floor and filing cabinets stood open. "Someone was looking for something specific. Question is, did they find it before or after the old lady took her tumble?"',
2, 'approved', 'James Patterson Jr.'
),

('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440003', 
'Chapter 3: The Groundskeeper''s Secret', 
'Detective Morrison introduced Sarah to Marcus Ashford, the groundskeeper who had discovered Eleanor''s body. The young man appeared genuinely distraught, his hands shaking as he recounted finding his employer.

"She was like family to me," Marcus said. "My father worked for her before me, and his father before him. The Ashfords have always served the McKenzie family."

But as Sarah questioned him, inconsistencies emerged. Marcus claimed he arrived at 6 AM as usual, yet the security system showed the front door had been opened at 5:30 AM. When pressed, his story began to change.

"Alright," Marcus finally admitted, running his hands through his hair. "I got here early because Mrs. McKenzie called me at 5 AM, panicked. She said someone was in the house. But when I arrived, I found her at the bottom of the stairs."

"Why didn''t you call the police immediately?" Sarah asked.

Marcus looked away. "Because I found this in her hand." He produced a folded piece of paper. "It''s a letter addressed to you, Detective Chen. She must have been trying to get it to safety when she fell."

Sarah unfolded the paper with gloved hands. In shaky handwriting, it read: "Sarah - The evidence is in the hidden chamber. Don''t trust anyone from the Ashford family. They killed your parents."',
3, 'approved', 'James Patterson Jr.'
);

-- Add chapter reviews
INSERT INTO chapter_reviews (id, chapter_id, reviewer_name, status, feedback) VALUES 
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440010', 'Editor-in-Chief', 'approved', 'Strong opening with clear protagonist motivation. Sets up the mystery well.'),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440011', 'Editor-in-Chief', 'approved', 'Good atmospheric tension. The wet footprint detail adds immediate danger.'),
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440012', 'Editor-in-Chief', 'approved', 'Excellent cliffhanger. Builds suspense effectively.'),
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440020', 'Romance Editor', 'approved', 'Love the character development approach. Sarah feels more methodical here.'),
('550e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440021', 'Romance Editor', 'approved', 'Marcus is much more sympathetic in this version. Great character work.'),
('550e8400-e29b-41d4-a716-446655440045', '550e8400-e29b-41d4-a716-446655440022', 'Romance Editor', 'approved', 'The family conflict adds nice complexity. Well done.'),
('550e8400-e29b-41d4-a716-446655440046', '550e8400-e29b-41d4-a716-446655440030', 'Thriller Editor', 'approved', 'Immediate hook with the late-night call. Very engaging opening.'),
('550e8400-e29b-41d4-a716-446655440047', '550e8400-e29b-41d4-a716-446655440031', 'Thriller Editor', 'approved', 'The crime scene approach changes everything. Bold choice.'),
('550e8400-e29b-41d4-a716-446655440048', '550e8400-e29b-41d4-a716-446655440032', 'Thriller Editor', 'approved', 'Great twist with Eleanor being dead. Major plot divergence that works.');

-- Create multiple save points showing story evolution
INSERT INTO save_points (id, story_id, branch_id, title, description, author_name, snapshot_data) VALUES 
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 
'Original Main Story - 3 Chapters', 
'Initial main storyline focusing on mystery elements. Sarah arrives alive at the manor and encounters an intruder. Foundation for all other story branches.',
'Story Coordinator',
'{"chapters": [{"id": "550e8400-e29b-41d4-a716-446655440010", "title": "Chapter 1: The Inheritance", "status": "approved", "word_count": 185, "author": "Sarah Williams", "themes": ["mystery", "inheritance", "family_secrets"]}, {"id": "550e8400-e29b-41d4-a716-446655440011", "title": "Chapter 2: Arrival at Millbrook", "status": "approved", "word_count": 162, "author": "Michael Rodriguez", "themes": ["gothic_atmosphere", "foreboding", "investigation"]}, {"id": "550e8400-e29b-41d4-a716-446655440012", "title": "Chapter 3: The Intruder", "status": "approved", "word_count": 128, "author": "Sarah Williams", "themes": ["suspense", "confrontation", "revelation"]}], "total_word_count": 475, "merge_conflicts": [], "collaboration_notes": "Strong foundation with consistent character voice", "timestamp": "2024-06-26T08:00:00Z"}'
),

('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', 
'Romance Branch Development', 
'Character-focused version emphasizing Sarah''s methodical nature and Marcus as ally rather than threat. Major personality and relationship differences from main story.',
'Emma Thompson',
'{"chapters": [{"id": "550e8400-e29b-41d4-a716-446655440020", "title": "Chapter 1: The Inheritance (Alternate)", "status": "approved", "word_count": 192, "author": "Emma Thompson", "character_changes": ["Sarah more methodical", "Marcus portrayed positively"], "merge_recommendations": ["replace_main_chapter_1", "character_consistency_issues"]}, {"id": "550e8400-e29b-41d4-a716-446655440021", "title": "Chapter 2: Marcus Ashford", "status": "approved", "word_count": 168, "author": "Emma Thompson", "character_changes": ["Marcus as helper", "No immediate threat"], "merge_recommendations": ["insert_after_arrival", "character_development"]}, {"id": "550e8400-e29b-41d4-a716-446655440022", "title": "Chapter 3: Conflicting Loyalties", "status": "approved", "word_count": 203, "author": "Emma Thompson", "plot_conflicts": ["Marcus_trustworthy_vs_threatening", "Eleanor_note_contradiction"], "merge_recommendations": ["subplot_development", "character_arc_expansion"]}], "total_word_count": 563, "major_conflicts": ["character_portrayal", "trust_dynamics", "family_relationships"], "timestamp": "2024-06-26T10:30:00Z"}'
),

('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440003', 
'Thriller Branch - Major Plot Divergence', 
'Dramatic alternate timeline where Eleanor dies before Sarah arrives. Completely changes the story dynamic and available information. Creates major merge conflicts.',
'James Patterson Jr.',
'{"chapters": [{"id": "550e8400-e29b-41d4-a716-446655440030", "title": "Chapter 1: The Phone Call", "status": "approved", "word_count": 178, "author": "James Patterson Jr.", "plot_changes": ["Eleanor_contacts_Sarah_directly", "Murder_revealed_upfront"], "merge_recommendations": ["major_rewrite_required", "timeline_conflicts"]}, {"id": "550e8400-e29b-41d4-a716-446655440031", "title": "Chapter 2: Too Late", "status": "approved", "word_count": 189, "author": "James Patterson Jr.", "plot_changes": ["Eleanor_dead_on_arrival", "Crime_scene_investigation"], "merge_recommendations": ["incompatible_with_main", "alternate_timeline"]}, {"id": "550e8400-e29b-41d4-a716-446655440032", "title": "Chapter 3: The Groundskeeper''s Secret", "status": "approved", "word_count": 201, "author": "James Patterson Jr.", "plot_changes": ["Marcus_finds_body", "Contradictory_evidence", "Eleanor_warning_letter"], "merge_recommendations": ["subplot_only", "flashback_sequence"]}], "total_word_count": 568, "major_conflicts": ["Eleanor_alive_vs_dead", "Investigation_vs_inheritance", "Marcus_role_contradiction"], "collaboration_challenges": ["Timeline_incompatibility", "Character_fate_conflicts"], "timestamp": "2024-06-26T12:45:00Z"}'
);
