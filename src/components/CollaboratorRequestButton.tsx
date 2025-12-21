import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserPlus, Clock, CheckCircle, XCircle, Users } from 'lucide-react';
import type { DraftCollaborator } from '@/hooks/useDraftCollaboration';

interface CollaboratorRequestButtonProps {
  myStatus: DraftCollaborator | null;
  onRequestAccess: (role: 'editor' | 'viewer') => Promise<boolean>;
  draftOwnerName?: string;
  disabled?: boolean;
}

const CollaboratorRequestButton: React.FC<CollaboratorRequestButtonProps> = ({
  myStatus,
  onRequestAccess,
  draftOwnerName,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRequest = async (role: 'editor' | 'viewer') => {
    setIsLoading(true);
    try {
      const success = await onRequestAccess(role);
      if (success) {
        setIsOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Already a collaborator
  if (myStatus?.status === 'approved') {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircle className="w-3 h-3 mr-1" />
        Collaborator ({myStatus.role})
      </Badge>
    );
  }

  // Request pending
  if (myStatus?.status === 'pending') {
    return (
      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
        <Clock className="w-3 h-3 mr-1" />
        Access Requested
      </Badge>
    );
  }

  // Request rejected
  if (myStatus?.status === 'rejected') {
    return (
      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
        <XCircle className="w-3 h-3 mr-1" />
        Request Denied
      </Badge>
    );
  }

  // No request yet - show button
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Request Edit Access
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Request Collaborator Access
          </DialogTitle>
          <DialogDescription>
            Request to collaborate on {draftOwnerName ? `${draftOwnerName}'s` : 'this'} draft. 
            The draft owner will review your request.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          <Button
            onClick={() => handleRequest('editor')}
            disabled={isLoading}
            className="justify-start h-auto py-3"
          >
            <div className="text-left">
              <div className="font-medium">Request Editor Access</div>
              <div className="text-xs opacity-80">Full editing permissions on this draft</div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleRequest('viewer')}
            disabled={isLoading}
            className="justify-start h-auto py-3"
          >
            <div className="text-left">
              <div className="font-medium">Request Viewer Access</div>
              <div className="text-xs opacity-80">Read-only access with commenting</div>
            </div>
          </Button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CollaboratorRequestButton;
