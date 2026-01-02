import React, { useState } from 'react';
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
  FilePlus,
  Pencil,
  Trash2,
  GitBranch,
  Play,
  Archive
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { StoryBranchWithMeta, ChapterWithReviews, BranchStatus } from '@/hooks/useStoryData';

interface ChapterFirstSidebarProps {
  branches: StoryBranchWithMeta[];
  chapters: ChapterWithReviews[]; // Current branch chapters (for editing)
  mainBranchChapters: ChapterWithReviews[]; // Always main branch chapters (for sidebar structure)
  activeBranch: string;
  activeChapter: string;
  onCreateChapter: (title: string, chapterOrder?: number) => Promise<string | null>;
  onSwitchBranch: (branchId: string) => void;
  onSwitchChapter: React.Dispatch<React.SetStateAction<string>>;
  onForkFromChapter?: (name: string, forkChapterId: string) => Promise<string | null>;
  onForkFromBranch?: (name: string, sourceBranchId: string) => Promise<string | null>;
  onContinueBranch?: (branchId: string) => Promise<string | null>;
  onDeleteBranch?: (branchId: string) => Promise<boolean>;
  onArchiveBranch?: (branchId: string) => Promise<boolean>;
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

const getBranchStatusBadge = (status: BranchStatus) => {
  switch (status) {
    case 'proposed':
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 text-xs">Under Review</Badge>;
    case 'alternate':
      return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 text-xs">Alternate</Badge>;
    case 'archived':
      return <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-xs">Archived</Badge>;
    default:
      return null;
  }
};

const ChapterFirstSidebar: React.FC<ChapterFirstSidebarProps> = ({
  branches,
  chapters,
  mainBranchChapters,
  activeBranch,
  activeChapter,
  onCreateChapter,
  onSwitchBranch,
  onSwitchChapter,
  onForkFromChapter,
  onForkFromBranch,
  onContinueBranch,
  onDeleteBranch,
  onArchiveBranch,
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
  const currentBranch = branches.find(b => b.id === activeBranch);

  // Use main branch chapters for sidebar structure (always visible)
  const sidebarChapters = mainBranchChapters;

  // Get the current draft's chapters indexed by order for comparison
  const currentDraftChaptersByOrder = new Map(
    chapters.map(c => [c.chapter_order, c])
  );

  // Get branches that forked from each chapter (by fork_point_chapter_id matching main chapter ids)
  const getBranchesForChapter = (chapterId: string, chapterOrder: number) => {
    return branches.filter(b => 
      !b.is_main && (b.fork_point_chapter_id === chapterId || b.fork_point_order === chapterOrder)
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
          <Button
            onClick={() => setIsCreatingChapter(true)}
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            title="Add new chapter"
          >
            <Plus className="w-4 h-4" />
          </Button>
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

        {/* Chapter List - Always shows main branch structure */}
        <div className="space-y-1">
          {sidebarChapters.map((chapter) => {
            const chapterBranches = getBranchesForChapter(chapter.id, chapter.chapter_order);
            const hasBranches = chapterBranches.length > 0;
            const isExpanded = expandedChapters.has(chapter.id);
            
            // Check if this chapter is active (either on main branch, or matching order in current draft)
            const isChapterActiveOnMain = chapter.id === activeChapter && isOnMainBranch;
            const draftChapter = currentDraftChaptersByOrder.get(chapter.chapter_order);
            const isChapterActiveOnDraft = !isOnMainBranch && draftChapter?.id === activeChapter;
            const isChapterActive = isChapterActiveOnMain || isChapterActiveOnDraft;
            
            // Check if current draft is viewing this chapter's fork point
            const isDraftForkPoint = !isOnMainBranch && currentBranch?.fork_point_order === chapter.chapter_order;

            return (
              <div key={chapter.id}>
                <Collapsible open={isExpanded} onOpenChange={() => hasBranches && toggleChapterExpanded(chapter.id)}>
                  <div
                    className={`group flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all ${
                      isChapterActive 
                        ? 'bg-primary/10 border border-primary/30' 
                        : isDraftForkPoint
                          ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-muted/50 border border-transparent'
                    }`}
                    onClick={() => {
                      if (isOnMainBranch) {
                        // On main branch, just switch chapter
                        onSwitchChapter(chapter.id);
                      } else if (draftChapter) {
                        // On draft, switch to the draft's version of this chapter
                        onSwitchChapter(draftChapter.id);
                      } else {
                        // No draft version exists, switch to main branch and show this chapter
                        if (mainBranch) {
                          onSwitchBranch(mainBranch.id);
                        }
                        onSwitchChapter(chapter.id);
                      }
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
                        {/* Indicator if viewing draft version */}
                        {!isOnMainBranch && draftChapter && (
                          <Pencil className="w-3 h-3 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* Status & Drafts Indicator */}
                    <div className="flex items-center gap-1.5">
                      {isDraftForkPoint && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                          Fork Point
                        </Badge>
                      )}
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
                        const isOwnBranch = branch.author_name === currentUserName;
                        const branchStatus = branch.status as BranchStatus;
                        
                        // Status-based styling
                        let borderClass = 'border-transparent';
                        if (isBranchActive) borderClass = 'border-accent';
                        else if (branchStatus === 'proposed') borderClass = 'border-yellow-300 dark:border-yellow-700';
                        else if (branchStatus === 'alternate') borderClass = 'border-purple-300 dark:border-purple-700 border-dashed';
                        
                        return (
                          <ContextMenu key={branch.id}>
                            <ContextMenuTrigger asChild>
                              <div className="group">
                                <div
                                  className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all ${
                                    isBranchActive 
                                      ? 'bg-accent/50' 
                                      : branchStatus === 'alternate'
                                        ? 'bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100/50 dark:hover:bg-purple-900/30'
                                        : 'hover:bg-muted/30'
                                  } border ${borderClass}`}
                                  onClick={() => onSwitchBranch(branch.id)}
                                >
                                  {branchStatus === 'alternate' ? (
                                    <Archive className="w-3.5 h-3.5 text-purple-500" />
                                  ) : branchStatus === 'proposed' ? (
                                    <Clock className="w-3.5 h-3.5 text-yellow-500" />
                                  ) : (
                                    <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                                  )}
                                  <span className="text-sm text-foreground truncate flex-1">
                                    {branch.name}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {getBranchStatusBadge(branchStatus)}
                                    {isBranchActive && (
                                      <Badge variant="secondary" className="text-xs h-5 px-1.5">
                                        Active
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              {/* Archive option - available for drafts and alternates owned by user */}
                              {isOwnBranch && branchStatus !== 'archived' && branchStatus !== 'published' && onArchiveBranch && (
                                <ContextMenuItem onClick={() => onArchiveBranch(branch.id)}>
                                  <Archive className="w-4 h-4 mr-2" />
                                  Archive
                                </ContextMenuItem>
                              )}
                              {/* Delete option - only for own branches */}
                              {isOwnBranch && !branch.is_main && onDeleteBranch && (
                                <>
                                  <ContextMenuSeparator />
                                  <ContextMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => onDeleteBranch(branch.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </ContextMenuItem>
                                </>
                              )}
                              {/* Fork option - for alternates */}
                              {branchStatus === 'alternate' && onForkFromBranch && (
                                <>
                                  <ContextMenuSeparator />
                                  <ContextMenuItem onClick={() => onForkFromBranch(`${branch.name} (fork)`, branch.id)}>
                                    <GitBranch className="w-4 h-4 mr-2" />
                                    Fork from this
                                  </ContextMenuItem>
                                </>
                              )}
                              {/* Continue option - for own alternates */}
                              {branchStatus === 'alternate' && isOwnBranch && onContinueBranch && (
                                <ContextMenuItem onClick={() => onContinueBranch(branch.id)}>
                                  <Play className="w-4 h-4 mr-2" />
                                  Continue writing
                                </ContextMenuItem>
                              )}
                            </ContextMenuContent>
                          </ContextMenu>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          })}
        </div>

        {sidebarChapters.length === 0 && (
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
