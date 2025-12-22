// Diff calculator for paragraph-level content comparison

export interface DiffBlock {
  type: 'unchanged' | 'added' | 'removed' | 'modified';
  sourceContent?: string;
  targetContent?: string;
  sourceIndex?: number;
  targetIndex?: number;
  similarity?: number;
}

export interface ContentDiff {
  blocks: DiffBlock[];
  similarity: number;
  sourceWordCount: number;
  targetWordCount: number;
}

export interface MergeBlock {
  id: string;
  type: 'unchanged' | 'conflict' | 'added-a' | 'added-b';
  contentA?: string;
  contentB?: string;
  paragraphIndicesA?: number[];
  paragraphIndicesB?: number[];
  similarity?: number;
  resolved?: boolean;
  resolution?: 'a' | 'b' | 'both' | 'skip';
}

export interface SmartMergeResult {
  blocks: MergeBlock[];
  unchangedCount: number;
  conflictCount: number;
  addedACount: number;
  addedBCount: number;
  totalParagraphsA: number;
  totalParagraphsB: number;
}

// Normalize HTML content to plain text paragraphs
export function htmlToParagraphs(html: string): string[] {
  // Remove HTML tags but preserve paragraph breaks
  const text = html
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
  
  return text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

// Calculate similarity between two strings using word-based Jaccard index
export function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (!str1.length || !str2.length) return 0;

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  // Quick check for very different lengths
  if (longer.length - shorter.length > longer.length * 0.5) {
    return 0;
  }

  // Use word-based comparison for better accuracy
  const words1 = str1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const words2 = str2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

// Get word count from text
export function getWordCount(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

// Find best matching paragraph in target for a source paragraph
function findBestMatch(
  sourceParagraph: string, 
  targetParagraphs: string[], 
  usedIndices: Set<number>
): { index: number; similarity: number } | null {
  let bestMatch: { index: number; similarity: number } | null = null;
  
  for (let i = 0; i < targetParagraphs.length; i++) {
    if (usedIndices.has(i)) continue;
    
    const similarity = calculateStringSimilarity(sourceParagraph, targetParagraphs[i]);
    
    if (similarity > 0.3 && (!bestMatch || similarity > bestMatch.similarity)) {
      bestMatch = { index: i, similarity };
    }
  }
  
  return bestMatch;
}

// SMART MERGE: Calculate merge blocks between two versions
// Groups unchanged paragraphs, identifies conflicts, and detects additions
export function calculateSmartMerge(
  htmlA: string, 
  htmlB: string, 
  unchangedThreshold: number = 0.95
): SmartMergeResult {
  const paragraphsA = htmlToParagraphs(htmlA);
  const paragraphsB = htmlToParagraphs(htmlB);
  
  const blocks: MergeBlock[] = [];
  const usedA = new Set<number>();
  const usedB = new Set<number>();
  
  // Find all matches between paragraphs
  const matches: { indexA: number; indexB: number; similarity: number }[] = [];
  
  for (let a = 0; a < paragraphsA.length; a++) {
    for (let b = 0; b < paragraphsB.length; b++) {
      const similarity = calculateStringSimilarity(paragraphsA[a], paragraphsB[b]);
      if (similarity > 0.3) {
        matches.push({ indexA: a, indexB: b, similarity });
      }
    }
  }
  
  // Sort by similarity (best first) then by position
  matches.sort((x, y) => {
    if (Math.abs(x.similarity - y.similarity) > 0.1) return y.similarity - x.similarity;
    return x.indexA - y.indexA;
  });
  
  // Greedy matching - take best matches first
  const finalMatches: { indexA: number; indexB: number; similarity: number }[] = [];
  for (const match of matches) {
    if (!usedA.has(match.indexA) && !usedB.has(match.indexB)) {
      finalMatches.push(match);
      usedA.add(match.indexA);
      usedB.add(match.indexB);
    }
  }
  
  // Sort by position in A
  finalMatches.sort((x, y) => x.indexA - y.indexA);
  
  // Reset used sets - we'll rebuild properly now
  usedA.clear();
  usedB.clear();
  
  // Group consecutive unchanged paragraphs and create blocks
  let currentUnchangedA: number[] = [];
  let currentUnchangedB: number[] = [];
  let lastProcessedA = -1;
  let lastProcessedB = -1;
  
  const flushUnchanged = () => {
    if (currentUnchangedA.length > 0) {
      blocks.push({
        id: `unchanged-${currentUnchangedA[0]}`,
        type: 'unchanged',
        contentA: currentUnchangedA.map(i => paragraphsA[i]).join('\n\n'),
        contentB: currentUnchangedB.map(i => paragraphsB[i]).join('\n\n'),
        paragraphIndicesA: [...currentUnchangedA],
        paragraphIndicesB: [...currentUnchangedB],
        resolved: true,
        resolution: 'both'
      });
      currentUnchangedA = [];
      currentUnchangedB = [];
    }
  };
  
  for (const match of finalMatches) {
    // Add any unmatched paragraphs from A before this match
    for (let i = lastProcessedA + 1; i < match.indexA; i++) {
      if (!usedA.has(i)) {
        flushUnchanged();
        blocks.push({
          id: `added-a-${i}`,
          type: 'added-a',
          contentA: paragraphsA[i],
          paragraphIndicesA: [i],
          resolved: false
        });
        usedA.add(i);
      }
    }
    
    // Add any unmatched paragraphs from B before this match
    for (let i = lastProcessedB + 1; i < match.indexB; i++) {
      if (!usedB.has(i)) {
        flushUnchanged();
        blocks.push({
          id: `added-b-${i}`,
          type: 'added-b',
          contentB: paragraphsB[i],
          paragraphIndicesB: [i],
          resolved: false
        });
        usedB.add(i);
      }
    }
    
    // Handle the matched pair
    if (match.similarity >= unchangedThreshold) {
      // Unchanged - group with previous unchanged
      currentUnchangedA.push(match.indexA);
      currentUnchangedB.push(match.indexB);
    } else {
      // Conflict - flush unchanged and add conflict
      flushUnchanged();
      blocks.push({
        id: `conflict-${match.indexA}-${match.indexB}`,
        type: 'conflict',
        contentA: paragraphsA[match.indexA],
        contentB: paragraphsB[match.indexB],
        paragraphIndicesA: [match.indexA],
        paragraphIndicesB: [match.indexB],
        similarity: match.similarity,
        resolved: false
      });
    }
    
    usedA.add(match.indexA);
    usedB.add(match.indexB);
    lastProcessedA = match.indexA;
    lastProcessedB = match.indexB;
  }
  
  // Flush any remaining unchanged
  flushUnchanged();
  
  // Add remaining unmatched from A
  for (let i = lastProcessedA + 1; i < paragraphsA.length; i++) {
    if (!usedA.has(i)) {
      blocks.push({
        id: `added-a-${i}`,
        type: 'added-a',
        contentA: paragraphsA[i],
        paragraphIndicesA: [i],
        resolved: false
      });
    }
  }
  
  // Add remaining unmatched from B
  for (let i = lastProcessedB + 1; i < paragraphsB.length; i++) {
    if (!usedB.has(i)) {
      blocks.push({
        id: `added-b-${i}`,
        type: 'added-b',
        contentB: paragraphsB[i],
        paragraphIndicesB: [i],
        resolved: false
      });
    }
  }
  
  // Calculate stats
  const unchangedCount = blocks.filter(b => b.type === 'unchanged')
    .reduce((sum, b) => sum + (b.paragraphIndicesA?.length || 0), 0);
  const conflictCount = blocks.filter(b => b.type === 'conflict').length;
  const addedACount = blocks.filter(b => b.type === 'added-a').length;
  const addedBCount = blocks.filter(b => b.type === 'added-b').length;
  
  return {
    blocks,
    unchangedCount,
    conflictCount,
    addedACount,
    addedBCount,
    totalParagraphsA: paragraphsA.length,
    totalParagraphsB: paragraphsB.length
  };
}

// Build final content from resolved blocks
export function buildMergedContent(blocks: MergeBlock[]): string {
  const paragraphs: string[] = [];
  
  for (const block of blocks) {
    if (block.type === 'unchanged') {
      // Use version A content for unchanged blocks
      if (block.contentA) paragraphs.push(block.contentA);
    } else if (block.resolved) {
      switch (block.resolution) {
        case 'a':
          if (block.contentA) paragraphs.push(block.contentA);
          break;
        case 'b':
          if (block.contentB) paragraphs.push(block.contentB);
          break;
        case 'both':
          if (block.contentA) paragraphs.push(block.contentA);
          if (block.contentB && block.contentB !== block.contentA) paragraphs.push(block.contentB);
          break;
        case 'skip':
          // Don't include anything
          break;
      }
    }
  }
  
  return paragraphs.map(p => `<p>${p}</p>`).join('\n');
}

// Calculate diff between two HTML content blocks (legacy function)
export function calculateDiff(sourceHtml: string, targetHtml: string): ContentDiff {
  const sourceParagraphs = htmlToParagraphs(sourceHtml);
  const targetParagraphs = htmlToParagraphs(targetHtml);
  
  const blocks: DiffBlock[] = [];
  const usedSourceIndices = new Set<number>();
  const usedTargetIndices = new Set<number>();
  
  // First pass: find matching paragraphs
  const matches: { sourceIndex: number; targetIndex: number; similarity: number }[] = [];
  
  for (let i = 0; i < sourceParagraphs.length; i++) {
    const match = findBestMatch(sourceParagraphs[i], targetParagraphs, new Set());
    if (match && match.similarity > 0.5) {
      matches.push({ sourceIndex: i, targetIndex: match.index, similarity: match.similarity });
    }
  }
  
  // Sort matches to maintain order
  matches.sort((a, b) => a.sourceIndex - b.sourceIndex);
  
  // Process in order
  let lastSourceIndex = -1;
  let lastTargetIndex = -1;
  
  for (const match of matches) {
    // Add removed paragraphs from source before this match
    for (let i = lastSourceIndex + 1; i < match.sourceIndex; i++) {
      if (!usedSourceIndices.has(i)) {
        blocks.push({
          type: 'removed',
          sourceContent: sourceParagraphs[i],
          sourceIndex: i
        });
        usedSourceIndices.add(i);
      }
    }
    
    // Add added paragraphs from target before this match
    for (let i = lastTargetIndex + 1; i < match.targetIndex; i++) {
      if (!usedTargetIndices.has(i)) {
        blocks.push({
          type: 'added',
          targetContent: targetParagraphs[i],
          targetIndex: i
        });
        usedTargetIndices.add(i);
      }
    }
    
    // Add the matched/modified block
    if (match.similarity === 1) {
      blocks.push({
        type: 'unchanged',
        sourceContent: sourceParagraphs[match.sourceIndex],
        targetContent: targetParagraphs[match.targetIndex],
        sourceIndex: match.sourceIndex,
        targetIndex: match.targetIndex
      });
    } else {
      blocks.push({
        type: 'modified',
        sourceContent: sourceParagraphs[match.sourceIndex],
        targetContent: targetParagraphs[match.targetIndex],
        sourceIndex: match.sourceIndex,
        targetIndex: match.targetIndex,
        similarity: match.similarity
      });
    }
    
    usedSourceIndices.add(match.sourceIndex);
    usedTargetIndices.add(match.targetIndex);
    lastSourceIndex = match.sourceIndex;
    lastTargetIndex = match.targetIndex;
  }
  
  // Add remaining removed paragraphs from source
  for (let i = lastSourceIndex + 1; i < sourceParagraphs.length; i++) {
    if (!usedSourceIndices.has(i)) {
      blocks.push({
        type: 'removed',
        sourceContent: sourceParagraphs[i],
        sourceIndex: i
      });
    }
  }
  
  // Add remaining added paragraphs from target
  for (let i = lastTargetIndex + 1; i < targetParagraphs.length; i++) {
    if (!usedTargetIndices.has(i)) {
      blocks.push({
        type: 'added',
        targetContent: targetParagraphs[i],
        targetIndex: i
      });
    }
  }
  
  // Calculate overall similarity
  const totalBlocks = blocks.length;
  const unchangedBlocks = blocks.filter(b => b.type === 'unchanged').length;
  const similarity = totalBlocks > 0 ? unchangedBlocks / totalBlocks : 1;
  
  // Count words
  const sourceWordCount = sourceParagraphs.join(' ').split(/\s+/).filter(w => w).length;
  const targetWordCount = targetParagraphs.join(' ').split(/\s+/).filter(w => w).length;
  
  return {
    blocks,
    similarity,
    sourceWordCount,
    targetWordCount
  };
}

// Convert paragraphs back to HTML
export function paragraphsToHtml(paragraphs: string[]): string {
  return paragraphs.map(p => `<p>${p}</p>`).join('\n');
}

// Get word-level diff for a modified block (for highlighting)
export function getWordDiff(source: string, target: string): {
  sourceWords: { word: string; changed: boolean }[];
  targetWords: { word: string; changed: boolean }[];
} {
  const sourceWords = source.split(/\s+/).filter(w => w);
  const targetWords = target.split(/\s+/).filter(w => w);
  
  const sourceSet = new Set(sourceWords.map(w => w.toLowerCase()));
  const targetSet = new Set(targetWords.map(w => w.toLowerCase()));
  
  return {
    sourceWords: sourceWords.map(word => ({
      word,
      changed: !targetSet.has(word.toLowerCase())
    })),
    targetWords: targetWords.map(word => ({
      word,
      changed: !sourceSet.has(word.toLowerCase())
    }))
  };
}
