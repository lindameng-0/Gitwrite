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
import SectionPicker from './SectionPicker';
import type { MergeRequestWithDetails } from '@/hooks/useMergeRequests';
import type { ChapterWithReviews } from '@/hooks/useStoryData';
import { calculateStringSimilarity } from '@/utils/diffCalculator';

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
  const [manualFusedContent, setManualFusedContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fusionNote, setFusionNote] = useState('');

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedVersionIds(versions.map(v => v.request.id));
      setManualFusedContent('');
      setFusionNote('');
    }
  }, [isOpen, versions]);

  const toggleVersionSelection = (requestId: string) => {
    setSelectedVersionIds(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const getSelectedVersions = () => {
    return versions.filter(v => selectedVersionIds.includes(v.request.id));
  };

  // Calculate similarity matrix between versions
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

  // Calculate total word count
  const totalWordCount = useMemo(() => {
    return getSelectedVersions().reduce((sum, v) => sum + v.wordCount, 0);
  }, [selectedVersionIds, versions]);

  // Calculate merged content word count
  const mergedWordCount = useMemo(() => {
    if (!manualFusedContent) return 0;
    const text = manualFusedContent.replace(/<[^>]*>/g, '').trim();
    return text.split(/\s+/).filter(w => w).length;
  }, [manualFusedContent]);

  const handleComplete = async () => {
    if (!manualFusedContent.trim()) {
      toast.error('No fused content to save');
      return;
    }

    setIsProcessing(true);
    try {
      const selectedAuthors = getSelectedVersions().map(v => v.request.author_name).join(', ');
      await onFusionComplete(
        manualFusedContent, 
        selectedVersionIds, 
        fusionNote || `Manual fusion from ${selectedVersionIds.length} versions: ${selectedAuthors}`
      );
      toast.success('Fusion merged successfully!');
      onClose();
    } catch (error) {
      console.error('Fusion complete error:', error);
      toast.error('Failed to save fused content');
    } finally {
      setIsProcessing(false);
    }
  };

  const prepareManualVersions = () => {
    return getSelectedVersions().map(v => ({
      authorName: v.request.author_name,
      branchName: v.request.source_branch?.name || 'Unknown',
      paragraphs: v.chapters
        .filter(c => c.content && c.content.trim().length > 0)
        .flatMap(c => {
          const text = c.content.replace(/<[^>]*>/g, '');
          return text.split(/\n\n+/).filter(p => p.trim());
        }),
      color: '',
      wordCount: v.wordCount
    }));
  };

  const selectedVersions = getSelectedVersions();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Combine Multiple Versions
            {chapterTitle && (
              <Badge variant="outline" className="ml-2">{chapterTitle}</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Select and arrange paragraphs from multiple writers to create a unified chapter
          </DialogDescription>
        </DialogHeader>

        {/* Version Selection with Stats */}
        <div className="border-b border-border pb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Select versions to combine:</h4>
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
                    {String.fromCharCode(65 + m.v1)}↔{String.fromCharCode(65 + m.v2)}: {Math.round(m.similarity * 100)}%
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {versions.map((version, index) => (
              <Card
                key={version.request.id}
                className={`p-3 cursor-pointer transition-all ${
                  selectedVersionIds.includes(version.request.id)
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'hover:border-muted-foreground/50'
                }`}
                onClick={() => toggleVersionSelection(version.request.id)}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                    index === 1 ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                    index === 2 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                  }`}>
                    {String.fromCharCode(65 + index)}
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
                  {selectedVersionIds.includes(version.request.id) && (
                    <CheckCircle className="w-4 h-4 text-primary ml-auto" />
                  )}
                </div>
              </Card>
            ))}
          </div>
          
          {selectedVersionIds.length < 2 && (
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Select at least 2 versions to combine
            </p>
          )}
        </div>

        {/* Section Picker */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {selectedVersionIds.length >= 2 ? (
            <SectionPicker
              versions={prepareManualVersions()}
              onCombinedContentChange={setManualFusedContent}
            />
          ) : (
            <Card className="h-full flex items-center justify-center border-dashed">
              <p className="text-muted-foreground text-sm">
                Select at least 2 versions above to start combining
              </p>
            </Card>
          )}
        </div>

        {/* Footer with Stats */}
        <DialogFooter className="pt-4 border-t border-border">
          <div className="flex-1 flex items-center gap-4 text-xs text-muted-foreground">
            {selectedVersions.length >= 2 && (
              <>
                <span>Source: {totalWordCount.toLocaleString()} total words</span>
                <span>•</span>
                <span className={mergedWordCount > 0 ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                  Merged: {mergedWordCount.toLocaleString()} words
                </span>
                {mergedWordCount > 0 && totalWordCount > 0 && (
                  <>
                    <span>•</span>
                    <span>
                      {Math.round((mergedWordCount / (totalWordCount / selectedVersions.length)) * 100)}% of avg
                    </span>
                  </>
                )}
              </>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={isProcessing || !manualFusedContent}
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
                Complete Fusion
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FusionMergeDialog;