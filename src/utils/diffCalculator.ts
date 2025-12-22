// Diff calculator for paragraph-level content comparison

export interface DiffBlock {
  type: 'unchanged' | 'added' | 'removed' | 'modified';
  sourceContent?: string;
  targetContent?: string;
  sourceIndex?: number;
  targetIndex?: number;
}

export interface ContentDiff {
  blocks: DiffBlock[];
  similarity: number;
  sourceWordCount: number;
  targetWordCount: number;
}

// Normalize HTML content to plain text paragraphs
function htmlToParagraphs(html: string): string[] {
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

// Calculate similarity between two strings using Levenshtein distance
function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (!str1.length || !str2.length) return 0;

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  // Quick check for very different lengths
  if (longer.length - shorter.length > longer.length * 0.5) {
    return 0;
  }

  // Use word-based comparison for better accuracy
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
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

// Calculate diff between two HTML content blocks
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
        targetIndex: match.targetIndex
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
