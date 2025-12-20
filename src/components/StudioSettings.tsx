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
import { supabase } from '@/integrations/supabase/client';
import UsernameSearch from './UsernameSearch';
import { Settings, UserPlus, Crown, Shield, User, Trash2, X, Link, Copy, Check, Loader2 } from 'lucide-react';

interface StudioInvite {
  id: string;
  invite_code: string;
  role: string;
  expires_at: string | null;
  max_uses: number | null;
  uses_count: number;
  created_at: string;
}

interface StudioSettingsProps {
  studio: Studio;
  isOpen: boolean;
  onClose: () => void;
}

const StudioSettings = ({ studio, isOpen, onClose }: StudioSettingsProps) => {
  const [members, setMembers] = useState<StudioMember[]>([]);
  const [invites, setInvites] = useState<StudioInvite[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'member'>('member');
  const { updateStudio, getStudioMembers, inviteMember, removeMember } = useStudios();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadMembers();
      loadInvites();
    }
  }, [isOpen]);

  const loadMembers = async () => {
    const membersList = await getStudioMembers(studio.id);
    setMembers(membersList);
  };

  const loadInvites = async () => {
    try {
      const { data, error } = await supabase
        .from('studio_invites')
        .select('*')
        .eq('studio_id', studio.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (err) {
      console.error('Error loading invites:', err);
    }
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

  const handleInviteByUsername = async (username: string) => {
    setIsInviting(true);

    const success = await inviteMember(studio.id, username, selectedRole);

    if (success) {
      toast({
        title: 'Member invited!',
        description: `${username} has been invited to the studio.`,
      });
      loadMembers();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to invite member. Please check the username and try again.',
        variant: 'destructive',
      });
    }

    setIsInviting(false);
  };

  const handleGenerateInviteLink = async () => {
    if (!user) return;
    setIsGeneratingLink(true);

    try {
      const inviteCode = crypto.randomUUID().slice(0, 8);
      
      const { error } = await supabase
        .from('studio_invites')
        .insert({
          studio_id: studio.id,
          invite_code: inviteCode,
          created_by: user.id,
          role: selectedRole
        });

      if (error) throw error;

      toast({
        title: 'Invite link created!',
        description: 'Copy and share the link to invite collaborators.',
      });
      
      loadInvites();
    } catch (err) {
      console.error('Error generating invite:', err);
      toast({
        title: 'Error',
        description: 'Failed to generate invite link.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyInviteLink = async (code: string) => {
    const link = `${window.location.origin}/invite/${code}`;
    await navigator.clipboard.writeText(link);
    setCopiedCode(code);
    toast({
      title: 'Copied!',
      description: 'Invite link copied to clipboard.',
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('studio_invites')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;
      
      toast({
        title: 'Invite deleted',
        description: 'The invite link has been removed.',
      });
      loadInvites();
    } catch (err) {
      console.error('Error deleting invite:', err);
    }
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
        return <Crown className="h-4 w-4 text-amber-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const isOwner = studio.owner_id === profile?.id;
  const memberUserIds = members.map(m => m.user_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <DialogTitle>Studio Settings</DialogTitle>
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

          {/* Invite Members */}
          {isOwner && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Invite Collaborators
                    </CardTitle>
                    <CardDescription>
                      Invite by username or generate a shareable link.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Role Selection */}
                <div className="flex items-center gap-4">
                  <Label>Invite as:</Label>
                  <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as 'admin' | 'member')}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Username Search */}
                <div className="space-y-2">
                  <Label>Search by username</Label>
                  <div className="flex gap-2">
                    <UsernameSearch
                      onSelect={handleInviteByUsername}
                      placeholder="Type to search users..."
                      disabled={isInviting}
                      excludeUserIds={memberUserIds}
                    />
                  </div>
                </div>

                {/* Generate Link */}
                <div className="space-y-2">
                  <Label>Or generate an invite link</Label>
                  <Button 
                    onClick={handleGenerateInviteLink} 
                    variant="outline" 
                    disabled={isGeneratingLink}
                    className="w-full"
                  >
                    {isGeneratingLink ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Link className="h-4 w-4 mr-2" />
                    )}
                    Generate Invite Link
                  </Button>
                </div>

                {/* Active Invites */}
                {invites.length > 0 && (
                  <div className="space-y-2">
                    <Label>Active invite links</Label>
                    <div className="space-y-2">
                      {invites.map((invite) => (
                        <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                          <div className="flex-1 min-w-0">
                            <code className="text-sm truncate block">
                              /invite/{invite.invite_code}
                            </code>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {invite.role}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {invite.uses_count} uses
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyInviteLink(invite.invite_code)}
                            >
                              {copiedCode === invite.invite_code ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteInvite(invite.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle>Members ({members.length})</CardTitle>
              <CardDescription>
                People who can collaborate in this studio.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
