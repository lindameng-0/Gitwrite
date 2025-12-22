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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sparkles,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Wand2,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Merge
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MergePlanSection {
  id: string;
  type: 'keep_source' | 'keep_target' | 'merge' | 'conflict';
  sourceText?: string;
  targetText?: string;
  recommendation: 'source' | 'target' | 'merge';
  reason: string;
  suggestedContent?: string;
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
  onMergeComplete
}) => {
  const [mergePlan, setMergePlan] = useState<MergePlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, 'source' | 'target' | 'merge'>>({});
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isOpen && !mergePlan) {
      generateMergePlan();
    }
  }, [isOpen]);

  useEffect(() => {
    if (mergePlan) {
      // Initialize choices with AI recommendations
      const initialChoices: Record<string, 'source' | 'target' | 'merge'> = {};
      mergePlan.sections.forEach(section => {
        initialChoices[section.id] = section.recommendation;
      });
      setSelectedChoices(initialChoices);
    }
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
          chapterTitle
        }
      });

      if (error) throw error;

      if (data?.mergePlan) {
        setMergePlan(data.mergePlan);
        toast.success('Merge plan generated!');
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

  const toggleChoice = (sectionId: string, choice: 'source' | 'target' | 'merge') => {
    setSelectedChoices(prev => ({
      ...prev,
      [sectionId]: choice
    }));
  };

  const trustAllAI = () => {
    if (!mergePlan) return;
    const aiChoices: Record<string, 'source' | 'target' | 'merge'> = {};
    mergePlan.sections.forEach(section => {
      aiChoices[section.id] = section.recommendation;
    });
    setSelectedChoices(aiChoices);
    toast.success('Applied all AI recommendations');
  };

  const previewContent = useMemo(() => {
    if (!mergePlan) return '';
    
    return mergePlan.sections.map(section => {
      const choice = selectedChoices[section.id];
      if (choice === 'source') {
        return section.sourceText || '';
      } else if (choice === 'target') {
        return section.targetText || '';
      } else {
        return section.suggestedContent || section.sourceText || '';
      }
    }).filter(Boolean).join('\n\n');
  }, [mergePlan, selectedChoices]);

  const handleExecuteMerge = async () => {
    setIsExecuting(true);
    try {
      const htmlContent = previewContent.split('\n\n').map(p => `<p>${p}</p>`).join('\n');
      const note = `AI-assisted merge: ${Object.values(selectedChoices).filter(c => c === 'source').length} from source, ${Object.values(selectedChoices).filter(c => c === 'target').length} from target, ${Object.values(selectedChoices).filter(c => c === 'merge').length} merged`;
      await onMergeComplete(htmlContent, note);
      toast.success('Merge completed successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to execute merge:', error);
      toast.error('Failed to complete merge');
    } finally {
      setIsExecuting(false);
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">High</Badge>;
    } else if (confidence >= 0.5) {
      return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Medium</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">Low</Badge>;
    }
  };

  const getTypeBadge = (type: MergePlanSection['type']) => {
    switch (type) {
      case 'keep_source':
        return <Badge variant="outline" className="border-blue-300 text-blue-700">Source Only</Badge>;
      case 'keep_target':
        return <Badge variant="outline" className="border-purple-300 text-purple-700">Target Only</Badge>;
      case 'merge':
        return <Badge variant="outline" className="border-green-300 text-green-700">Can Merge</Badge>;
      case 'conflict':
        return <Badge variant="outline" className="border-red-300 text-red-700">Conflict</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Merge Plan
            {chapterTitle && (
              <Badge variant="outline" className="ml-2">{chapterTitle}</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Review AI recommendations and customize the merge
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
            {/* Summary */}
            <Card className="p-4 bg-muted/30">
              <div className="flex items-start gap-3">
                <Wand2 className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{mergePlan.summary}</p>
                  <p className="text-xs text-muted-foreground mt-1">{mergePlan.overallRecommendation}</p>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={trustAllAI}>
                <ThumbsUp className="w-4 h-4 mr-2" />
                Trust All AI
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
            </div>

            <div className="flex-1 min-h-0 flex gap-4 overflow-hidden">
              {/* Sections List */}
              <ScrollArea className={`flex-1 h-[400px] ${showPreview ? 'w-1/2' : ''}`}>
                <div className="space-y-3 pr-4">
                  {mergePlan.sections.map((section, index) => (
                    <Card 
                      key={section.id} 
                      className={`p-4 ${
                        section.type === 'conflict' ? 'border-red-300 dark:border-red-700' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Section {index + 1}</span>
                          {getTypeBadge(section.type)}
                          {getConfidenceBadge(section.confidence)}
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground mb-3">{section.reason}</p>

                      {/* Choice Buttons */}
                      <div className="flex gap-2 flex-wrap">
                        {section.sourceText && (
                          <Button
                            size="sm"
                            variant={selectedChoices[section.id] === 'source' ? 'default' : 'outline'}
                            onClick={() => toggleChoice(section.id, 'source')}
                            className={selectedChoices[section.id] === 'source' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                          >
                            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center mr-2">S</span>
                            Source
                          </Button>
                        )}
                        {section.targetText && (
                          <Button
                            size="sm"
                            variant={selectedChoices[section.id] === 'target' ? 'default' : 'outline'}
                            onClick={() => toggleChoice(section.id, 'target')}
                            className={selectedChoices[section.id] === 'target' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                          >
                            <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center justify-center mr-2">T</span>
                            Target
                          </Button>
                        )}
                        {section.suggestedContent && (
                          <Button
                            size="sm"
                            variant={selectedChoices[section.id] === 'merge' ? 'default' : 'outline'}
                            onClick={() => toggleChoice(section.id, 'merge')}
                            className={selectedChoices[section.id] === 'merge' ? 'bg-green-600 hover:bg-green-700' : ''}
                          >
                            <Merge className="w-4 h-4 mr-2" />
                            AI Merged
                          </Button>
                        )}
                      </div>

                      {/* Preview of selected content */}
                      <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
                        <p className="line-clamp-3">
                          {selectedChoices[section.id] === 'source' ? section.sourceText :
                           selectedChoices[section.id] === 'target' ? section.targetText :
                           section.suggestedContent || section.sourceText}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              {/* Preview Panel */}
              {showPreview && (
                <div className="w-1/2 flex flex-col min-h-0 overflow-hidden">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Merged Preview
                  </h4>
                  <ScrollArea className="flex-1 h-[400px] border rounded-md p-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {previewContent.split('\n\n').map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
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
          <Button
            onClick={handleExecuteMerge}
            disabled={isLoading || isExecuting || !mergePlan}
            className="bg-gradient-to-r from-green-600 to-emerald-600"
          >
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
