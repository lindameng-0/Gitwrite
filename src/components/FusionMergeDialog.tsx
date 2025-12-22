import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Layers,
  Loader2,
  CheckCircle,
  User,
  FileText,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import SmartMergeView from './SmartMergeView';
import type { MergeRequestWithDetails } from '@/hooks/useMergeRequests';
import type { ChapterWithReviews } from '@/hooks/useStoryData';
import { calculateStringSimilarity, getWordCount } from '@/utils/diffCalculator';

interface VersionData {
  request: MergeRequestWithDetails;
  chapters: ChapterWithReviews[];
  wordCount: number;
  approvedCount: number;
}

interface FusionMergeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  versions: VersionData[];
  onFusionComplete: (fusedContent: string, selectedVersionIds: string[], fusionNote: string) => Promise<void>;
  chapterTitle?: string;
}

const FusionMergeDialog: React.FC<FusionMergeDialogProps> = ({
  isOpen,
  onClose,
  versions,
  onFusionComplete,
  chapterTitle
}) => {
  const [selectedVersionIds, setSelectedVersionIds] = useState<string[]>([]);
  const [mergedContent, setMergedContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fusionNote, setFusionNote] = useState('');

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Default to first two versions for smart merge
      setSelectedVersionIds(versions.slice(0, 2).map(v => v.request.id));
      setMergedContent('');
      setFusionNote('');
    }
  }, [isOpen, versions]);

  const toggleVersionSelection = (requestId: string) => {
    setSelectedVersionIds(prev => {
      if (prev.includes(requestId)) {
        return prev.filter(id => id !== requestId);
      }
      // Limit to 2 versions for smart merge
      if (prev.length >= 2) {
        return [prev[1], requestId]; // Keep second, add new
      }
      return [...prev, requestId];
    });
  };

  const getSelectedVersions = () => {
    return versions.filter(v => selectedVersionIds.includes(v.request.id));
  };

  // Prepare version data for SmartMergeView
  const versionA = useMemo(() => {
    const selected = getSelectedVersions();
    if (selected.length < 1) return null;
    const v = selected[0];
    return {
      name: v.request.source_branch?.name || 'Version A',
      author: v.request.author_name,
      content: v.chapters.map(c => c.content).join('\n\n'),
      wordCount: v.wordCount
    };
  }, [selectedVersionIds, versions]);

  const versionB = useMemo(() => {
    const selected = getSelectedVersions();
    if (selected.length < 2) return null;
    const v = selected[1];
    return {
      name: v.request.source_branch?.name || 'Version B',
      author: v.request.author_name,
      content: v.chapters.map(c => c.content).join('\n\n'),
      wordCount: v.wordCount
    };
  }, [selectedVersionIds, versions]);

  // Calculate similarity between versions
  const similarityMatrix = useMemo(() => {
    const selected = getSelectedVersions();
    if (selected.length < 2) return null;

    const matrix: { v1: number; v2: number; similarity: number }[] = [];
    for (let i = 0; i < selected.length; i++) {
      for (let j = i + 1; j < selected.length; j++) {
        const content1 = selected[i].chapters.map(c => c.content).join(' ');
        const content2 = selected[j].chapters.map(c => c.content).join(' ');
        const similarity = calculateStringSimilarity(content1, content2);
        matrix.push({ v1: i, v2: j, similarity });
      }
    }
    return matrix;
  }, [selectedVersionIds, versions]);

  // Calculate merged content word count
  const mergedWordCount = useMemo(() => {
    if (!mergedContent) return 0;
    const text = mergedContent.replace(/<[^>]*>/g, '').trim();
    return getWordCount(text);
  }, [mergedContent]);

  const handleComplete = async () => {
    if (!mergedContent.trim()) {
      toast.error('No merged content to save');
      return;
    }

    setIsProcessing(true);
    try {
      const selectedAuthors = getSelectedVersions().map(v => v.request.author_name).join(', ');
      await onFusionComplete(
        mergedContent, 
        selectedVersionIds, 
        fusionNote || `Smart merge from ${selectedVersionIds.length} versions: ${selectedAuthors}`
      );
      toast.success('Merge completed successfully!');
      onClose();
    } catch (error) {
      console.error('Fusion complete error:', error);
      toast.error('Failed to save merged content');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedVersions = getSelectedVersions();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Smart Merge
            {chapterTitle && (
              <Badge variant="outline" className="ml-2">{chapterTitle}</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Select two versions to compare. Unchanged content is auto-included; resolve only the conflicts.
          </DialogDescription>
        </DialogHeader>

        {/* Version Selection with Stats */}
        <div className="border-b border-border pb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Select 2 versions to merge:</h4>
            {selectedVersions.length >= 2 && similarityMatrix && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BarChart3 className="w-3 h-3" />
                {similarityMatrix.map((m, i) => (
                  <Badge 
                    key={i} 
                    variant="outline" 
                    className={`text-xs ${
                      m.similarity > 0.7 ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                      m.similarity > 0.4 ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}
                  >
                    Overall: {Math.round(m.similarity * 100)}% similar
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {versions.map((version, index) => {
              const isSelected = selectedVersionIds.includes(version.request.id);
              const selectionOrder = selectedVersionIds.indexOf(version.request.id);
              
              return (
                <Card
                  key={version.request.id}
                  className={`p-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'hover:border-muted-foreground/50'
                  }`}
                  onClick={() => toggleVersionSelection(version.request.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isSelected && selectionOrder === 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                      isSelected && selectionOrder === 1 ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {isSelected ? (selectionOrder === 0 ? 'A' : 'B') : (index + 1)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{version.request.source_branch?.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {version.request.author_name}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {version.wordCount.toLocaleString()} words
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-4 h-4 text-primary ml-auto" />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
          
          {selectedVersionIds.length < 2 && (
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Select exactly 2 versions to compare and merge
            </p>
          )}
        </div>

        {/* Smart Merge View */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {versionA && versionB ? (
            <SmartMergeView
              versionA={versionA}
              versionB={versionB}
              onContentChange={setMergedContent}
            />
          ) : (
            <Card className="h-full flex items-center justify-center border-dashed">
              <div className="text-center">
                <Layers className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">
                  Select 2 versions above to start merging
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  The smart merge will auto-include unchanged content and highlight conflicts
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Footer with Stats */}
        <DialogFooter className="pt-4 border-t border-border">
          <div className="flex-1 flex items-center gap-4 text-xs text-muted-foreground">
            {selectedVersions.length >= 2 && (
              <>
                <span>Merged: {mergedWordCount.toLocaleString()} words</span>
              </>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={isProcessing || !mergedContent}
            className="bg-gradient-to-r from-green-600 to-emerald-600"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Merge
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FusionMergeDialog;
