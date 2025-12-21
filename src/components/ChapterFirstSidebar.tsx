import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Plus, 
  Layers, 
  ChevronDown, 
  ChevronRight, 
  Lock,
  CheckCircle,
  Clock,
  FilePlus
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { StoryBranchWithMeta, ChapterWithReviews } from '@/hooks/useStoryData';

interface ChapterFirstSidebarProps {
  branches: StoryBranchWithMeta[];
  chapters: ChapterWithReviews[]; // Main branch chapters
  activeBranch: string;
  activeChapter: string;
  onCreateChapter: (title: string, chapterOrder?: number) => Promise<string | null>;
  onSwitchBranch: (branchId: string) => void;
  onSwitchChapter: React.Dispatch<React.SetStateAction<string>>;
  onForkFromChapter?: (name: string, forkChapterId: string) => Promise<string | null>;
  currentUserName?: string;
  isAdmin?: boolean;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'draft': return <FileText className="w-3.5 h-3.5 text-muted-foreground" />;
    case 'review': return <Clock className="w-3.5 h-3.5 text-blue-500" />;
    case 'approved': return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
    case 'merged': return <CheckCircle className="w-3.5 h-3.5 text-primary" />;
    default: return <FileText className="w-3.5 h-3.5 text-muted-foreground" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'bg-muted text-muted-foreground';
    case 'review': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
    case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    case 'merged': return 'bg-primary/10 text-primary';
    default: return 'bg-muted text-muted-foreground';
  }
};

const ChapterFirstSidebar: React.FC<ChapterFirstSidebarProps> = ({
  branches,
  chapters,
  activeBranch,
  activeChapter,
  onCreateChapter,
  onSwitchBranch,
  onSwitchChapter,
  onForkFromChapter,
  currentUserName,
  isAdmin = false
}) => {
  const [isCreatingChapter, setIsCreatingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [forkingChapterId, setForkingChapterId] = useState<string | null>(null);
  const [newBranchName, setNewBranchName] = useState('');

  // Get main branch
  const mainBranch = branches.find(b => b.is_main);
  const isOnMainBranch = mainBranch?.id === activeBranch;

  // Get branches that forked from each chapter
  const getBranchesForChapter = (chapterId: string) => {
    return branches.filter(b => 
      !b.is_main && b.fork_point_chapter_id === chapterId
    );
  };

  const handleCreateChapter = async () => {
    if (!newChapterTitle.trim()) return;
    
    try {
      await onCreateChapter(newChapterTitle);
      setNewChapterTitle('');
      setIsCreatingChapter(false);
    } catch (error) {
      console.error('Error creating chapter:', error);
    }
  };

  const handleForkFromChapter = async (chapterId: string) => {
    if (!newBranchName.trim() || !onForkFromChapter) return;
    
    try {
      await onForkFromChapter(newBranchName, chapterId);
      setNewBranchName('');
      setForkingChapterId(null);
    } catch (error) {
      console.error('Error forking from chapter:', error);
    }
  };

  const toggleChapterExpanded = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  return (
    <div className="w-full bg-background border-r border-border h-full min-h-0 flex flex-col">
      <div className="p-4 flex-1 min-h-0 overflow-y-auto">
        {/* Published Story Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500" />
            <h2 className="text-lg font-semibold text-foreground">Published Version</h2>
          </div>
          {isOnMainBranch && (
            <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
              Active
            </Badge>
          )}
        </div>

        {/* Switch to Published Version Button (if not on main) */}
        {!isOnMainBranch && mainBranch && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mb-4"
            onClick={() => onSwitchBranch(mainBranch.id)}
          >
            <Lock className="w-4 h-4 mr-2" />
            View Published Version
          </Button>
        )}

        {/* Chapters Section */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Chapters
          </h3>
          {isAdmin && (
            <Button
              onClick={() => setIsCreatingChapter(true)}
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>

        {isCreatingChapter && (
          <div className="mb-3 p-3 bg-muted/50 rounded-lg border border-border">
            <Input
              placeholder="Chapter title..."
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              className="mb-2 h-8 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateChapter()}
            />
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs" onClick={handleCreateChapter}>
                Create
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 text-xs"
                onClick={() => {
                  setIsCreatingChapter(false);
                  setNewChapterTitle('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Chapter List */}
        <div className="space-y-1">
          {chapters.map((chapter) => {
            const chapterBranches = getBranchesForChapter(chapter.id);
            const hasBranches = chapterBranches.length > 0;
            const isExpanded = expandedChapters.has(chapter.id);
            const isChapterActive = chapter.id === activeChapter && isOnMainBranch;

            return (
              <div key={chapter.id}>
                <Collapsible open={isExpanded} onOpenChange={() => hasBranches && toggleChapterExpanded(chapter.id)}>
                  <div
                    className={`group flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all ${
                      isChapterActive 
                        ? 'bg-primary/10 border border-primary/30' 
                        : 'hover:bg-muted/50 border border-transparent'
                    }`}
                    onClick={() => {
                      if (mainBranch) {
                        onSwitchBranch(mainBranch.id);
                      }
                      onSwitchChapter(chapter.id);
                    }}
                  >
                    {/* Expand Toggle */}
                    {hasBranches ? (
                      <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    ) : (
                      <div className="w-5" />
                    )}

                    {/* Chapter Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">
                          {chapter.chapter_order}.
                        </span>
                        <span className="text-sm font-medium text-foreground truncate">
                          {chapter.title}
                        </span>
                      </div>
                    </div>

                    {/* Status & Drafts Indicator */}
                    <div className="flex items-center gap-1.5">
                      {hasBranches && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                          <Layers className="w-3 h-3 mr-1" />
                          {chapterBranches.length} {chapterBranches.length === 1 ? 'draft' : 'drafts'}
                        </Badge>
                      )}
                      {getStatusIcon(chapter.status)}
                    </div>

                    {/* Create Draft Button (on hover) */}
                    {onForkFromChapter && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setForkingChapterId(chapter.id);
                        }}
                        title="Create new draft from this chapter"
                      >
                        <FilePlus className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>

                  {/* Create Draft Form */}
                  {forkingChapterId === chapter.id && (
                    <div className="ml-7 mt-1 p-2 bg-muted/30 rounded-lg border border-border">
                      <Input
                        placeholder="Draft name..."
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        className="mb-2 h-7 text-xs"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleForkFromChapter(chapter.id)}
                      />
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          className="h-6 text-xs px-2" 
                          onClick={() => handleForkFromChapter(chapter.id)}
                        >
                          <FilePlus className="w-3 h-3 mr-1" />
                          Create Draft
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 text-xs px-2"
                          onClick={() => {
                            setForkingChapterId(null);
                            setNewBranchName('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Drafts for this chapter */}
                  <CollapsibleContent>
                    <div className="ml-7 mt-1 space-y-1">
                      {chapterBranches.map((branch) => {
                        const isBranchActive = branch.id === activeBranch;
                        
                        return (
                          <div
                            key={branch.id}
                            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all ${
                              isBranchActive 
                                ? 'bg-accent/50 border border-accent' 
                                : 'hover:bg-muted/30 border border-transparent'
                            }`}
                            onClick={() => onSwitchBranch(branch.id)}
                          >
                            <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm text-foreground truncate flex-1">
                              {branch.name}
                            </span>
                            {isBranchActive && (
                              <Badge variant="secondary" className="text-xs h-5 px-1.5">
                                Active
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          })}
        </div>

        {chapters.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No chapters yet</p>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setIsCreatingChapter(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Create First Chapter
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChapterFirstSidebar;
