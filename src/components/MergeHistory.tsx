
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch, FileText, Clock, User, ArrowRight } from 'lucide-react';

interface MergeRecord {
  id: string;
  type: 'chapter' | 'story_version';
  sourceVersionName: string;
  targetVersionName: string;
  chapterTitle?: string;
  mergeNote?: string;
  authorName: string;
  timestamp: string;
}

interface MergeHistoryProps {
  mergeHistory: MergeRecord[];
}

const MergeHistory: React.FC<MergeHistoryProps> = ({ mergeHistory }) => {
  if (mergeHistory.length === 0) {
    return (
      <Card className="p-6 text-center">
        <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Merge History</h3>
        <p className="text-gray-600">
          Merge operations will appear here once you start combining story versions and chapters.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Clock className="w-5 h-5 text-indigo-600" />
        Merge History
      </h3>
      
      <div className="space-y-3">
        {mergeHistory.map((record) => (
          <Card key={record.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {record.type === 'chapter' ? (
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                ) : (
                  <GitBranch className="w-5 h-5 text-purple-600 mt-0.5" />
                )}
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={record.type === 'chapter' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                      {record.type === 'chapter' ? 'Chapter Merge' : 'Story Version Merge'}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(record.timestamp).toLocaleDateString()} at {new Date(record.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900">{record.sourceVersionName}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{record.targetVersionName}</span>
                  </div>
                  
                  {record.chapterTitle && (
                    <p className="text-sm text-gray-600 mb-2">
                      Chapter: <strong>{record.chapterTitle}</strong>
                    </p>
                  )}
                  
                  {record.mergeNote && (
                    <p className="text-sm text-gray-600 italic">
                      "{record.mergeNote}"
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <User className="w-4 h-4" />
                <span>{record.authorName}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MergeHistory;
