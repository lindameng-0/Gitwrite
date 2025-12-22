import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  GripVertical,
  Trash2,
  Plus,
  ChevronUp,
  ChevronDown,
  Sparkles,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { calculateStringSimilarity } from '@/utils/diffCalculator';

interface Section {
  id: string;
  sourceVersionIndex: number;
  content: string;
  paragraphIndex: number;
}

interface VersionContent {
  authorName: string;
  branchName: string;
  paragraphs: string[];
  color: string;
  wordCount?: number;
}

interface SectionPickerProps {
  versions: VersionContent[];
  onCombinedContentChange: (content: string) => void;
}

const VERSION_COLORS = [
  { bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-700 dark:text-blue-300', ring: 'ring-blue-500/20' },
  { bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-700 dark:text-purple-300', ring: 'ring-purple-500/20' },
  { bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-300 dark:border-green-700', text: 'text-green-700 dark:text-green-300', ring: 'ring-green-500/20' },
  { bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-700 dark:text-amber-300', ring: 'ring-amber-500/20' },
];

const SectionPicker: React.FC<SectionPickerProps> = ({
  versions,
  onCombinedContentChange
}) => {
  const [selectedSections, setSelectedSections] = useState<Section[]>([]);

  // Calculate paragraph similarities between versions
  const paragraphSimilarities = useMemo(() => {
    const similarities: Map<string, { versionIndex: number; paragraphIndex: number; similarity: number }[]> = new Map();
    
    for (let v1 = 0; v1 < versions.length; v1++) {
      for (let p1 = 0; p1 < versions[v1].paragraphs.length; p1++) {
        const key = `${v1}-${p1}`;
        const similar: { versionIndex: number; paragraphIndex: number; similarity: number }[] = [];
        
        for (let v2 = 0; v2 < versions.length; v2++) {
          if (v1 === v2) continue;
          for (let p2 = 0; p2 < versions[v2].paragraphs.length; p2++) {
            const sim = calculateStringSimilarity(
              versions[v1].paragraphs[p1], 
              versions[v2].paragraphs[p2]
            );
            if (sim > 0.4) {
              similar.push({ versionIndex: v2, paragraphIndex: p2, similarity: sim });
            }
          }
        }
        
        if (similar.length > 0) {
          similarities.set(key, similar.sort((a, b) => b.similarity - a.similarity));
        }
      }
    }
    
    return similarities;
  }, [versions]);

  // Calculate word count for a paragraph
  const getWordCount = (text: string) => text.split(/\s+/).filter(w => w).length;

  const addSection = (versionIndex: number, paragraphIndex: number) => {
    const paragraph = versions[versionIndex].paragraphs[paragraphIndex];
    const newSection: Section = {
      id: `${versionIndex}-${paragraphIndex}-${Date.now()}`,
      sourceVersionIndex: versionIndex,
      content: paragraph,
      paragraphIndex
    };
    const newSections = [...selectedSections, newSection];
    setSelectedSections(newSections);
    updateCombinedContent(newSections);
  };

  const removeSection = (sectionId: string) => {
    const newSections = selectedSections.filter(s => s.id !== sectionId);
    setSelectedSections(newSections);
    updateCombinedContent(newSections);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...selectedSections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setSelectedSections(newSections);
    updateCombinedContent(newSections);
  };

  const updateCombinedContent = (sections: Section[]) => {
    const combined = sections.map(s => `<p>${s.content}</p>`).join('\n');
    onCombinedContentChange(combined);
  };

  const getColorForVersion = (index: number) => VERSION_COLORS[index % VERSION_COLORS.length];

  // Calculate contribution stats
  const contributionStats = useMemo(() => {
    const stats = versions.map(() => ({ paragraphs: 0, words: 0 }));
    for (const section of selectedSections) {
      stats[section.sourceVersionIndex].paragraphs += 1;
      stats[section.sourceVersionIndex].words += getWordCount(section.content);
    }
    return stats;
  }, [selectedSections, versions]);

  const totalMergedWords = contributionStats.reduce((sum, s) => sum + s.words, 0);

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Contribution Stats Bar */}
        {selectedSections.length > 0 && (
          <div className="mb-3 p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground">Contribution breakdown:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {versions.map((version, vIndex) => {
                const colors = getColorForVersion(vIndex);
                const stats = contributionStats[vIndex];
                const percentage = totalMergedWords > 0 ? Math.round((stats.words / totalMergedWords) * 100) : 0;
                
                if (stats.paragraphs === 0) return null;
                
                return (
                  <Badge 
                    key={vIndex} 
                    variant="outline" 
                    className={`${colors.bg} ${colors.text} ${colors.border}`}
                  >
                    {String.fromCharCode(65 + vIndex)} ({version.authorName}): {stats.paragraphs} §, {stats.words} words ({percentage}%)
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
          {/* Source Versions - Left Panel */}
          <div className="flex flex-col min-h-0">
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              Source Versions
              <span className="text-xs font-normal">
                ({versions.reduce((sum, v) => sum + v.paragraphs.length, 0)} paragraphs total)
              </span>
            </h4>
            <ScrollArea className="flex-1">
              <div className="space-y-4 pr-4">
                {versions.map((version, versionIndex) => {
                  const colors = getColorForVersion(versionIndex);
                  const versionWordCount = version.paragraphs.reduce((sum, p) => sum + getWordCount(p), 0);
                  
                  return (
                    <Card key={versionIndex} className={`p-3 ${colors.border}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${colors.bg} ${colors.text}`}>
                          {String.fromCharCode(65 + versionIndex)}
                        </Badge>
                        <span className="text-sm font-medium">{version.branchName}</span>
                        <span className="text-xs text-muted-foreground">by {version.authorName}</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          <FileText className="w-3 h-3 mr-1" />
                          {versionWordCount} words
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {version.paragraphs.map((paragraph, pIndex) => {
                          const isSelected = selectedSections.some(
                            s => s.sourceVersionIndex === versionIndex && s.paragraphIndex === pIndex
                          );
                          const similarities = paragraphSimilarities.get(`${versionIndex}-${pIndex}`);
                          const wordCount = getWordCount(paragraph);
                          
                          return (
                            <div
                              key={pIndex}
                              className={`p-2 rounded text-xs border transition-all ${
                                isSelected 
                                  ? 'opacity-40 border-dashed bg-muted/30' 
                                  : `hover:${colors.bg} cursor-pointer border-transparent hover:border-current/20`
                              }`}
                              onClick={() => !isSelected && addSection(versionIndex, pIndex)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="line-clamp-2">{paragraph}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-muted-foreground">{wordCount} words</span>
                                    {similarities && similarities.length > 0 && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-0.5 cursor-help">
                                            <Sparkles className="w-3 h-3" />
                                            Similar in {similarities.map(s => String.fromCharCode(65 + s.versionIndex)).join(', ')}
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="max-w-xs">
                                          <p className="text-xs">
                                            This paragraph is similar to content in other versions.
                                            Consider which version's wording you prefer.
                                          </p>
                                          <div className="mt-1 space-y-1">
                                            {similarities.slice(0, 2).map((s, i) => (
                                              <p key={i} className="text-xs text-muted-foreground">
                                                {String.fromCharCode(65 + s.versionIndex)}: {Math.round(s.similarity * 100)}% similar
                                              </p>
                                            ))}
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                  </div>
                                </div>
                                {!isSelected && (
                                  <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0">
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                )}
                                {isSelected && (
                                  <Badge variant="secondary" className="text-xs shrink-0">Added</Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Combined Result - Right Panel */}
          <div className="flex flex-col min-h-0">
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              Combined Result
              <span className="text-xs font-normal">
                ({selectedSections.length} sections, {totalMergedWords} words)
              </span>
            </h4>
            <ScrollArea className="flex-1">
              {selectedSections.length === 0 ? (
                <Card className="p-8 text-center border-dashed h-full flex flex-col items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground text-sm">
                    Click on paragraphs from the source versions to add them here
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Paragraphs with similar content in other versions are highlighted
                  </p>
                </Card>
              ) : (
                <div className="space-y-2 pr-4">
                  {selectedSections.map((section, index) => {
                    const colors = getColorForVersion(section.sourceVersionIndex);
                    const wordCount = getWordCount(section.content);
                    
                    return (
                      <Card
                        key={section.id}
                        className={`p-2 ${colors.border} ${colors.bg} ring-1 ${colors.ring}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5"
                              onClick={() => moveSection(index, 'up')}
                              disabled={index === 0}
                            >
                              <ChevronUp className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5"
                              onClick={() => moveSection(index, 'down')}
                              disabled={index === selectedSections.length - 1}
                            >
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-1">
                              <Badge variant="outline" className={`text-xs ${colors.text} ${colors.bg}`}>
                                {String.fromCharCode(65 + section.sourceVersionIndex)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {versions[section.sourceVersionIndex]?.authorName}
                              </span>
                              <span className="text-xs text-muted-foreground ml-auto">
                                {wordCount} words
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed">{section.content}</p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeSection(section.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SectionPicker;