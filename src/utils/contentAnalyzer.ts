
export interface ContentAnalysis {
  wordCount: number;
  themes: string[];
  characters: string[];
  timeMarkers: string[];
  plotElements: string[];
  tone: 'action' | 'dialogue' | 'description' | 'introspection' | 'mixed';
  complexity: number; // 1-10 scale
}

export interface MergeConflict {
  type: 'character' | 'theme' | 'timeline' | 'plot' | 'tone';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
}

export interface SmartMergePosition {
  position: number;
  score: number; // 0-100, higher is better
  reason: string;
  chapterTitle?: string;
  contextBefore?: string;
  contextAfter?: string;
}

// Simple content analysis - in a real app, this could use NLP libraries
export const analyzeContent = (content: string, title?: string): ContentAnalysis => {
  const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  // Detect characters (capitalized words that appear multiple times)
  const capitalizedWords = content.match(/\b[A-Z][a-z]+\b/g) || [];
  const wordFreq = capitalizedWords.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const characters = Object.entries(wordFreq)
    .filter(([word, freq]) => freq > 1 && word.length > 2)
    .map(([word]) => word)
    .slice(0, 10);

  // Detect themes (common literary themes)
  const themeKeywords = {
    'love': ['love', 'romance', 'heart', 'kiss', 'embrace'],
    'conflict': ['fight', 'battle', 'war', 'struggle', 'conflict'],
    'mystery': ['secret', 'hidden', 'mystery', 'unknown', 'discover'],
    'journey': ['journey', 'travel', 'path', 'road', 'destination'],
    'family': ['family', 'mother', 'father', 'sister', 'brother'],
    'friendship': ['friend', 'friendship', 'companion', 'together'],
    'betrayal': ['betray', 'lie', 'deceive', 'trust', 'truth'],
    'death': ['death', 'die', 'kill', 'funeral', 'grave']
  };

  const themes = Object.entries(themeKeywords)
    .filter(([theme, keywords]) => 
      keywords.some(keyword => words.includes(keyword))
    )
    .map(([theme]) => theme);

  // Detect time markers
  const timeMarkers = [
    'morning', 'afternoon', 'evening', 'night', 'dawn', 'dusk',
    'yesterday', 'today', 'tomorrow', 'week', 'month', 'year',
    'before', 'after', 'during', 'meanwhile', 'suddenly', 'then'
  ].filter(marker => words.includes(marker));

  // Detect plot elements
  const plotKeywords = {
    'dialogue': ['"', "'", 'said', 'asked', 'replied', 'whispered'],
    'action': ['run', 'jump', 'fight', 'move', 'grab', 'hit'],
    'description': ['looked', 'seemed', 'appeared', 'beautiful', 'dark'],
    'introspection': ['thought', 'wondered', 'realized', 'felt', 'remembered']
  };

  const plotElements = Object.entries(plotKeywords)
    .filter(([element, keywords]) => 
      keywords.some(keyword => content.toLowerCase().includes(keyword))
    )
    .map(([element]) => element);

  // Determine dominant tone
  const dialogueCount = (content.match(/"/g) || []).length;
  const actionWords = plotKeywords.action.filter(word => words.includes(word)).length;
  const descriptionWords = plotKeywords.description.filter(word => words.includes(word)).length;
  const introspectionWords = plotKeywords.introspection.filter(word => words.includes(word)).length;

  let tone: ContentAnalysis['tone'] = 'mixed';
  const scores = {
    dialogue: dialogueCount,
    action: actionWords,
    description: descriptionWords,
    introspection: introspectionWords
  };
  
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore > 0) {
    tone = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] as ContentAnalysis['tone'] || 'mixed';
  }

  // Calculate complexity (based on sentence length, vocabulary variety, etc.)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0;
  const uniqueWords = new Set(words).size;
  const vocabularyRichness = words.length > 0 ? uniqueWords / words.length : 0;
  
  const complexity = Math.min(10, Math.max(1, 
    (avgSentenceLength / 20) * 5 + vocabularyRichness * 5
  ));

  return {
    wordCount,
    themes,
    characters,
    timeMarkers,
    plotElements,
    tone,
    complexity: Math.round(complexity)
  };
};

export const detectMergeConflicts = (
  sourceAnalysis: ContentAnalysis, 
  targetAnalyses: ContentAnalysis[]
): MergeConflict[] => {
  const conflicts: MergeConflict[] = [];

  targetAnalyses.forEach((targetAnalysis, index) => {
    // Character conflicts
    const sharedCharacters = sourceAnalysis.characters.filter(char => 
      targetAnalysis.characters.includes(char)
    );
    
    if (sharedCharacters.length > 0) {
      conflicts.push({
        type: 'character',
        severity: sharedCharacters.length > 2 ? 'high' : 'medium',
        description: `Shared characters: ${sharedCharacters.join(', ')}`,
        suggestion: 'Consider if character development is consistent'
      });
    }

    // Theme conflicts
    const sharedThemes = sourceAnalysis.themes.filter(theme => 
      targetAnalysis.themes.includes(theme)
    );
    
    if (sharedThemes.length > 1) {
      conflicts.push({
        type: 'theme',
        severity: 'medium',
        description: `Similar themes: ${sharedThemes.join(', ')}`,
        suggestion: 'Ensure thematic progression makes sense'
      });
    }

    // Tone conflicts
    if (sourceAnalysis.tone !== 'mixed' && targetAnalysis.tone !== 'mixed' && 
        sourceAnalysis.tone !== targetAnalysis.tone) {
      conflicts.push({
        type: 'tone',
        severity: 'low',
        description: `Tone mismatch: ${sourceAnalysis.tone} vs ${targetAnalysis.tone}`,
        suggestion: 'Consider if tone shift is intentional'
      });
    }
  });

  return conflicts;
};

export const calculateSmartPositions = (
  sourceAnalysis: ContentAnalysis,
  targetChapters: Array<{ id: string; title?: string; content: string; chapter_order: number }>
): SmartMergePosition[] => {
  const positions: SmartMergePosition[] = [];
  
  // Analyze each target chapter
  const targetAnalyses = targetChapters.map(chapter => ({
    ...chapter,
    analysis: analyzeContent(chapter.content, chapter.title)
  }));

  // Position 1: At the beginning
  positions.push({
    position: 1,
    score: 20,
    reason: 'Insert as prologue or early chapter',
    contextAfter: targetChapters[0]?.title || 'First chapter'
  });

  // Analyze positions between existing chapters
  for (let i = 0; i < targetAnalyses.length - 1; i++) {
    const currentChapter = targetAnalyses[i];
    const nextChapter = targetAnalyses[i + 1];
    
    let score = 50; // Base score
    let reason = 'Insert between chapters';

    // Boost score if themes align
    const currentThemes = currentChapter.analysis.themes;
    const nextThemes = nextChapter.analysis.themes;
    const sourceThemes = sourceAnalysis.themes;
    
    const currentThemeMatch = sourceThemes.filter(theme => currentThemes.includes(theme)).length;
    const nextThemeMatch = sourceThemes.filter(theme => nextThemes.includes(theme)).length;
    
    if (currentThemeMatch > 0 || nextThemeMatch > 0) {
      score += 20;
      reason = 'Good thematic flow';
    }

    // Boost score if tone progression makes sense
    if (sourceAnalysis.tone === currentChapter.analysis.tone || 
        sourceAnalysis.tone === nextChapter.analysis.tone) {
      score += 15;
      reason = 'Consistent tone progression';
    }

    // Boost score if complexity progression makes sense
    const complexityDiff = Math.abs(sourceAnalysis.complexity - 
      (currentChapter.analysis.complexity + nextChapter.analysis.complexity) / 2);
    if (complexityDiff < 2) {
      score += 10;
      reason = 'Natural complexity progression';
    }

    // Penalize if there are major character conflicts
    const currentCharacters = currentChapter.analysis.characters;
    const nextCharacters = nextChapter.analysis.characters;
    const sourceCharacters = sourceAnalysis.characters;
    
    const characterConflicts = sourceCharacters.filter(char => 
      currentCharacters.includes(char) && nextCharacters.includes(char)
    ).length;
    
    if (characterConflicts > 2) {
      score -= 15;
      reason = 'Potential character development conflicts';
    }

    positions.push({
      position: currentChapter.chapter_order + 1,
      score: Math.max(10, Math.min(100, score)),
      reason,
      chapterTitle: currentChapter.title,
      contextBefore: currentChapter.title || `Chapter ${currentChapter.chapter_order}`,
      contextAfter: nextChapter.title || `Chapter ${nextChapter.chapter_order}`
    });
  }

  // Position at the end
  const lastChapter = targetAnalyses[targetAnalyses.length - 1];
  let endScore = 30;
  let endReason = 'Append to end';

  if (lastChapter) {
    // Boost if it's a good continuation
    const themeMatch = sourceAnalysis.themes.filter(theme => 
      lastChapter.analysis.themes.includes(theme)
    ).length;
    
    if (themeMatch > 0) {
      endScore += 25;
      endReason = 'Natural continuation of themes';
    }

    if (sourceAnalysis.tone === lastChapter.analysis.tone) {
      endScore += 15;
      endReason = 'Consistent tone continuation';
    }
  }

  positions.push({
    position: targetChapters.length + 1,
    score: endScore,
    reason: endReason,
    contextBefore: lastChapter?.title || 'Last chapter'
  });

  // Sort by score (highest first)
  return positions.sort((a, b) => b.score - a.score);
};
