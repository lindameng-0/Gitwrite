
-- Update existing chapters with more detailed content for better merge demonstration

-- Update Chapter 1: The Journey Begins with more detailed content
UPDATE chapters 
SET content = 'Sarah McKenzie stood at the train station platform, clutching the mysterious letter that had arrived three weeks ago. The parchment felt ancient between her fingers, and the elegant handwriting spoke of secrets that had been buried for decades.

"Dear Sarah," it read, "if you are reading this, then I am no longer with you. There are things about our family that you must know. Come to Ravenshollow Manor immediately. The truth awaits you in the library''s hidden chamber."

Her grandmother had passed away suddenly, leaving behind more questions than answers. Sarah had grown up believing she was an orphan, raised by distant relatives who never spoke of her parents. Now, at twenty-five, she was about to discover that everything she thought she knew about herself was a lie.

The train whistle echoed through the station, and Sarah took a deep breath. Whatever waited for her at Ravenshollow Manor would change her life forever.'
WHERE title = 'Chapter 1: The Journey Begins';

-- Update Chapter 2: Arrival with enhanced content
UPDATE chapters 
SET content = 'The gothic silhouette of Ravenshollow Manor emerged from the evening mist like something from a forgotten dream. Sarah paid the taxi driver with trembling hands and watched as the red taillights disappeared into the darkness, leaving her utterly alone.

The mansion towered above her, its stone façade weathered by centuries of storms. Gargoyles perched on the corners seemed to watch her with knowing eyes, and the tall windows reflected the dying light like hollow sockets.

Sarah approached the massive oak doors, their brass knockers shaped like ravens with spread wings. Before she could lift her hand to knock, the door creaked open on its own. A cool breeze whispered from within, carrying the scent of old books and dried roses.

"Hello?" she called into the shadowy entrance hall. Her voice echoed back, but no one answered. Candles flickered to life along the walls as if by magic, illuminating portraits of stern-faced ancestors whose eyes seemed to follow her every movement.

Sarah stepped inside, her footsteps echoing on the marble floor. Somewhere in the depths of the house, a clock began to chime midnight. She was finally home, though she had never been here before.'
WHERE title = 'Chapter 2: Arrival';

-- Update Romance Chapter 1.5 with content that has some similarity to Chapter 1
UPDATE chapters 
SET content = 'Sarah McKenzie had been struggling with the ancient iron key when she heard footsteps crunching on the gravel path behind her. She spun around, her heart racing, still clutching the mysterious letter that had brought her to this place.

Instead of the shadowy figure she expected, she found herself looking into the warmest brown eyes she had ever seen. The man approaching was tall and lean, with dark hair that curled slightly at the ends and hands stained with what looked like paint or soil.

"You must be Sarah," he said, his voice carrying a slight accent she couldn''t place. "I''m Marcus Ashford. Your grandmother hired me to maintain the gardens and... well, to watch over the place until you arrived."

He gestured toward the overgrown gardens that sprawled around the manor, where she could now see signs of recent care – pruned rosebushes, cleared pathways, and flower beds that showed evidence of gentle tending.

"She knew I was coming?" Sarah asked, surprised, thinking of the letter that had changed everything.

Marcus smiled, and dimples appeared at the corners of his mouth. "Eleanor McKenzie was a remarkable woman. She seemed to know many things that others didn''t. She spoke of you often – said you had her eyes and her stubborn streak."

Despite everything, Sarah found herself smiling back. "Well, she got the stubborn part right. I''m sorry, but... did she tell you why she wanted me to come here?"

Marcus''s expression grew serious. "She said you needed to learn the truth about your family. And that when you did, you might need a friend." He paused, studying her face in the fading light. "I hope that''s something I can be for you, Sarah."'
WHERE title = 'Chapter 1.5: An Unexpected Encounter';

-- Update Romance Chapter 2.5 with content similar to Chapter 2 arrival theme
UPDATE chapters 
SET content = 'Three days had passed since Sarah''s arrival at Ravenshollow Manor, and she found herself looking forward to her morning walks with Marcus more than she cared to admit. The gothic mansion no longer seemed as forbidding as it had that first night – Marcus had a way of making even the darkest corners feel welcoming.

"Your grandmother planted most of these," Marcus explained as they walked between the blooming rose bushes. The morning mist still clung to the gardens, creating an ethereal atmosphere around the ancient manor. "She told me each variety had a story. The white roses for remembrance, the red for passion, the yellow for the friendship she hoped you''d find here."

Sarah paused beside a particularly beautiful coral-colored rose, its petals soft as silk. Through the morning haze, she could see the manor''s tall windows watching over them like benevolent eyes. "She really planned all of this, didn''t she? Even... even us meeting?"

Marcus stopped walking and turned to face her, his expression thoughtful. The same cool breeze that had welcomed her to the manor now stirred the roses around them, releasing their sweet fragrance into the morning air. "I think Eleanor McKenzie believed in destiny. She certainly believed in you."

As he spoke, Sarah reached out to touch a particularly perfect bloom, and Marcus moved to steady the branch for her. Their hands brushed, and suddenly the world seemed to slow down – just as it had when she first stepped through those ancient oak doors.

"Sarah," Marcus said softly, and she realized he was standing much closer than before. "There''s something else your grandmother told me."

"What?" she whispered, acutely aware of how his eyes seemed to hold flecks of gold in the morning light.

"She said that some of the most important discoveries happen when we''re not looking for them." His thumb gently traced across her knuckles where their hands were still touching. "I think I''m beginning to understand what she meant."'
WHERE title = 'Chapter 2.5: Growing Closer';

-- Add one more chapter with content that's an alternate version of Chapter 1 (to test replacement scenarios)
INSERT INTO chapters (id, story_id, branch_id, title, content, chapter_order, status, author_name) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440023',
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440002',
  'Chapter 1: The Letter''s Call',
  'Sarah McKenzie sat in her small apartment, staring at the letter that had arrived that morning. The elegant handwriting seemed to dance before her eyes as she read it for the tenth time. Her grandmother, Eleanor McKenzie, had passed away and left her something unexpected – not just an inheritance, but answers.

"My dearest Sarah," the letter began, "by the time you read this, I will no longer be able to tell you these secrets in person. Our family has a history that was kept from you for your own protection, but now you are old enough to know the truth. Come to Ravenshollow Manor as soon as you can. In the library''s hidden chamber, you will find everything I could not tell you while I lived."

Sarah had grown up with so many questions. Her parents had died when she was very young, and her relatives had always been evasive about the details. She had accepted their explanations, but deep down, she had always known there was more to the story.

Now, sitting with the train ticket Eleanor had thoughtfully included with the letter, Sarah made her decision. She packed her few belongings, locked her apartment, and headed for the station. The journey to Ravenshollow Manor would take her six hours by train, but it felt like she was finally coming home to herself.

As the train pulled away from the platform, Sarah clutched the letter to her chest. Whatever secrets awaited her at the manor, she was ready to face them. Her real life was about to begin.',
  4,
  'approved',
  'Romance Writer'
);

-- Add review for the new alternate chapter
INSERT INTO chapter_reviews (id, chapter_id, reviewer_name, status, feedback) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440033',
  '550e8400-e29b-41d4-a716-446655440023',
  'Story Editor',
  'approved',
  'Excellent alternate opening! This version focuses more on Sarah''s internal journey. Great for testing replacement merge functionality.'
);

-- Update save point to reflect the enhanced demo content
UPDATE save_points 
SET 
  description = 'Enhanced demo with detailed chapters featuring character development, plot elements, and content variations perfect for testing smart merge functionality. Romance chapters now have deliberate similarities to main chapters.',
  snapshot_data = '{"chapters": [{"id": "550e8400-e29b-41d4-a716-446655440010", "title": "Chapter 1: The Journey Begins", "status": "approved", "word_count": 280, "themes": ["mystery", "family_secrets"]}, {"id": "550e8400-e29b-41d4-a716-446655440011", "title": "Chapter 2: Arrival", "status": "approved", "word_count": 320, "themes": ["gothic", "atmosphere"]}], "romance_chapters": [{"id": "550e8400-e29b-41d4-a716-446655440020", "title": "Chapter 1.5: An Unexpected Encounter", "similarity_to_main": "high", "merge_recommendation": "insert_after_chapter_1"}, {"id": "550e8400-e29b-41d4-a716-446655440021", "title": "Chapter 2.5: Growing Closer", "similarity_to_main": "moderate", "merge_recommendation": "insert_after_chapter_2"}, {"id": "550e8400-e29b-41d4-a716-446655440023", "title": "Chapter 1: The Letter''s Call", "similarity_to_main": "very_high", "merge_recommendation": "replace_chapter_1"}], "total_word_count": 1200, "smart_merge_ready": true, "timestamp": "2024-06-26T00:00:00Z"}'
WHERE id = '550e8400-e29b-41d4-a716-446655440040';
