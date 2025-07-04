import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useStudios, type Studio, type StudioMember } from '@/hooks/useStudios';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Settings, UserPlus, Crown, Shield, User, Trash2, X } from 'lucide-react';

interface StudioSettingsProps {
  studio: Studio;
  isOpen: boolean;
  onClose: () => void;
}

const StudioSettings = ({ studio, isOpen, onClose }: StudioSettingsProps) => {
  const [members, setMembers] = useState<StudioMember[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { updateStudio, getStudioMembers, inviteMember, removeMember } = useStudios();
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen]);

  const loadMembers = async () => {
    const membersList = await getStudioMembers(studio.id);
    setMembers(membersList);
  };

  const handleUpdateStudio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    const success = await updateStudio(studio.id, {
      name,
      description: description || undefined
    });

    if (success) {
      toast({
        title: 'Studio updated!',
        description: 'Your studio settings have been saved.',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to update studio. Please try again.',
        variant: 'destructive',
      });
    }

    setIsUpdating(false);
  };

  const handleInviteMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsInviting(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const role = formData.get('role') as 'admin' | 'member';

    const success = await inviteMember(studio.id, username, role);

    if (success) {
      toast({
        title: 'Member invited!',
        description: `${username} has been invited to the studio.`,
      });
      loadMembers();
      (e.target as HTMLFormElement).reset();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to invite member. Please check the username and try again.',
        variant: 'destructive',
      });
    }

    setIsInviting(false);
  };

  const handleRemoveMember = async (memberId: string, username: string) => {
    const success = await removeMember(studio.id, memberId);

    if (success) {
      toast({
        title: 'Member removed',
        description: `${username} has been removed from the studio.`,
      });
      loadMembers();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to remove member. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const isOwner = studio.owner_id === profile?.id;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <DialogTitle>Studio Settings</DialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Manage your studio settings and collaborators.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Studio Details */}
          <Card>
            <CardHeader>
              <CardTitle>Studio Details</CardTitle>
              <CardDescription>
                Update your studio name and description.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateStudio} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="studio-name">Studio Name</Label>
                  <Input
                    id="studio-name"
                    name="name"
                    defaultValue={studio.name}
                    required
                    disabled={!isOwner || isUpdating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studio-description">Description</Label>
                  <Textarea
                    id="studio-description"
                    name="description"
                    defaultValue={studio.description || ''}
                    disabled={!isOwner || isUpdating}
                    placeholder="Describe what this studio is for..."
                  />
                </div>
                {isOwner && (
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? 'Updating...' : 'Update Studio'}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Members ({members.length})</CardTitle>
                  <CardDescription>
                    Manage who can collaborate in this studio.
                  </CardDescription>
                </div>
                {isOwner && (
                  <Button variant="outline" size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Invite Form (only for owners) */}
              {isOwner && (
                <form onSubmit={handleInviteMember} className="p-4 border rounded-lg bg-muted/30">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        name="username"
                        placeholder="Enter username to invite"
                        required
                        disabled={isInviting}
                      />
                    </div>
                    <Select name="role" defaultValue="member">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="submit" disabled={isInviting}>
                      {isInviting ? 'Inviting...' : 'Invite'}
                    </Button>
                  </div>
                </form>
              )}

              {/* Members List */}
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.profiles?.avatar_url} />
                        <AvatarFallback>
                          {member.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {member.profiles?.full_name || member.profiles?.username}
                          </p>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          @{member.profiles?.username}
                        </p>
                      </div>
                    </div>
                    
                    {isOwner && member.role !== 'owner' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveMember(member.user_id, member.profiles?.username || 'Unknown')}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudioSettings;