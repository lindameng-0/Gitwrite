import {
  copy,
  paragraph,
  record,
  startDraft,
  propose,
  type Project,
} from "./model";

export function exampleProject(): Project {
  const project: Project = {
    schema: 2,
    id: "local-example",
    title: "The quiet between tides",
    description: "A story about the things we leave, and the things that wait.",
    chapters: [
      {
        id: "arrival",
        title: "The arrival",
        blocks: [
          paragraph(
            "By the time Mara reached the island, the last ferry had already become a small white mark on the horizon. She stood at the end of the pier with her father’s suitcase in one hand and a key that no longer seemed to belong to anything in the other.",
          ),
          paragraph(
            "The harbor smelled exactly as she remembered: salt, diesel, and the sweet rot of seaweed drying on the stone steps. Fifteen years should have been enough to change a place. Apparently, no one had told the island.",
          ),
          paragraph("“You’re late,” said a voice behind her."),
          paragraph(
            "Elias was sitting on an overturned boat, repairing a net with the careful patience of someone who had never needed to catch a train. His hair had gone gray at the temples. Everything else about him was infuriatingly familiar.",
          ),
          paragraph("“The ferry was late.”"),
          paragraph("“I meant by about fifteen years.”"),
          paragraph(
            "She looked past him toward the house on the headland. One upstairs window caught the afternoon light. For a moment, it looked as though someone had left a lamp burning for her.",
          ),
          paragraph(
            "Mara put the key in her pocket. “Is the road still the same?”",
          ),
          paragraph(
            "Elias set down the net. “Most things are.” He paused. “Not everything.”",
          ),
        ],
      },
      {
        id: "house",
        title: "A house full of weather",
        blocks: [
          paragraph(
            "The front door opened on the third attempt. Inside, the house held its breath.",
          ),
          paragraph(
            "Mara walked from room to room without turning on the lights. Her father’s coat still hung by the back door, its pockets full of receipts for things he would never need again. On the kitchen table sat a blue notebook.",
          ),
          paragraph(
            "On its first page, in handwriting she knew better than her own, someone had written: Start with the tide tables.",
          ),
        ],
      },
      {
        id: "notebook",
        title: "The blue notebook",
        blocks: [
          paragraph(
            "Every entry began with the weather. Wind from the east. A low tide. Rain expected after dusk. Her father had recorded the world as if it might be called upon to give evidence.",
          ),
          paragraph(
            "Between the ordinary observations, names appeared. Some she recognized. One had been crossed out so thoroughly that the paper had torn.",
          ),
        ],
      },
      {
        id: "lowtide",
        title: "What the water keeps",
        blocks: [
          paragraph(
            "At low tide, a path appeared beneath the harbor wall. Mara had walked it once as a child, following her father’s boots through the silver mud. Now she would have to find her own way.",
          ),
        ],
      },
    ],
    drafts: [],
    proposals: [],
    history: [],
    comments: [],
  };
  record(project, "First complete draft", "Sample author", "main", true);
  const id = startDraft(
    project,
    "A quieter opening",
    "Sample editor",
    "arrival",
  );
  const draft = project.drafts[0];
  draft.chapters[0].blocks[0].node = paragraph(
    "The ferry left before Mara was ready. She watched its white wake unravel across the harbor, her father’s suitcase at her feet. In her pocket, the old house key pressed a small, familiar shape into her palm.",
  ).node;
  draft.chapters[0].blocks[6].node = paragraph(
    "Above the harbor, the house on the headland caught the last of the light. Mara counted the upstairs windows out of habit. One, two, three. All dark.",
  ).node;
  propose(
    project,
    id,
    "Let the setting carry more of Mara’s hesitation. Two small changes to give the opening a little more breathing room.",
    "Sample editor",
  );
  project.comments.push({
    id: "sample-comment",
    chapterId: "arrival",
    target: "main",
    quote: "“I meant by about fifteen years.”",
    text: "This exchange does a lot with very little. Could we carry this restraint into the opening paragraph?",
    author: "Sample editor",
    createdAt: new Date().toISOString(),
    resolved: false,
  });
  return copy(project);
}
