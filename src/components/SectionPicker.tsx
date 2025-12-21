import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  GripVertical,
  Trash2,
  Plus,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

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
}

interface SectionPickerProps {
  versions: VersionContent[];
  onCombinedContentChange: (content: string) => void;
}

const VERSION_COLORS = [
  { bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-700 dark:text-blue-300' },
  { bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-700 dark:text-purple-300' },
  { bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-300 dark:border-green-700', text: 'text-green-700 dark:text-green-300' },
  { bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-700 dark:text-amber-300' },
];

const SectionPicker: React.FC<SectionPickerProps> = ({
  versions,
  onCombinedContentChange
}) => {
  const [selectedSections, setSelectedSections] = useState<Section[]>([]);

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

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* Source Versions - Left Panel */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Source Versions</h4>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4 pr-4">
            {versions.map((version, versionIndex) => {
              const colors = getColorForVersion(versionIndex);
              return (
                <Card key={versionIndex} className={`p-3 ${colors.border}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${colors.bg} ${colors.text}`}>
                      {String.fromCharCode(65 + versionIndex)}
                    </Badge>
                    <span className="text-sm font-medium">{version.branchName}</span>
                    <span className="text-xs text-muted-foreground">by {version.authorName}</span>
                  </div>
                  <div className="space-y-2">
                    {version.paragraphs.map((paragraph, pIndex) => {
                      const isSelected = selectedSections.some(
                        s => s.sourceVersionIndex === versionIndex && s.paragraphIndex === pIndex
                      );
                      return (
                        <div
                          key={pIndex}
                          className={`p-2 rounded text-xs border transition-all ${
                            isSelected 
                              ? 'opacity-50 border-dashed' 
                              : `hover:${colors.bg} cursor-pointer border-transparent`
                          }`}
                          onClick={() => !isSelected && addSection(versionIndex, pIndex)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-2 flex-1">{paragraph}</p>
                            {!isSelected && (
                              <Button size="icon" variant="ghost" className="h-5 w-5 shrink-0">
                                <Plus className="w-3 h-3" />
                              </Button>
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
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">
          Combined Result ({selectedSections.length} sections)
        </h4>
        <ScrollArea className="h-[400px]">
          {selectedSections.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <p className="text-muted-foreground text-sm">
                Click on paragraphs from the source versions to add them here
              </p>
            </Card>
          ) : (
            <div className="space-y-2 pr-4">
              {selectedSections.map((section, index) => {
                const colors = getColorForVersion(section.sourceVersionIndex);
                return (
                  <Card
                    key={section.id}
                    className={`p-2 ${colors.border} ${colors.bg}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col gap-1 shrink-0">
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
                          <Badge variant="outline" className={`text-xs ${colors.text}`}>
                            {String.fromCharCode(65 + section.sourceVersionIndex)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            from {versions[section.sourceVersionIndex]?.authorName}
                          </span>
                        </div>
                        <p className="text-xs">{section.content}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
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
  );
};

export default SectionPicker;
