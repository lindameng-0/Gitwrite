
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertTriangle, ArrowRight, FileText, GitMerge, Target, Plus, Replace, Brain, Star, TrendingUp, Zap } from 'lucide-react';
import { analyzeContent, detectMergeConflicts, calculateSmartPositions, type ContentAnalysis, type MergeConflict, type SmartMergePosition } from '@/utils/contentAnalyzer';
import { generateSmartMergeRecommendations, type SmartMergeRecommendation } from '@/utils/smartMergeAnalyzer';
import type { ChapterWithReviews } from '@/hooks/useStoryData';

export type MergeMode = 'replace' | 'insert' | 'append' | 'subplot' | 'flashback';

interface SmartMergeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: ChapterWithReviews | null;
  targetChapters: ChapterWithReviews[];
  sourceBranchName: string;
  targetBranchName: string;
  onMerge: (
    chapterId: string,
    mode: MergeMode,
    targetPosition?: number,
    replaceChapterId?: string,
    mergeNote?: string
  ) => Promise<boolean>;
}

const SmartMergeDialog: React.FC<SmartMergeDialogProps> = ({
  isOpen,
  onClose,
  chapter,
  targetChapters,
  sourceBranchName,
  targetBranchName,
  onMerge
}) => {
  const [mergeMode, setMergeMode] = useState<MergeMode>('insert');
  const [targetPosition, setTargetPosition] = useState<number>(1);
  const [replaceChapterId, setReplaceChapterId] = useState<string>('');
  const [mergeNote, setMergeNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [conflicts, setConflicts] = useState<MergeConflict[]>([]);
  const [smartPositions, setSmartPositions] = useState<SmartMergePosition[]>([]);
  const [recommendations, setRecommendations] = useState<SmartMergeRecommendation[]>([]);

  useEffect(() => {
    if (chapter && targetChapters.length > 0) {
      // Analyze source chapter
      const sourceAnalysis = analyzeContent(chapter.content || '', chapter.title || '');
      setAnalysis(sourceAnalysis);

      // Generate smart recommendations
      const smartRecommendations = generateSmartMergeRecommendations(chapter, targetChapters);
      setRecommendations(smartRecommendations);

      // Set default merge mode and parameters based on best recommendation
      if (smartRecommendations.length > 0) {
        const bestRec = smartRecommendations[0];
        setMergeMode(bestRec.mode);
        
        if (bestRec.targetChapterId) {
          setReplaceChapterId(bestRec.targetChapterId);
        }
        if (bestRec.position) {
          setTargetPosition(bestRec.position);
        }
      }

      // Analyze target chapters for conflicts
      const targetAnalyses = targetChapters.map(tc => 
        analyzeContent(tc.content || '', tc.title || '')
      );

      // Detect conflicts
      const detectedConflicts = detectMergeConflicts(sourceAnalysis, targetAnalyses);
      setConflicts(detectedConflicts);

      // Calculate smart positions
      const positions = calculateSmartPositions(sourceAnalysis, targetChapters);
      setSmartPositions(positions);
    }
  }, [chapter, targetChapters]);

  if (!chapter) return null;

  const handleMerge = async () => {
    if (!chapter) return;
    
    setIsProcessing(true);
    try {
      const success = await onMerge(
        chapter.id,
        mergeMode,
        mergeMode === 'insert' ? targetPosition : undefined,
        mergeMode === 'replace' ? replaceChapterId : undefined,
        mergeNote
      );
      
      if (success) {
        onClose();
        // Reset form
        setMergeMode('insert');
        setTargetPosition(1);
        setReplaceChapterId('');
        setMergeNote('');
      }
    } catch (error) {
      console.error('Merge failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const wordCount = chapter.content ? chapter.content.split(' ').filter(w => w.length > 0).length : 0;
  const topRecommendation = recommendations[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            Smart Merge: "{chapter.title || 'Untitled Chapter'}"
          </DialogTitle>
          <DialogDescription>
            AI-powered content analysis for merging from <span className="font-medium">{sourceBranchName}</span> to{' '}
            <span className="font-medium">{targetBranchName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* AI Recommendations */}
          {recommendations.length > 0 && (
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                AI Analysis & Recommendations
              </h3>
              <div className="space-y-3">
                {recommendations.slice(0, 3).map((rec, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${
                    index === 0 ? 'bg-white border-blue-300 shadow-sm' : 'bg-blue-25 border-blue-100'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Star className="w-4 h-4 text-yellow-500" />}
                        <Badge className={`text-xs ${
                          rec.confidence >= 80 ? 'bg-green-100 text-green-800' :
                          rec.confidence >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {rec.confidence}% confidence
                        </Badge>
                        <span className="text-sm font-medium">{rec.mode.toUpperCase()}</span>
                      </div>
                      {index === 0 && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{rec.reason}</p>
                    {rec.similarity && (
                      <div className="mt-2 text-xs text-gray-600">
                        <span>Similarity: {rec.similarity.score}% ({rec.similarity.type})</span>
                        {rec.similarity.reasons.length > 0 && (
                          <span className="ml-2">• {rec.similarity.reasons[0]}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Content Analysis */}
          {analysis && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Content Analysis
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Word Count:</strong> {wordCount.toLocaleString()}</p>
                  <p><strong>Tone:</strong> <Badge variant="outline">{analysis.tone}</Badge></p>
                  <p><strong>Complexity:</strong> {analysis.complexity}/10</p>
                </div>
                <div>
                  <p><strong>Themes:</strong> {analysis.themes.length > 0 ? analysis.themes.join(', ') : 'None detected'}</p>
                  <p><strong>Characters:</strong> {analysis.characters.length > 0 ? analysis.characters.slice(0, 3).join(', ') : 'None detected'}</p>
                  <p><strong>Plot Elements:</strong> {analysis.plotElements.join(', ')}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Smart Conflict Detection */}
          {conflicts.length > 0 && (
            <Card className="p-4 bg-amber-50 border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-amber-900 mb-2">Content Conflicts Detected</h4>
                  <div className="space-y-2">
                    {conflicts.map((conflict, index) => (
                      <div key={index} className="text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-xs ${
                            conflict.severity === 'high' ? 'bg-red-100 text-red-800' :
                            conflict.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {conflict.type} - {conflict.severity}
                          </Badge>
                        </div>
                        <p className="text-amber-800 mb-1">{conflict.description}</p>
                        <p className="text-amber-700 font-medium">💡 {conflict.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Smart Merge Strategy */}
          <Card className="p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Merge Strategy
            </h3>
            <RadioGroup value={mergeMode} onValueChange={(value: MergeMode) => setMergeMode(value)}>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="replace" id="replace" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="replace" className="flex items-center gap-2 font-medium">
                      <Replace className="w-4 h-4 text-red-600" />
                      Replace Existing Chapter
                      {topRecommendation?.mode === 'replace' && (
                        <Badge className="bg-green-100 text-green-800 text-xs ml-2">AI Recommended</Badge>
                      )}
                    </Label>
                    <p className="text-sm text-gray-600 mt-1 mb-2">
                      Replace an existing chapter with this improved/alternate version
                    </p>
                    {mergeMode === 'replace' && (
                      <Select value={replaceChapterId} onValueChange={setReplaceChapterId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select chapter to replace..." />
                        </SelectTrigger>
                        <SelectContent>
                          {targetChapters.map((tc) => {
                            const rec = recommendations.find(r => r.targetChapterId === tc.id);
                            return (
                              <SelectItem key={tc.id} value={tc.id}>
                                <div className="flex items-center gap-2">
                                  {rec && (
                                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                                      {rec.confidence}% match
                                    </Badge>
                                  )}
                                  <span>Chapter {tc.chapter_order}: "{tc.title || 'Untitled'}"</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="insert" id="insert" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="insert" className="flex items-center gap-2 font-medium">
                      <Star className="w-4 h-4 text-green-600" />
                      Smart Insert
                      {topRecommendation?.mode === 'insert' && (
                        <Badge className="bg-green-100 text-green-800 text-xs ml-2">AI Recommended</Badge>
                      )}
                    </Label>
                    <p className="text-sm text-gray-600 mt-1 mb-2">
                      AI analyzes content flow to find the optimal insertion point
                    </p>
                    {mergeMode === 'insert' && smartPositions.length > 0 && (
                      <div className="space-y-2">
                        <Select value={targetPosition.toString()} onValueChange={(value) => setTargetPosition(parseInt(value))}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select position..." />
                          </SelectTrigger>
                          <SelectContent>
                            {smartPositions.map((pos) => (
                              <SelectItem key={pos.position} value={pos.position.toString()}>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-green-100 text-green-800 text-xs">
                                    {pos.score}% match
                                  </Badge>
                                  <span>
                                    Position {pos.position}: {pos.reason}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {smartPositions.find(p => p.position === targetPosition) && (
                          <div className="p-2 bg-green-50 rounded text-sm text-green-800">
                            <strong>Why this position?</strong> {smartPositions.find(p => p.position === targetPosition)?.reason}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="subplot" id="subplot" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="subplot" className="flex items-center gap-2 font-medium">
                      <GitMerge className="w-4 h-4 text-purple-600" />
                      Merge as Subplot
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Integrate this chapter as a parallel storyline that weaves through existing content
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="flashback" id="flashback" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="flashback" className="flex items-center gap-2 font-medium">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      Insert as Flashback
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Add contextual background that enhances understanding of current events
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="append" id="append" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="append" className="flex items-center gap-2 font-medium">
                      <Plus className="w-4 h-4 text-green-600" />
                      Append to End
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Add this chapter at the end of the story
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </Card>

          {/* Merge Note */}
          <Card className="p-4">
            <Label htmlFor="merge-note" className="text-sm font-medium text-gray-700">
              Merge Note (Optional)
            </Label>
            <Textarea
              id="merge-note"
              placeholder="Describe this merge operation or any special considerations..."
              value={mergeNote}
              onChange={(e) => setMergeNote(e.target.value)}
              className="mt-2"
            />
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleMerge}
              disabled={
                isProcessing || 
                (mergeMode === 'replace' && !replaceChapterId) ||
                (mergeMode === 'insert' && !targetPosition)
              }
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? 'Merging...' : 'Apply Smart Merge'}
            </Button>
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SmartMergeDialog;
