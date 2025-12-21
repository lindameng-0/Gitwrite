import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle,
  User,
  FileText,
  Trophy,
  GitBranch
} from 'lucide-react';
import type { ConflictGroup, MergeRequestWithDetails } from '@/hooks/useMergeRequests';
import type { ChapterWithReviews } from '@/hooks/useStoryData';

interface ConflictComparePanelProps {
  group: ConflictGroup;
  onLoadChaptersFromBranch: (branchId: string) => Promise<ChapterWithReviews[]>;
  onSelectWinner: (requestId: string) => Promise<void>;
}

interface VersionData {
  request: MergeRequestWithDetails;
  chapters: ChapterWithReviews[];
  wordCount: number;
  approvedCount: number;
}

const ConflictComparePanel: React.FC<ConflictComparePanelProps> = ({
  group,
  onLoadChaptersFromBranch,
  onSelectWinner
}) => {
  const [versions, setVersions] = useState<VersionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadAllVersions();
  }, [group]);

  const loadAllVersions = async () => {
    setLoading(true);
    try {
      const versionData = await Promise.all(
        group.requests.map(async (request) => {
          const chapters = await onLoadChaptersFromBranch(request.source_branch_id);
          const approvedChapters = chapters.filter(c => c.status === 'approved');
          const wordCount = approvedChapters.reduce((acc, c) => {
            const text = c.content.replace(/<[^>]*>/g, '').trim();
            return acc + (text ? text.split(/\s+/).length : 0);
          }, 0);

          return {
            request,
            chapters,
            wordCount,
            approvedCount: approvedChapters.length
          };
        })
      );
      setVersions(versionData);
    } catch (error) {
      console.error('Error loading versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWinner = async () => {
    if (!selectedVersion) return;
    setIsProcessing(true);
    try {
      await onSelectWinner(selectedVersion);
    } finally {
      setIsProcessing(false);
    }
  };

  const getContentPreview = (chapters: ChapterWithReviews[]) => {
    const approved = chapters.filter(c => c.status === 'approved');
    if (approved.length === 0) return 'No approved content';
    
    const firstChapter = approved[0];
    const text = firstChapter.content.replace(/<[^>]*>/g, '').trim();
    return text.slice(0, 200) + (text.length > 200 ? '...' : '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {versions.map((version, index) => (
          <Card
            key={version.request.id}
            className={`p-4 cursor-pointer transition-all ${
              selectedVersion === version.request.id 
                ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                : 'hover:border-muted-foreground/50'
            }`}
            onClick={() => setSelectedVersion(version.request.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                  index === 1 ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                }`}>
                  {String.fromCharCode(65 + index)}
                </div>
                <div>
                  <p className="font-medium text-sm">{version.request.source_branch?.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {version.request.author_name}
                  </p>
                </div>
              </div>
              {selectedVersion === version.request.id && (
                <Badge className="bg-primary text-primary-foreground">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Selected
                </Badge>
              )}
            </div>

            <div className="flex gap-4 mb-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {version.approvedCount} chapter{version.approvedCount !== 1 ? 's' : ''}
              </span>
              <span>{version.wordCount.toLocaleString()} words</span>
            </div>

            <ScrollArea className="h-32">
              <div className="text-sm text-muted-foreground">
                {version.chapters.filter(c => c.status === 'approved').map((chapter, idx) => (
                  <div key={chapter.id} className="mb-2">
                    <span className="font-medium text-foreground">{chapter.title}:</span>{' '}
                    <span className="line-clamp-2">
                      {chapter.content.replace(/<[^>]*>/g, '').slice(0, 100)}...
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        ))}
      </div>

      {versions.length > 0 && (
        <div className="flex justify-end pt-4 border-t border-border">
          <Button
            onClick={handleSelectWinner}
            disabled={!selectedVersion || isProcessing}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
          >
            <Trophy className="w-4 h-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Select as Winner'}
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        The winning version will be approved for publishing. Other versions will be marked as superseded.
      </p>
    </div>
  );
};

export default ConflictComparePanel;
