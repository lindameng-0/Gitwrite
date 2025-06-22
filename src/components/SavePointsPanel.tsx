
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, Plus, GitCommit, Calendar, User } from 'lucide-react';
import type { SavePoint } from '@/hooks/useStoryData';

interface SavePointsPanelProps {
  savePoints: SavePoint[];
  onCreateSavePoint: (title: string, description?: string) => Promise<string | null>;
}

const SavePointsPanel: React.FC<SavePointsPanelProps> = ({
  savePoints,
  onCreateSavePoint
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    
    setIsCreating(true);
    try {
      await onCreateSavePoint(title, description);
      setTitle('');
      setDescription('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create save point:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const getSnapshotSummary = (snapshotData: any) => {
    try {
      const data = typeof snapshotData === 'string' ? JSON.parse(snapshotData) : snapshotData;
      return {
        chapterCount: data.chapters?.length || 0,
        wordCount: data.total_word_count || 0,
        approvedChapters: data.chapters?.filter((c: any) => c.status === 'approved').length || 0
      };
    } catch (error) {
      return { chapterCount: 0, wordCount: 0, approvedChapters: 0 };
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Save className="w-5 h-5 text-story-600" />
            Save Points
          </h2>
          <Button
            onClick={() => setShowCreateForm(true)}
            size="sm"
            className="bg-story-600 hover:bg-story-700"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600">Story snapshots & milestones</p>
      </div>

      <div className="p-4">
        {showCreateForm && (
          <Card className="p-4 mb-4 bg-story-50 border-story-200">
            <div className="space-y-3">
              <Input
                placeholder="Save point title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleCreate()}
              />
              <Textarea
                placeholder="Description (optional)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[60px]"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreate} 
                  size="sm"
                  disabled={!title.trim() || isCreating}
                  className="bg-story-600 hover:bg-story-700"
                >
                  <GitCommit className="w-4 h-4 mr-2" />
                  {isCreating ? 'Creating...' : 'Create'}
                </Button>
                <Button 
                  onClick={() => setShowCreateForm(false)} 
                  variant="outline" 
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-3">
          {savePoints.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <GitCommit className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No save points yet</p>
              <p className="text-xs text-gray-400">Create checkpoints to track your story's progress</p>
            </div>
          ) : (
            savePoints.map((savePoint) => {
              const summary = getSnapshotSummary(savePoint.snapshot_data);
              return (
                <Card key={savePoint.id} className="p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-story-600 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                        {savePoint.title}
                      </h3>
                      {savePoint.description && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {savePoint.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        <span>{savePoint.author_name}</span>
                        <Calendar className="w-3 h-3 ml-1" />
                        <span>{new Date(savePoint.created_at).toLocaleDateString()}</span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {summary.chapterCount} chapters
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {summary.wordCount} words
                        </Badge>
                        {summary.approvedChapters > 0 && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            {summary.approvedChapters} approved
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default SavePointsPanel;
