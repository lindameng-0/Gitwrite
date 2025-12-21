import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquarePlus, 
  Check, 
  X, 
  Clock,
  CheckCircle,
  XCircle,
  User,
  Trash2
} from 'lucide-react';
import type { DraftSuggestion } from '@/hooks/useDraftCollaboration';

interface SuggestionsSidebarProps {
  suggestions: DraftSuggestion[];
  isDraftOwner: boolean;
  currentUserId?: string;
  onAccept: (suggestionId: string) => Promise<boolean>;
  onReject: (suggestionId: string) => Promise<boolean>;
  onDelete: (suggestionId: string) => Promise<boolean>;
  onApplySuggestion?: (suggestion: DraftSuggestion) => void;
}

const SuggestionsSidebar: React.FC<SuggestionsSidebarProps> = ({
  suggestions,
  isDraftOwner,
  currentUserId,
  onAccept,
  onReject,
  onDelete,
  onApplySuggestion
}) => {
  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const resolvedSuggestions = suggestions.filter(s => s.status !== 'pending');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const SuggestionCard = ({ suggestion }: { suggestion: DraftSuggestion }) => {
    const isMysuggestion = suggestion.user_id === currentUserId;
    const canDelete = isMysuggestion && suggestion.status === 'pending';

    return (
      <Card className="p-3 bg-card border border-border">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{suggestion.author_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{formatTime(suggestion.created_at)}</span>
            {getStatusBadge(suggestion.status)}
          </div>
        </div>

        {/* Original Text (if provided) */}
        {suggestion.original_text && (
          <div className="mb-2 p-2 bg-red-50 dark:bg-red-950/20 rounded border-l-2 border-red-300 dark:border-red-700">
            <span className="text-xs text-muted-foreground block mb-1">Original:</span>
            <p className="text-sm text-foreground line-through opacity-70">{suggestion.original_text}</p>
          </div>
        )}

        {/* Suggested Text */}
        <div className="mb-3 p-2 bg-green-50 dark:bg-green-950/20 rounded border-l-2 border-green-300 dark:border-green-700">
          <span className="text-xs text-muted-foreground block mb-1">Suggestion:</span>
          <p className="text-sm text-foreground">{suggestion.suggestion_text}</p>
        </div>

        {/* Actions */}
        {suggestion.status === 'pending' && (
          <div className="flex items-center gap-2">
            {isDraftOwner && (
              <>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    onAccept(suggestion.id);
                    onApplySuggestion?.(suggestion);
                  }}
                >
                  <Check className="w-3 h-3 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => onReject(suggestion.id)}
                >
                  <X className="w-3 h-3 mr-1" />
                  Reject
                </Button>
              </>
            )}
            {canDelete && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-destructive hover:text-destructive ml-auto"
                onClick={() => onDelete(suggestion.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}

        {/* Resolved info */}
        {suggestion.resolved_at && suggestion.resolved_by && (
          <p className="text-xs text-muted-foreground mt-2">
            {suggestion.status === 'accepted' ? 'Accepted' : 'Rejected'} by {suggestion.resolved_by}
          </p>
        )}
      </Card>
    );
  };

  if (suggestions.length === 0) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-center">
        <MessageSquarePlus className="w-10 h-10 text-muted-foreground mb-3" />
        <h3 className="text-sm font-medium text-foreground mb-1">No Suggestions Yet</h3>
        <p className="text-xs text-muted-foreground">
          {isDraftOwner 
            ? "Other writers can suggest changes to your draft"
            : "Select text and click 'Suggest' to propose changes"
          }
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <MessageSquarePlus className="w-4 h-4" />
          Suggestions
          {pendingSuggestions.length > 0 && (
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs ml-auto">
              {pendingSuggestions.length} pending
            </Badge>
          )}
        </h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Pending suggestions first */}
          {pendingSuggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Pending Review
              </h4>
              {pendingSuggestions.map(suggestion => (
                <SuggestionCard key={suggestion.id} suggestion={suggestion} />
              ))}
            </div>
          )}

          {/* Resolved suggestions */}
          {resolvedSuggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Resolved
              </h4>
              {resolvedSuggestions.map(suggestion => (
                <SuggestionCard key={suggestion.id} suggestion={suggestion} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SuggestionsSidebar;
