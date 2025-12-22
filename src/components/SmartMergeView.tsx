import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Check,
  X,
  Layers,
  AlertTriangle,
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  Keyboard,
  FileText,
  Pencil,
  Save
} from 'lucide-react';
import {
  calculateSmartMerge,
  buildMergedContent,
  getWordDiff,
  getWordCount,
  type MergeBlock,
  type SmartMergeResult
} from '@/utils/diffCalculator';

interface VersionInfo {
  name: string;
  author: string;
  content: string;
  wordCount: number;
}

interface SmartMergeViewProps {
  versionA: VersionInfo;
  versionB: VersionInfo;
  onContentChange: (content: string) => void;
  unchangedThreshold?: number;
}

const SmartMergeView: React.FC<SmartMergeViewProps> = ({
  versionA,
  versionB,
  onContentChange,
  unchangedThreshold = 0.95
}) => {
  const [blocks, setBlocks] = useState<MergeBlock[]>([]);
  const [currentConflictIndex, setCurrentConflictIndex] = useState(0);
  const [expandedUnchanged, setExpandedUnchanged] = useState<Set<string>>(new Set());
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Calculate smart merge on version change
  useEffect(() => {
    const result = calculateSmartMerge(versionA.content, versionB.content, unchangedThreshold);
    setBlocks(result.blocks);
    setCurrentConflictIndex(0);
    setExpandedUnchanged(new Set());
  }, [versionA.content, versionB.content, unchangedThreshold]);

  // Update parent whenever blocks change
  useEffect(() => {
    const content = buildMergedContent(blocks);
    onContentChange(content);
  }, [blocks, onContentChange]);

  // Get unresolved conflict indices
  const unresolvedConflicts = useMemo(() => {
    return blocks
      .map((b, i) => ({ block: b, index: i }))
      .filter(({ block }) => !block.resolved && (block.type === 'conflict' || block.type === 'added-a' || block.type === 'added-b'));
  }, [blocks]);

  // Stats
  const stats = useMemo(() => {
    const unchanged = blocks.filter(b => b.type === 'unchanged')
      .reduce((sum, b) => sum + (b.paragraphIndicesA?.length || 0), 0);
    const conflicts = blocks.filter(b => b.type === 'conflict').length;
    const resolvedConflicts = blocks.filter(b => b.type === 'conflict' && b.resolved).length;
    const additionsA = blocks.filter(b => b.type === 'added-a').length;
    const additionsB = blocks.filter(b => b.type === 'added-b').length;
    const resolvedAdditions = blocks.filter(b => (b.type === 'added-a' || b.type === 'added-b') && b.resolved).length;
    
    return {
      unchanged,
      conflicts,
      resolvedConflicts,
      additionsA,
      additionsB,
      resolvedAdditions,
      totalNeedingDecision: conflicts + additionsA + additionsB,
      totalResolved: resolvedConflicts + resolvedAdditions
    };
  }, [blocks]);

  // Resolve a block
  const resolveBlock = useCallback((blockId: string, resolution: 'a' | 'b' | 'both' | 'skip' | 'custom', customContent?: string) => {
    setBlocks(prev => prev.map(b => 
      b.id === blockId ? { ...b, resolved: true, resolution, customContent } : b
    ));
    setEditingBlockId(null);
    setEditContent('');
  }, []);

  // Start editing a block
  const startEditing = useCallback((blockId: string, initialContent: string) => {
    setEditingBlockId(blockId);
    setEditContent(initialContent);
  }, []);

  // Save edited content
  const saveEdit = useCallback((blockId: string) => {
    if (editContent.trim()) {
      resolveBlock(blockId, 'custom', editContent.trim());
    }
  }, [editContent, resolveBlock]);

  // Cancel editing
  const cancelEdit = useCallback(() => {
    setEditingBlockId(null);
    setEditContent('');
  }, []);

  // Bulk actions
  const acceptAllFromA = useCallback(() => {
    setBlocks(prev => prev.map(b => {
      if (b.resolved) return b;
      if (b.type === 'conflict' || b.type === 'added-a') return { ...b, resolved: true, resolution: 'a' as const };
      if (b.type === 'added-b') return { ...b, resolved: true, resolution: 'skip' as const };
      return b;
    }));
  }, []);

  const acceptAllFromB = useCallback(() => {
    setBlocks(prev => prev.map(b => {
      if (b.resolved) return b;
      if (b.type === 'conflict' || b.type === 'added-b') return { ...b, resolved: true, resolution: 'b' as const };
      if (b.type === 'added-a') return { ...b, resolved: true, resolution: 'skip' as const };
      return b;
    }));
  }, []);

  // Navigate conflicts
  const jumpToNextConflict = useCallback(() => {
    if (unresolvedConflicts.length === 0) return;
    const next = (currentConflictIndex + 1) % unresolvedConflicts.length;
    setCurrentConflictIndex(next);
    // Scroll to the conflict
    const blockId = unresolvedConflicts[next]?.block.id;
    if (blockId) {
      document.getElementById(`block-${blockId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentConflictIndex, unresolvedConflicts]);

  const jumpToPrevConflict = useCallback(() => {
    if (unresolvedConflicts.length === 0) return;
    const prev = currentConflictIndex === 0 ? unresolvedConflicts.length - 1 : currentConflictIndex - 1;
    setCurrentConflictIndex(prev);
    const blockId = unresolvedConflicts[prev]?.block.id;
    if (blockId) {
      document.getElementById(`block-${blockId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentConflictIndex, unresolvedConflicts]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const currentBlock = unresolvedConflicts[currentConflictIndex]?.block;
      
      switch (e.key.toLowerCase()) {
        case 'j':
        case 'arrowdown':
          e.preventDefault();
          jumpToNextConflict();
          break;
        case 'k':
        case 'arrowup':
          e.preventDefault();
          jumpToPrevConflict();
          break;
        case '1':
          if (currentBlock) {
            e.preventDefault();
            resolveBlock(currentBlock.id, 'a');
            setTimeout(jumpToNextConflict, 100);
          }
          break;
        case '2':
          if (currentBlock) {
            e.preventDefault();
            resolveBlock(currentBlock.id, 'b');
            setTimeout(jumpToNextConflict, 100);
          }
          break;
        case '3':
          if (currentBlock && currentBlock.type === 'conflict') {
            e.preventDefault();
            resolveBlock(currentBlock.id, 'both');
            setTimeout(jumpToNextConflict, 100);
          }
          break;
        case 's':
          if (currentBlock) {
            e.preventDefault();
            resolveBlock(currentBlock.id, 'skip');
            setTimeout(jumpToNextConflict, 100);
          }
          break;
        case 'e':
          if (currentBlock && !editingBlockId) {
            e.preventDefault();
            const initialContent = currentBlock.type === 'conflict' 
              ? (currentBlock.contentA || '') 
              : (currentBlock.contentA || currentBlock.contentB || '');
            startEditing(currentBlock.id, initialContent);
          }
          break;
        case 'a':
          if (e.shiftKey) {
            e.preventDefault();
            acceptAllFromA();
          }
          break;
        case 'b':
          if (e.shiftKey) {
            e.preventDefault();
            acceptAllFromB();
          }
          break;
        case '?':
          e.preventDefault();
          setShowKeyboardHelp(prev => !prev);
          break;
        case 'escape':
          if (editingBlockId) {
            e.preventDefault();
            cancelEdit();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentConflictIndex, unresolvedConflicts, jumpToNextConflict, jumpToPrevConflict, resolveBlock, acceptAllFromA, acceptAllFromB, editingBlockId, startEditing, cancelEdit]);

  const toggleUnchangedExpanded = (blockId: string) => {
    setExpandedUnchanged(prev => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  };

  // Word diff highlighting component
  const WordDiffHighlight = ({ text, isSource, otherText }: { text: string; isSource: boolean; otherText: string }) => {
    const diff = getWordDiff(isSource ? text : otherText, isSource ? otherText : text);
    const words = isSource ? diff.sourceWords : diff.targetWords;
    
    return (
      <p className="text-sm leading-relaxed">
        {words.map((w, i) => (
          <span
            key={i}
            className={w.changed ? (isSource ? 'bg-red-200 dark:bg-red-900/50 line-through' : 'bg-green-200 dark:bg-green-900/50') : ''}
          >
            {w.word}{' '}
          </span>
        ))}
      </p>
    );
  };

  // Render a block
  const renderBlock = (block: MergeBlock, index: number) => {
    const isCurrentConflict = unresolvedConflicts[currentConflictIndex]?.block.id === block.id;

    if (block.type === 'unchanged') {
      const paragraphCount = block.paragraphIndicesA?.length || 0;
      const isExpanded = expandedUnchanged.has(block.id);
      const wordCount = getWordCount(block.contentA || '');
      
      return (
        <Collapsible key={block.id} open={isExpanded} onOpenChange={() => toggleUnchangedExpanded(block.id)}>
          <CollapsibleTrigger asChild>
            <Card className="p-3 bg-muted/30 border-dashed cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <Check className="w-4 h-4 text-green-600" />
                <span className="font-medium">{paragraphCount} unchanged paragraph{paragraphCount !== 1 ? 's' : ''}</span>
                <span className="text-xs">({wordCount} words)</span>
                <Badge variant="secondary" className="ml-auto text-xs">auto-included</Badge>
              </div>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-1 p-3 bg-muted/20 border-l-4 border-l-green-500/50">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{block.contentA}</p>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    if (block.type === 'conflict') {
      const wordCountA = getWordCount(block.contentA || '');
      const wordCountB = getWordCount(block.contentB || '');
      const isEditing = editingBlockId === block.id;
      
      if (block.resolved) {
        const resolvedContent = block.resolution === 'custom' 
          ? block.customContent 
          : block.resolution === 'a' 
            ? block.contentA 
            : block.resolution === 'b' 
              ? block.contentB 
              : block.resolution === 'both' 
                ? `${block.contentA}\n\n${block.contentB}` 
                : '(skipped)';
        
        return (
          <Card key={block.id} className="p-3 bg-muted/20 border-l-4 border-l-primary/50">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">
                Resolved: {block.resolution === 'custom' ? 'Custom edit' : block.resolution === 'a' ? `Using ${versionA.name}` : block.resolution === 'b' ? `Using ${versionB.name}` : block.resolution === 'both' ? 'Both' : 'Skipped'}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto text-xs h-6"
                onClick={() => setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, resolved: false, resolution: undefined, customContent: undefined } : b))}
              >
                Undo
              </Button>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{resolvedContent}</p>
          </Card>
        );
      }

      // Edit mode for conflict
      if (isEditing) {
        return (
          <Card 
            key={block.id} 
            id={`block-${block.id}`}
            className="p-4 border-2 border-primary ring-2 ring-primary/20"
          >
            <div className="flex items-center gap-2 mb-3">
              <Pencil className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">EDITING</span>
              <Badge variant="outline" className="text-xs ml-auto">
                {getWordCount(editContent)} words
              </Badge>
            </div>
            
            {/* Reference panels */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-7">
                    <ChevronRight className="w-3 h-3 mr-1" />
                    Reference: {versionA.name}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Card className="p-2 mt-1 bg-blue-50 dark:bg-blue-950/30 text-xs">
                    {block.contentA}
                  </Card>
                </CollapsibleContent>
              </Collapsible>
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-7">
                    <ChevronRight className="w-3 h-3 mr-1" />
                    Reference: {versionB.name}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Card className="p-2 mt-1 bg-purple-50 dark:bg-purple-950/30 text-xs">
                    {block.contentB}
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </div>
            
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[120px] mb-3 font-serif"
              placeholder="Enter your custom text..."
              autoFocus
            />
            
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => saveEdit(block.id)}>
                <Save className="w-3 h-3 mr-1" /> Save Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                Cancel
              </Button>
              <div className="ml-auto flex gap-1">
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setEditContent(block.contentA || '')}>
                  Load A
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setEditContent(block.contentB || '')}>
                  Load B
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setEditContent(`${block.contentA || ''}\n\n${block.contentB || ''}`)}>
                  Load Both
                </Button>
              </div>
            </div>
          </Card>
        );
      }
      
      return (
        <Card 
          key={block.id} 
          id={`block-${block.id}`}
          className={`p-4 border-2 ${isCurrentConflict ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-amber-300 dark:border-amber-700'}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">CONFLICT</span>
            {block.similarity && (
              <Badge variant="outline" className="text-xs">
                {Math.round(block.similarity * 100)}% similar
              </Badge>
            )}
            {isCurrentConflict && (
              <Badge className="bg-amber-500 text-white ml-auto">Current</Badge>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            {/* Version A */}
            <Card className="p-3 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-blue-600 text-white text-xs">A</Badge>
                <span className="text-xs font-medium">{versionA.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">{wordCountA} words</span>
              </div>
              <WordDiffHighlight text={block.contentA || ''} isSource={true} otherText={block.contentB || ''} />
            </Card>
            
            {/* Version B */}
            <Card className="p-3 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-purple-600 text-white text-xs">B</Badge>
                <span className="text-xs font-medium">{versionB.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">{wordCountB} words</span>
              </div>
              <WordDiffHighlight text={block.contentB || ''} isSource={false} otherText={block.contentA || ''} />
            </Card>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50"
              onClick={() => resolveBlock(block.id, 'a')}
            >
              <Check className="w-3 h-3 mr-1" /> Use A
              <kbd className="ml-1 text-xs bg-muted px-1 rounded">1</kbd>
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50"
              onClick={() => resolveBlock(block.id, 'b')}
            >
              <Check className="w-3 h-3 mr-1" /> Use B
              <kbd className="ml-1 text-xs bg-muted px-1 rounded">2</kbd>
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => resolveBlock(block.id, 'both')}
            >
              <Layers className="w-3 h-3 mr-1" /> Both
              <kbd className="ml-1 text-xs bg-muted px-1 rounded">3</kbd>
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => startEditing(block.id, block.contentA || '')}
            >
              <Pencil className="w-3 h-3 mr-1" /> Edit
              <kbd className="ml-1 text-xs bg-muted px-1 rounded">E</kbd>
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-muted-foreground"
              onClick={() => resolveBlock(block.id, 'skip')}
            >
              <X className="w-3 h-3 mr-1" /> Skip
            </Button>
          </div>
        </Card>
      );
    }

    if (block.type === 'added-a' || block.type === 'added-b') {
      const isA = block.type === 'added-a';
      const content = isA ? block.contentA : block.contentB;
      const version = isA ? versionA : versionB;
      const wordCount = getWordCount(content || '');
      const colorClasses = isA 
        ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700'
        : 'bg-purple-50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700';
      const isEditing = editingBlockId === block.id;
      
      if (block.resolved) {
        const resolvedContent = block.resolution === 'custom' ? block.customContent : content;
        return (
          <Card key={block.id} className="p-3 bg-muted/20 border-l-4 border-l-primary/50">
            <div className="flex items-center gap-2 mb-2">
              {block.resolution === 'skip' ? (
                <X className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Check className="w-4 h-4 text-primary" />
              )}
              <span className="text-sm font-medium">
                {block.resolution === 'skip' ? 'Skipped' : block.resolution === 'custom' ? 'Custom edit' : 'Included'} {block.resolution !== 'custom' ? `from ${version.name}` : ''}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto text-xs h-6"
                onClick={() => setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, resolved: false, resolution: undefined, customContent: undefined } : b))}
              >
                Undo
              </Button>
            </div>
            {block.resolution !== 'skip' && (
              <p className="text-sm text-muted-foreground line-clamp-2">{resolvedContent}</p>
            )}
          </Card>
        );
      }

      // Edit mode for added block
      if (isEditing) {
        return (
          <Card 
            key={block.id} 
            id={`block-${block.id}`}
            className="p-4 border-2 border-primary ring-2 ring-primary/20"
          >
            <div className="flex items-center gap-2 mb-3">
              <Pencil className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">EDITING</span>
              <Badge variant="outline" className="text-xs ml-auto">
                {getWordCount(editContent)} words
              </Badge>
            </div>
            
            <Collapsible className="mb-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-7">
                  <ChevronRight className="w-3 h-3 mr-1" />
                  Original from {version.name}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className={`p-2 mt-1 text-xs ${isA ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-purple-50 dark:bg-purple-950/30'}`}>
                  {content}
                </Card>
              </CollapsibleContent>
            </Collapsible>
            
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[120px] mb-3 font-serif"
              placeholder="Enter your custom text..."
              autoFocus
            />
            
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => saveEdit(block.id)}>
                <Save className="w-3 h-3 mr-1" /> Save Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button size="sm" variant="outline" className="ml-auto text-xs h-7" onClick={() => setEditContent(content || '')}>
                Reset to Original
              </Button>
            </div>
          </Card>
        );
      }
      
      return (
        <Card 
          key={block.id} 
          id={`block-${block.id}`}
          className={`p-4 border-2 ${isCurrentConflict ? 'ring-2 ring-primary/20' : ''} ${colorClasses}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Plus className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold">NEW in {version.name}</span>
            <Badge variant="outline" className="text-xs">{wordCount} words</Badge>
            {isCurrentConflict && (
              <Badge className="bg-primary text-white ml-auto">Current</Badge>
            )}
          </div>
          
          <p className="text-sm mb-3 leading-relaxed">{content}</p>
          
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="default" 
              className="flex-1"
              onClick={() => resolveBlock(block.id, isA ? 'a' : 'b')}
            >
              <Check className="w-3 h-3 mr-1" /> Include
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => startEditing(block.id, content || '')}
            >
              <Pencil className="w-3 h-3 mr-1" /> Edit
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => resolveBlock(block.id, 'skip')}
            >
              <X className="w-3 h-3 mr-1" /> Skip
            </Button>
          </div>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Summary Header */}
      <Card className="p-4 mb-4 bg-gradient-to-r from-muted/50 to-muted/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Merge Summary
          </h3>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowKeyboardHelp(prev => !prev)}
              className="text-xs"
            >
              <Keyboard className="w-3 h-3 mr-1" />
              Shortcuts
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-muted-foreground">{stats.unchanged} unchanged</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-muted-foreground">
              {stats.resolvedConflicts}/{stats.conflicts} conflicts
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" />
            <span className="text-muted-foreground">{stats.additionsA} new in A</span>
          </div>
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-purple-600" />
            <span className="text-muted-foreground">{stats.additionsB} new in B</span>
          </div>
        </div>

        {stats.totalNeedingDecision > 0 && (
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">{stats.totalResolved}</span>
              <span className="text-muted-foreground"> of </span>
              <span className="font-medium">{stats.totalNeedingDecision}</span>
              <span className="text-muted-foreground"> decisions made</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={jumpToPrevConflict} disabled={unresolvedConflicts.length === 0}>
                <ArrowUp className="w-3 h-3 mr-1" /> Prev
              </Button>
              <Button size="sm" variant="outline" onClick={jumpToNextConflict} disabled={unresolvedConflicts.length === 0}>
                Next <ArrowDown className="w-3 h-3 ml-1" />
              </Button>
              <Button size="sm" variant="secondary" onClick={acceptAllFromA}>
                Accept all A
              </Button>
              <Button size="sm" variant="secondary" onClick={acceptAllFromB}>
                Accept all B
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Keyboard Help */}
      {showKeyboardHelp && (
        <Card className="p-3 mb-4 bg-muted/50">
          <h4 className="text-sm font-medium mb-2">Keyboard Shortcuts</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><kbd className="bg-background px-1 rounded">J</kbd> or <kbd className="bg-background px-1 rounded">↓</kbd> — Next conflict</div>
            <div><kbd className="bg-background px-1 rounded">K</kbd> or <kbd className="bg-background px-1 rounded">↑</kbd> — Previous conflict</div>
            <div><kbd className="bg-background px-1 rounded">1</kbd> — Select version A</div>
            <div><kbd className="bg-background px-1 rounded">2</kbd> — Select version B</div>
            <div><kbd className="bg-background px-1 rounded">3</kbd> — Use both versions</div>
            <div><kbd className="bg-background px-1 rounded">E</kbd> — Edit current conflict</div>
            <div><kbd className="bg-background px-1 rounded">S</kbd> — Skip / exclude</div>
            <div><kbd className="bg-background px-1 rounded">Esc</kbd> — Cancel editing</div>
            <div><kbd className="bg-background px-1 rounded">Shift+A</kbd> — Accept all from A</div>
            <div><kbd className="bg-background px-1 rounded">Shift+B</kbd> — Accept all from B</div>
          </div>
        </Card>
      )}

      {/* Version Labels */}
      <div className="flex gap-4 mb-3">
        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 border-blue-300">
          A: {versionA.name} <span className="text-muted-foreground ml-1">by {versionA.author}</span>
        </Badge>
        <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/30 border-purple-300">
          B: {versionB.name} <span className="text-muted-foreground ml-1">by {versionB.author}</span>
        </Badge>
      </div>

      {/* Blocks */}
      <ScrollArea className="flex-1">
        <div className="space-y-3 pr-4">
          {blocks.map((block, index) => renderBlock(block, index))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SmartMergeView;
