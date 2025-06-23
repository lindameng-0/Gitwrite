
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Clock, FileText, RotateCcw, User } from 'lucide-react';
import type { SavePoint } from '@/hooks/useStoryData';

interface SavePointRestorationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  savePoint: SavePoint | null;
  onRestore: (savePointId: string) => Promise<boolean>;
}

const SavePointRestorationDialog: React.FC<SavePointRestorationDialogProps> = ({
  isOpen,
  onClose,
  savePoint,
  onRestore
}) => {
  const [isRestoring, setIsRestoring] = useState(false);

  if (!savePoint) return null;

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const success = await onRestore(savePoint.id);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Restoration failed:', error);
    } finally {
      setIsRestoring(false);
    }
  };

  const getSnapshotSummary = () => {
    try {
      const data = typeof savePoint.snapshot_data === 'string' 
        ? JSON.parse(savePoint.snapshot_data) 
        : savePoint.snapshot_data;
      return {
        chapterCount: data.chapters?.length || 0,
        wordCount: data.total_word_count || 0,
        approvedChapters: data.chapters?.filter((c: any) => c.status === 'approved').length || 0,
        chapters: data.chapters || []
      };
    } catch (error) {
      return { chapterCount: 0, wordCount: 0, approvedChapters: 0, chapters: [] };
    }
  };

  const summary = getSnapshotSummary();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-blue-600" />
            Restore Save Point
          </DialogTitle>
          <DialogDescription>
            This will restore your story to the state captured in this save point.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Save Point Info */}
          <Card className="p-4">
            <div className="flex items-start gap-3 mb-4">
              <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{savePoint.title}</h3>
                {savePoint.description && (
                  <p className="text-sm text-gray-600 mb-2">{savePoint.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {savePoint.author_name}
                  </span>
                  <span>{new Date(savePoint.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.chapterCount}</div>
                <div className="text-xs text-gray-500">Chapters</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.wordCount.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Words</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{summary.approvedChapters}</div>
                <div className="text-xs text-gray-500">Approved</div>
              </div>
            </div>
          </Card>

          {/* Chapter Preview */}
          {summary.chapters.length > 0 && (
            <Card className="p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Chapters in this Save Point
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {summary.chapters.slice(0, 10).map((chapter: any, index: number) => (
                  <div key={chapter.id || index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Chapter {index + 1}</span>
                      <span className="text-sm text-gray-600">{chapter.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={chapter.status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                        {chapter.status}
                      </Badge>
                      <span className="text-xs text-gray-500">{chapter.word_count} words</span>
                    </div>
                  </div>
                ))}
                {summary.chapters.length > 10 && (
                  <div className="text-center text-sm text-gray-500 py-2">
                    ... and {summary.chapters.length - 10} more chapters
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Warning */}
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900 mb-1">Important Warning</h4>
                <p className="text-sm text-amber-800">
                  Restoring this save point will replace ALL current chapters with the chapters from this save point.
                  Any work done since this save point was created will be lost unless you create a save point first.
                </p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleRestore}
              disabled={isRestoring}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isRestoring ? 'Restoring...' : 'Restore to This Point'}
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

export default SavePointRestorationDialog;
