import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  Check, 
  X, 
  Clock,
  CheckCircle,
  XCircle,
  User,
  Trash2,
  UserCog
} from 'lucide-react';
import type { DraftCollaborator } from '@/hooks/useDraftCollaboration';

interface DraftCollaboratorsPanelProps {
  collaborators: DraftCollaborator[];
  isDraftOwner: boolean;
  onApprove: (collaboratorId: string) => Promise<boolean>;
  onReject: (collaboratorId: string) => Promise<boolean>;
  onRemove: (collaboratorId: string) => Promise<boolean>;
}

const DraftCollaboratorsPanel: React.FC<DraftCollaboratorsPanelProps> = ({
  collaborators,
  isDraftOwner,
  onApprove,
  onReject,
  onRemove
}) => {
  const pendingRequests = collaborators.filter(c => c.status === 'pending');
  const approvedCollaborators = collaborators.filter(c => c.status === 'approved');
  const rejectedRequests = collaborators.filter(c => c.status === 'rejected');

  const getStatusBadge = (status: string, role: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            {role === 'editor' ? 'Editor' : 'Viewer'}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs">
            <XCircle className="w-3 h-3 mr-1" />
            Denied
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

  const CollaboratorCard = ({ collaborator }: { collaborator: DraftCollaborator }) => (
    <Card className="p-3 bg-card border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">User</p>
            <p className="text-xs text-muted-foreground">
              Requested {collaborator.role} access • {formatTime(collaborator.requested_at)}
            </p>
          </div>
        </div>
        {getStatusBadge(collaborator.status, collaborator.role)}
      </div>

      {/* Actions for draft owner */}
      {isDraftOwner && (
        <div className="flex items-center gap-2 mt-3">
          {collaborator.status === 'pending' && (
            <>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => onApprove(collaborator.id)}
              >
                <Check className="w-3 h-3 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => onReject(collaborator.id)}
              >
                <X className="w-3 h-3 mr-1" />
                Deny
              </Button>
            </>
          )}
          {collaborator.status === 'approved' && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-destructive hover:text-destructive"
              onClick={() => onRemove(collaborator.id)}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Remove Access
            </Button>
          )}
        </div>
      )}
    </Card>
  );

  if (collaborators.length === 0) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-center">
        <Users className="w-10 h-10 text-muted-foreground mb-3" />
        <h3 className="text-sm font-medium text-foreground mb-1">No Collaborators</h3>
        <p className="text-xs text-muted-foreground">
          {isDraftOwner 
            ? "Other writers can request to collaborate on your draft"
            : "No one else is collaborating on this draft"
          }
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <UserCog className="w-4 h-4" />
          Collaborators
          {pendingRequests.length > 0 && (
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs ml-auto">
              {pendingRequests.length} pending
            </Badge>
          )}
        </h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Pending requests first */}
          {pendingRequests.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Access Requests
              </h4>
              {pendingRequests.map(collaborator => (
                <CollaboratorCard key={collaborator.id} collaborator={collaborator} />
              ))}
            </div>
          )}

          {/* Approved collaborators */}
          {approvedCollaborators.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Active Collaborators
              </h4>
              {approvedCollaborators.map(collaborator => (
                <CollaboratorCard key={collaborator.id} collaborator={collaborator} />
              ))}
            </div>
          )}

          {/* Rejected requests (collapsed) */}
          {rejectedRequests.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Denied
              </h4>
              {rejectedRequests.map(collaborator => (
                <CollaboratorCard key={collaborator.id} collaborator={collaborator} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DraftCollaboratorsPanel;
