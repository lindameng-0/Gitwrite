import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Wand2,
  Hand,
  Layers,
  Sparkles,
  Loader2,
  CheckCircle,
  User,
  FileText,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SectionPicker from './SectionPicker';
import type { MergeRequestWithDetails } from '@/hooks/useMergeRequests';
import type { ChapterWithReviews } from '@/hooks/useStoryData';

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
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [selectedVersionIds, setSelectedVersionIds] = useState<string[]>([]);
  const [fusionInstructions, setFusionInstructions] = useState('');
  const [aiFusedContent, setAiFusedContent] = useState('');
  const [manualFusedContent, setManualFusedContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fusionNote, setFusionNote] = useState('');

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedVersionIds(versions.map(v => v.request.id));
      setAiFusedContent('');
      setManualFusedContent('');
      setFusionInstructions('');
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

  const handleAIFusion = async () => {
    const selected = getSelectedVersions();
    if (selected.length < 2) {
      toast.error('Please select at least 2 versions to combine');
      return;
    }

    setIsProcessing(true);
    try {
      // Prepare content for fusion
      const versionsContent = selected.map(v => ({
        author: v.request.author_name,
        branchName: v.request.source_branch?.name || 'Unknown',
        content: v.chapters
          .filter(c => c.content && c.content.trim().length > 0)
          .map(c => c.content)
          .join('\n\n')
      }));

      const { data, error } = await supabase.functions.invoke('fuse-chapters', {
        body: {
          versions: versionsContent,
          instructions: fusionInstructions,
          chapterTitle
        }
      });

      if (error) throw error;

      if (data?.fusedContent) {
        setAiFusedContent(data.fusedContent);
        setFusionNote(`AI fusion of ${selected.length} versions: ${selected.map(v => v.request.author_name).join(', ')}`);
        toast.success('AI fusion completed!');
      } else {
        throw new Error('No content returned from fusion');
      }
    } catch (error) {
      console.error('AI fusion error:', error);
      toast.error('Failed to generate AI fusion. Please try again or use manual mode.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = async () => {
    const content = mode === 'ai' ? aiFusedContent : manualFusedContent;
    if (!content.trim()) {
      toast.error('No fused content to save');
      return;
    }

    setIsProcessing(true);
    try {
      await onFusionComplete(content, selectedVersionIds, fusionNote || `Fused from ${selectedVersionIds.length} versions`);
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
          // Split content into paragraphs
          const text = c.content.replace(/<[^>]*>/g, '');
          return text.split(/\n\n+/).filter(p => p.trim());
        }),
      color: ''
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Combine Multiple Versions
            {chapterTitle && (
              <Badge variant="outline" className="ml-2">{chapterTitle}</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Merge content from multiple writers into a single unified chapter
          </DialogDescription>
        </DialogHeader>

        {/* Version Selection */}
        <div className="border-b border-border pb-4">
          <h4 className="text-sm font-medium mb-3">Select versions to combine:</h4>
          <div className="flex flex-wrap gap-2">
            {versions.map((version, index) => (
              <Card
                key={version.request.id}
                className={`p-3 cursor-pointer transition-all ${
                  selectedVersionIds.includes(version.request.id)
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-muted-foreground/50'
                }`}
                onClick={() => toggleVersionSelection(version.request.id)}
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedVersionIds.includes(version.request.id)}
                    onCheckedChange={() => toggleVersionSelection(version.request.id)}
                  />
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                    index === 1 ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                    index === 2 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{version.request.source_branch?.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {version.request.author_name}
                      <span>•</span>
                      <FileText className="w-3 h-3" />
                      {version.wordCount} words
                    </p>
                  </div>
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

        {/* Mode Tabs */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'ai' | 'manual')} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              AI Fusion
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Hand className="w-4 h-4" />
              Manual Fusion
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="flex-1 flex flex-col space-y-4 mt-4 min-h-0">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Fusion Instructions (optional)
              </label>
              <Textarea
                value={fusionInstructions}
                onChange={(e) => setFusionInstructions(e.target.value)}
                placeholder="E.g., 'Keep the romantic subplot from Version A but use the action scenes from Version B. Maintain a consistent tone throughout.'"
                className="min-h-[80px]"
              />
            </div>

            {!aiFusedContent ? (
              <Card className="flex-1 flex items-center justify-center p-8 border-dashed min-h-[200px]">
                <div className="text-center">
                  <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    AI will intelligently combine the selected versions
                  </p>
                  <Button
                    onClick={handleAIFusion}
                    disabled={selectedVersionIds.length < 2 || isProcessing}
                    className="bg-gradient-to-r from-violet-600 to-purple-600"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Fusion...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate AI Fusion
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Fused Result
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAIFusion}
                    disabled={isProcessing}
                  >
                    <Wand2 className="w-3 h-3 mr-1" />
                    Regenerate
                  </Button>
                </div>
                <ScrollArea className="flex-1 border rounded-md p-4 min-h-[200px]">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: aiFusedContent }}
                  />
                </ScrollArea>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual" className="flex-1 mt-4 min-h-0">
            <SectionPicker
              versions={prepareManualVersions()}
              onCombinedContentChange={setManualFusedContent}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={
              isProcessing || 
              (mode === 'ai' && !aiFusedContent) || 
              (mode === 'manual' && !manualFusedContent)
            }
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
