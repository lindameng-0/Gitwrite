
-- Update existing chapters with more detailed content for better merge demonstration

-- Update Chapter 1: The Journey Begins
UPDATE chapters 
SET content = 'Sarah McKenzie stood at the train station platform, clutching the mysterious letter that had arrived three weeks ago. The parchment felt ancient between her fingers, and the elegant handwriting spoke of secrets that had been buried for decades.

"Dear Sarah," it read, "if you are reading this, then I am no longer with you. There are things about our family that you must know. Come to Ravenshollow Manor immediately. The truth awaits you in the library's hidden chamber."

Her grandmother had passed away suddenly, leaving behind more questions than answers. Sarah had grown up believing she was an orphan, raised by distant relatives who never spoke of her parents. Now, at twenty-five, she was about to discover that everything she thought she knew about herself was a lie.

The train whistle echoed through the station, and Sarah took a deep breath. Whatever waited for her at Ravenshollow Manor would change her life forever.'
WHERE id = '550e8400-e29b-41d4-a716-446655440010';

-- Update Chapter 2: Arrival
UPDATE chapters 
SET content = 'The gothic silhouette of Ravenshollow Manor emerged from the evening mist like something from a forgotten dream. Sarah paid the taxi driver with trembling hands and watched as the red taillights disappeared into the darkness, leaving her utterly alone.

The mansion towered above her, its stone façade weathered by centuries of storms. Gargoyles perched on the corners seemed to watch her with knowing eyes, and the tall windows reflected the dying light like hollow sockets.

Sarah approached the massive oak doors, their brass knockers shaped like ravens with spread wings. Before she could lift her hand to knock, the door creaked open on its own. A cool breeze whispered from within, carrying the scent of old books and dried roses.

"Hello?" she called into the shadowy entrance hall. Her voice echoed back, but no one answered. Candles flickered to life along the walls as if by magic, illuminating portraits of stern-faced ancestors whose eyes seemed to follow her every movement.

Sarah stepped inside, her footsteps echoing on the marble floor. Somewhere in the depths of the house, a clock began to chime midnight. She was finally home, though she had never been here before.'
WHERE id = '550e8400-e29b-41d4-a716-446655440011';

-- Update Romance Chapter 1.5: An Unexpected Encounter
UPDATE chapters 
SET content = 'Sarah was struggling with the ancient iron key when she heard footsteps crunching on the gravel path behind her. She spun around, her heart racing, expecting to see... well, she wasn''t sure what she expected to see at a supposedly empty manor house.

Instead, she found herself looking into the warmest brown eyes she had ever seen. The man approaching was tall and lean, with dark hair that curled slightly at the ends and hands stained with what looked like paint or soil.

"You must be Sarah," he said, his voice carrying a slight accent she couldn''t place. "I''m Marcus Ashford. Your grandmother hired me to maintain the gardens and... well, to watch over the place until you arrived."

He gestured toward the overgrown gardens that sprawled around the manor, where she could now see signs of recent care – pruned rosebushes, cleared pathways, and flower beds that showed evidence of gentle tending.

"She knew I was coming?" Sarah asked, surprised.

Marcus smiled, and dimples appeared at the corners of his mouth. "Eleanor McKenzie was a remarkable woman. She seemed to know many things that others didn''t. She spoke of you often – said you had her eyes and her stubborn streak."

Despite everything, Sarah found herself smiling back. "Well, she got the stubborn part right. I''m sorry, but... did she tell you why she wanted me to come here?"

Marcus''s expression grew serious. "She said you needed to learn the truth about your family. And that when you did, you might need a friend." He paused, studying her face in the fading light. "I hope that''s something I can be for you, Sarah."'
WHERE id = '550e8400-e29b-41d4-a716-446655440020';

-- Update Romance Chapter 2.5: Growing Closer
UPDATE chapters 
SET content = 'Three days had passed since Sarah''s arrival at Ravenshollow Manor, and she found herself looking forward to her morning walks with Marcus more than she cared to admit. He had shown her secret paths through the estate, hidden alcoves where previous generations had carved their initials, and a rose garden that took her breath away.

"Your grandmother planted most of these," Marcus explained as they walked between the blooming bushes. "She told me each variety had a story. The white roses for remembrance, the red for passion, the yellow for the friendship she hoped you''d find here."

Sarah paused beside a particularly beautiful coral-colored rose, its petals soft as silk. "She really planned all of this, didn''t she? Even... even us meeting?"

Marcus stopped walking and turned to face her, his expression thoughtful. "I think Eleanor McKenzie believed in destiny. She certainly believed in you."

As he spoke, a gentle breeze stirred the roses around them, releasing their sweet fragrance into the morning air. Sarah reached out to touch a particularly perfect bloom, and Marcus moved to steady the branch for her. Their hands brushed, and suddenly the world seemed to slow down.

"Sarah," Marcus said softly, and she realized he was standing much closer than before. "There''s something else your grandmother told me."

"What?" she whispered, acutely aware of how his eyes seemed to hold flecks of gold in the morning light.

"She said that some of the most important discoveries happen when we''re not looking for them." His thumb gently traced across her knuckles where their hands were still touching. "I think I''m beginning to understand what she meant."'
WHERE id = '550e8400-e29b-41d4-a716-446655440021';

-- Add one more chapter to the romance branch for more merge content
INSERT INTO chapters (id, story_id, branch_id, title, content, chapter_order, status, author_name) 
VALUES ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', 'Chapter 3: The Garden''s Secret', 'That evening, as Sarah sat in the manor''s library surrounded by dusty tomes and family records, she couldn''t stop thinking about her conversation with Marcus in the rose garden. Every time she tried to focus on the mysterious documents her grandmother had left behind, her mind wandered to the way he had looked at her, the gentleness in his voice when he spoke her name.

A soft knock at the library door interrupted her thoughts. "Come in," she called, expecting to see Mrs. Hartwell, the elderly housekeeper who had been caring for the manor in her grandmother''s absence.

Instead, Marcus appeared in the doorway, carrying a steaming mug and looking slightly uncertain. "I thought you might like some tea. You''ve been in here for hours."

Sarah gratefully accepted the warm cup, inhaling the comforting scent of chamomile and honey. "Thank you. I''ve been trying to make sense of all these papers, but..." She gestured helplessly at the scattered documents covering the large oak desk.

Marcus moved closer, his eyes scanning the old photographs and letters. "May I?" When she nodded, he picked up a faded photograph of a young woman who bore a striking resemblance to Sarah. "This must be your mother."

"I think so," Sarah said quietly. "I never knew what she looked like. Grandmother never spoke of her, and my relatives claimed they had no pictures."

Marcus studied the photograph intently, then looked up at Sarah with an expression she couldn''t quite read. "Sarah," he said slowly, "there''s something I need to tell you about why I''m really here. Your grandmother didn''t just hire me to tend the gardens. She asked me to help you uncover the truth about your family''s past. And I think... I think I know where to start looking."', 3, 'approved', 'Romance Writer');

-- Add a review for the new chapter
INSERT INTO chapter_reviews (id, chapter_id, reviewer_name, status, feedback) 
VALUES ('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440022', 'Story Editor', 'approved', 'Excellent development! The mystery element ties perfectly with the romance. Ready for merge.');

-- Update save point description to be more descriptive
UPDATE save_points 
SET description = 'Story state with main plot established (2 chapters) before integrating romance subplot (3 chapters). Perfect for testing merge functionality and seeing how romantic elements enhance the mystery.',
    snapshot_data = '{"chapters": [{"id": "550e8400-e29b-41d4-a716-446655440010", "title": "Chapter 1: The Journey Begins", "status": "approved", "word_count": 150}, {"id": "550e8400-e29b-41d4-a716-446655440011", "title": "Chapter 2: Arrival", "status": "approved", "word_count": 180}], "total_word_count": 330, "ready_for_merge": true, "timestamp": "2024-06-25T00:00:00Z"}'
WHERE id = '550e8400-e29b-41d4-a716-446655440040';
