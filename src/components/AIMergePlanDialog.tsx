import React, { useEffect, useMemo, useState } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Wand2,
  Eye,
  ThumbsUp,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MergePlanSection {
  id: string;
  type: 'keep_source' | 'keep_target' | 'conflict' | 'similar' | 'merge';
  sourceText?: string;
  targetText?: string;
  recommendation: 'source' | 'target' | 'merge';
  reason: string;
  confidence: number;
}

interface MergePlan {
  sections: MergePlanSection[];
  summary: string;
  overallRecommendation: string;
}

interface AIMergePlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sourceContent: string;
  targetContent: string;
  sourceAuthor: string;
  targetAuthor: string;
  sourceBranch: string;
  targetBranch: string;
  chapterTitle?: string;
  onMergeComplete: (mergedContent: string, note: string) => Promise<void>;
}

const normalizeChoice = (c: MergePlanSection['recommendation']): 'source' | 'target' => {
  return c === 'source' ? 'source' : 'target';
};

const AIMergePlanDialog: React.FC<AIMergePlanDialogProps> = ({
  isOpen,
  onClose,
  sourceContent,
  targetContent,
  sourceAuthor,
  targetAuthor,
  sourceBranch,
  targetBranch,
  chapterTitle,
  onMergeComplete,
}) => {
  const [mergePlan, setMergePlan] = useState<MergePlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, 'source' | 'target'>>({});
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    
    // Check if we have content before generating
    if (!sourceContent || !targetContent) {
      console.error('Missing content:', { sourceContent: !!sourceContent, targetContent: !!targetContent });
      toast.error('No content provided for merging. Please ensure both versions have content.');
      return;
    }

    // Reset state when opening so reruns don't reuse old plan
    setMergePlan(null);
    setSelectedChoices({});
    setShowPreview(true);

    void generateMergePlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sourceContent, targetContent]);

  useEffect(() => {
    if (!mergePlan) return;
    const initialChoices: Record<string, 'source' | 'target'> = {};
    mergePlan.sections.forEach((section) => {
      initialChoices[section.id] = normalizeChoice(section.recommendation);
    });
    setSelectedChoices(initialChoices);
  }, [mergePlan]);

  const generateMergePlan = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-merge-plan', {
        body: {
          sourceContent,
          targetContent,
          sourceAuthor,
          targetAuthor,
          sourceBranch,
          targetBranch,
          chapterTitle,
        },
      });

      if (error) throw error;

      if (data?.mergePlan) {
        setMergePlan(data.mergePlan);
        toast.success('Merge plan generated');
      } else {
        throw new Error('No merge plan returned');
      }
    } catch (error) {
      console.error('Failed to generate merge plan:', error);
      toast.error('Failed to generate merge plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChoice = (sectionId: string, choice: 'source' | 'target') => {
    setSelectedChoices((prev) => ({
      ...prev,
      [sectionId]: choice,
    }));
  };

  const trustAllAI = () => {
    if (!mergePlan) return;
    const aiChoices: Record<string, 'source' | 'target'> = {};
    mergePlan.sections.forEach((section) => {
      aiChoices[section.id] = normalizeChoice(section.recommendation);
    });
    setSelectedChoices(aiChoices);
    toast.success('Applied AI recommendations');
  };

  const mergedHtml = useMemo(() => {
    if (!mergePlan) return '';

    const cleanChunk = (s: string) => s.replace(/```(?:json|html|text)?\n?/gi, '').replace(/```/g, '').trim();

    const chunks = mergePlan.sections
      .map((section) => {
        const choice = selectedChoices[section.id];
        const raw = choice === 'source' ? (section.sourceText || '') : (section.targetText || '');
        return raw ? cleanChunk(raw) : '';
      })
      .filter(Boolean);

    return chunks.join('\n');
  }, [mergePlan, selectedChoices]);

  const handleExecuteMerge = async () => {
    if (!mergePlan) return;

    setIsExecuting(true);
    try {
      const fromSource = Object.values(selectedChoices).filter((c) => c === 'source').length;
      const fromTarget = Object.values(selectedChoices).filter((c) => c === 'target').length;

      const note = `AI decision plan (no generation): ${fromSource} sections from source, ${fromTarget} sections from target`;
      await onMergeComplete(mergedHtml, note);
      toast.success('Merge completed');
      onClose();
    } catch (error) {
      console.error('Failed to execute merge:', error);
      toast.error('Failed to complete merge');
    } finally {
      setIsExecuting(false);
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge>High</Badge>;
    if (confidence >= 0.5) return <Badge variant="secondary">Medium</Badge>;
    return <Badge variant="destructive">Low</Badge>;
  };

  const getTypeBadge = (type: MergePlanSection['type']) => {
    switch (type) {
      case 'keep_source':
        return <Badge variant="outline">Source Only</Badge>;
      case 'keep_target':
        return <Badge variant="outline">Target Only</Badge>;
      case 'similar':
        return <Badge variant="outline">Similar</Badge>;
      case 'conflict':
        return <Badge variant="destructive">Conflict</Badge>;
      default:
        return <Badge variant="outline">Section</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-6xl h-[92vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Merge Plan
            {chapterTitle && <Badge variant="outline" className="ml-2">{chapterTitle}</Badge>}
          </DialogTitle>
          <DialogDescription>
            AI only suggests which version to keep per section — it does not generate new text.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Analyzing content and generating merge plan...</p>
            </div>
          </div>
        ) : mergePlan ? (
          <>
            <Card className="p-4 bg-muted/30">
              <div className="flex items-start gap-3">
                <Wand2 className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{mergePlan.summary}</p>
                  <p className="text-xs text-muted-foreground mt-1">{mergePlan.overallRecommendation}</p>
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={trustAllAI}>
                <ThumbsUp className="w-4 h-4 mr-2" />
                Trust AI Picks
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPreview((v) => !v)}>
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
            </div>

            <div className="flex-1 min-h-0 flex gap-4 overflow-hidden">
              <ScrollArea className={`flex-1 min-h-0 ${showPreview ? 'w-1/2' : ''}`}>
                <div className="space-y-3 pr-4">
                  {mergePlan.sections.map((section, index) => (
                    <Card
                      key={section.id}
                      className={section.type === 'conflict' ? 'border-destructive/50' : undefined}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">Section {index + 1}</span>
                            {getTypeBadge(section.type)}
                            {getConfidenceBadge(section.confidence)}
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground mb-3">{section.reason}</p>

                        <div className="flex gap-2 flex-wrap">
                          {section.sourceText && (
                            <Button
                              size="sm"
                              variant={selectedChoices[section.id] === 'source' ? 'default' : 'outline'}
                              onClick={() => toggleChoice(section.id, 'source')}
                            >
                              S: Source
                            </Button>
                          )}
                          {section.targetText && (
                            <Button
                              size="sm"
                              variant={selectedChoices[section.id] === 'target' ? 'default' : 'outline'}
                              onClick={() => toggleChoice(section.id, 'target')}
                            >
                              T: Target
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              {showPreview && (
                <div className="w-1/2 flex flex-col min-h-0 overflow-hidden">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Merged Preview
                  </h4>
                  <ScrollArea className="flex-1 min-h-0 border rounded-md p-4">
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: mergedHtml }}
                    />
                  </ScrollArea>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Failed to generate merge plan</p>
              <Button onClick={generateMergePlan} className="mt-4">
                <Sparkles className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExecuteMerge} disabled={isLoading || isExecuting || !mergePlan}>
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Execute Merge
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIMergePlanDialog;
