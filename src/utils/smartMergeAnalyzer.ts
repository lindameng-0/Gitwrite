
import type { ChapterWithReviews } from '@/hooks/useStoryData';

export interface ContentSimilarity {
  score: number; // 0-100
  type: 'identical' | 'similar' | 'related' | 'different';
  reasons: string[];
  suggestedAction: 'replace' | 'merge' | 'insert' | 'skip';
}

export interface SmartMergeRecommendation {
  targetChapterId?: string;
  mode: 'replace' | 'insert' | 'append' | 'subplot' | 'flashback';
  position?: number;
  confidence: number;
  reason: string;
  similarity?: ContentSimilarity;
}

export function calculateContentSimilarity(
  sourceContent: string,
  sourceTitle: string,
  targetContent: string,
  targetTitle: string
): ContentSimilarity {
  const reasons: string[] = [];
  let score = 0;
  
  // Title similarity (30% weight)
  const titleSimilarity = calculateStringSimilarity(
    sourceTitle.toLowerCase().trim(),
    targetTitle.toLowerCase().trim()
  );
  score += titleSimilarity * 0.3;
  
  if (titleSimilarity > 0.8) {
    reasons.push(`Very similar titles (${Math.round(titleSimilarity * 100)}% match)`);
  } else if (titleSimilarity > 0.5) {
    reasons.push(`Similar titles (${Math.round(titleSimilarity * 100)}% match)`);
  }
  
  // Content similarity (70% weight)
  const contentSimilarity = calculateStringSimilarity(
    normalizeContent(sourceContent),
    normalizeContent(targetContent)
  );
  score += contentSimilarity * 0.7;
  
  if (contentSimilarity > 0.7) {
    reasons.push(`High content similarity (${Math.round(contentSimilarity * 100)}% match)`);
  } else if (contentSimilarity > 0.4) {
    reasons.push(`Moderate content similarity (${Math.round(contentSimilarity * 100)}% match)`);
  }
  
  // Character name overlap
  const sourceCharacters = extractCharacterNames(sourceContent);
  const targetCharacters = extractCharacterNames(targetContent);
  const characterOverlap = calculateSetOverlap(sourceCharacters, targetCharacters);
  
  if (characterOverlap > 0.5 && sourceCharacters.size > 0) {
    reasons.push(`${Math.round(characterOverlap * 100)}% character overlap`);
    score += 0.1; // Small bonus for character overlap
  }
  
  // Scene/setting similarity
  const sourceSettings = extractSettings(sourceContent);
  const targetSettings = extractSettings(targetContent);
  const settingOverlap = calculateSetOverlap(sourceSettings, targetSettings);
  
  if (settingOverlap > 0.3 && sourceSettings.size > 0) {
    reasons.push(`${Math.round(settingOverlap * 100)}% setting overlap`);
    score += 0.05; // Small bonus for setting overlap
  }
  
  // Determine type and suggested action
  let type: ContentSimilarity['type'];
  let suggestedAction: ContentSimilarity['suggestedAction'];
  
  if (score >= 0.9) {
    type = 'identical';
    suggestedAction = 'skip';
    reasons.push('Content appears to be nearly identical');
  } else if (score >= 0.6) {
    type = 'similar';
    suggestedAction = 'replace';
    reasons.push('Content appears to be an alternate version');
  } else if (score >= 0.3) {
    type = 'related';
    suggestedAction = 'merge';
    reasons.push('Content shares common elements');
  } else {
    type = 'different';
    suggestedAction = 'insert';
    reasons.push('Content appears to be unique');
  }
  
  return {
    score: Math.min(100, Math.round(score * 100)),
    type,
    reasons,
    suggestedAction
  };
}

export function generateSmartMergeRecommendations(
  sourceChapter: ChapterWithReviews,
  targetChapters: ChapterWithReviews[]
): SmartMergeRecommendation[] {
  const recommendations: SmartMergeRecommendation[] = [];
  
  // Find the most similar chapter
  let bestMatch: { chapter: ChapterWithReviews; similarity: ContentSimilarity } | null = null;
  let bestScore = 0;
  
  for (const targetChapter of targetChapters) {
    const similarity = calculateContentSimilarity(
      sourceChapter.content || '',
      sourceChapter.title || '',
      targetChapter.content || '',
      targetChapter.title || ''
    );
    
    if (similarity.score > bestScore) {
      bestScore = similarity.score;
      bestMatch = { chapter: targetChapter, similarity };
    }
  }
  
  // Generate recommendations based on best match
  if (bestMatch && bestMatch.similarity.score >= 60) {
    // High similarity - likely alternate version
    recommendations.push({
      targetChapterId: bestMatch.chapter.id,
      mode: 'replace',
      confidence: bestMatch.similarity.score,
      reason: `Replace "${bestMatch.chapter.title}" - detected as alternate version (${bestMatch.similarity.score}% similar)`,
      similarity: bestMatch.similarity
    });
    
    // Also offer insert option for comparison
    recommendations.push({
      position: bestMatch.chapter.chapter_order + 1,
      mode: 'insert',
      confidence: Math.max(0, bestMatch.similarity.score - 20),
      reason: `Insert after "${bestMatch.chapter.title}" for comparison`,
      similarity: bestMatch.similarity
    });
  } else if (bestMatch && bestMatch.similarity.score >= 30) {
    // Moderate similarity - related content
    recommendations.push({
      position: bestMatch.chapter.chapter_order + 1,
      mode: 'insert',
      confidence: bestMatch.similarity.score,
      reason: `Insert after "${bestMatch.chapter.title}" - related content detected`,
      similarity: bestMatch.similarity
    });
    
    recommendations.push({
      mode: 'subplot',
      confidence: Math.max(0, bestMatch.similarity.score - 10),
      reason: `Add as subplot - shares characters/themes with "${bestMatch.chapter.title}"`,
      similarity: bestMatch.similarity
    });
  }
  
  // Always offer append as fallback
  recommendations.push({
    mode: 'append',
    confidence: 70,
    reason: 'Add to end of story (safe default option)'
  });
  
  // Sort by confidence
  return recommendations.sort((a, b) => b.confidence - a.confidence);
}

function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;
  
  // Use Jaccard similarity with word n-grams
  const words1 = str1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const words2 = str2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

function normalizeContent(content: string): string {
  return content
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCharacterNames(content: string): Set<string> {
  const names = new Set<string>();
  
  // Look for quoted dialogue patterns (someone speaking)
  const dialogueMatches = content.match(/"[^"]*"/g) || [];
  
  // Look for common name patterns (capitalized words not at sentence start)
  const nameMatches = content.match(/(?<!^|\. )[A-Z][a-z]{2,}/g) || [];
  
  // Simple heuristic: words that appear multiple times and are capitalized
  const words = content.split(/\s+/);
  const capitalizedWords = words.filter(word => /^[A-Z][a-z]{2,}$/.test(word));
  
  for (const word of capitalizedWords) {
    const count = capitalizedWords.filter(w => w === word).length;
    if (count >= 2) { // Appears at least twice
      names.add(word);
    }
  }
  
  return names;
}

function extractSettings(content: string): Set<string> {
  const settings = new Set<string>();
  
  // Look for location-indicating phrases
  const locationPatterns = [
    /(?:in|at|near|inside|outside|within)\s+(?:the\s+)?([A-Z][a-z\s]{3,20})/gi,
    /(?:entered|left|walked to|arrived at)\s+(?:the\s+)?([A-Z][a-z\s]{3,20})/gi
  ];
  
  for (const pattern of locationPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        settings.add(match[1].trim());
      }
    }
  }
  
  return settings;
}

function calculateSetOverlap<T>(set1: Set<T>, set2: Set<T>): number {
  if (set1.size === 0 && set2.size === 0) return 1;
  if (set1.size === 0 || set2.size === 0) return 0;
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}
