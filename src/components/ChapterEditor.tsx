
import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, Save, Send, MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { ChapterWithReviews } from '@/hooks/useStoryData';

interface ChapterEditorProps {
  chapter: ChapterWithReviews | null;
  onContentChange: (chapterId: string, content: string) => Promise<void>;
  onSubmitForReview: (chapterId: string) => Promise<void>;
  onReviewChapter: (chapterId: string, status: 'approved' | 'changes_requested', feedback?: string) => Promise<void>;
  isSaving: boolean;
}

const ChapterEditor: React.FC<ChapterEditorProps> = ({
  chapter,
  onContentChange,
  onSubmitForReview,
  onReviewChapter,
  isSaving
}) => {
  const [localContent, setLocalContent] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (chapter) {
      setLocalContent(chapter.content);
    }
  }, [chapter]);

  const handleSave = async () => {
    if (!chapter) return;
    await onContentChange(chapter.id, localContent);
  };

  const handleSubmitForReview = async () => {
    if (!chapter) return;
    await onSubmitForReview(chapter.id);
  };

  const handleReview = async (status: 'approved' | 'changes_requested') => {
    if (!chapter) return;
    await onReviewChapter(chapter.id, status, reviewFeedback);
    setReviewFeedback('');
    setShowReviewForm(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'review': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'merged': return <CheckCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'review': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'merged': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!chapter) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Chapter Selected</h3>
          <p className="text-gray-600">Select a chapter from the sidebar to start editing</p>
        </div>
      </div>
    );
  }

  const wordCount = localContent.split(' ').filter(word => word.length > 0).length;

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chapter Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getStatusIcon(chapter.status)}
              <h1 className="text-xl font-semibold text-gray-900">{chapter.title}</h1>
            </div>
            <Badge className={`${getStatusColor(chapter.status)} flex items-center gap-1`}>
              {chapter.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{wordCount} words</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            {chapter.status === 'draft' && (
              <Button 
                size="sm" 
                onClick={handleSubmitForReview}
                className="bg-story-600 hover:bg-story-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit for Review
              </Button>
            )}
            {chapter.status === 'review' && (
              <Button 
                size="sm" 
                onClick={() => setShowReviewForm(!showReviewForm)}
                variant="outline"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Review
              </Button>
            )}
          </div>
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="space-y-3">
              <Textarea
                placeholder="Add feedback (optional)..."
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleReview('approved')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleReview('changes_requested')}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Request Changes
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowReviewForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chapter Content */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <Textarea
            ref={textareaRef}
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            className="w-full h-full min-h-[600px] story-editor text-lg leading-relaxed resize-none border-0 shadow-none focus:ring-0 p-8 bg-white rounded-lg shadow-sm"
            placeholder="Begin writing this chapter..."
          />
        </div>
      </div>

      {/* Chapter Reviews */}
      {chapter.reviews.length > 0 && (
        <div className="border-t border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Reviews & Feedback</h3>
          <div className="space-y-4">
            {chapter.reviews.map((review) => (
              <Card key={review.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{review.reviewer_name}</span>
                    <Badge className={review.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {review.status === 'approved' ? 'Approved' : 'Changes Requested'}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                {review.feedback && (
                  <p className="text-gray-700">{review.feedback}</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChapterEditor;
