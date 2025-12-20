import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, CheckCircle, XCircle } from 'lucide-react';

const InvitePage = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'joining' | 'success' | 'error'>('loading');
  const [invite, setInvite] = useState<{
    studio_name: string;
    role: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (code) {
      validateInvite();
    }
  }, [code]);

  const validateInvite = async () => {
    try {
      const { data, error } = await supabase
        .from('studio_invites')
        .select(`
          id,
          role,
          expires_at,
          max_uses,
          uses_count,
          studio_id,
          studios (name)
        `)
        .eq('invite_code', code)
        .maybeSingle();

      if (error || !data) {
        setStatus('invalid');
        setErrorMessage('This invite link is invalid or has expired.');
        return;
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setStatus('invalid');
        setErrorMessage('This invite link has expired.');
        return;
      }

      // Check if max uses reached
      if (data.max_uses && data.uses_count >= data.max_uses) {
        setStatus('invalid');
        setErrorMessage('This invite link has reached its maximum number of uses.');
        return;
      }

      setInvite({
        studio_name: (data.studios as { name: string })?.name || 'Unknown Studio',
        role: data.role
      });
      setStatus('valid');
    } catch (err) {
      console.error('Error validating invite:', err);
      setStatus('invalid');
      setErrorMessage('Failed to validate invite link.');
    }
  };

  const handleJoin = async () => {
    if (!user || !session) {
      // Redirect to auth with return URL
      toast({
        title: 'Login Required',
        description: 'Please log in to join the studio.',
      });
      navigate('/?auth=true&redirect=/invite/' + code);
      return;
    }

    setStatus('joining');

    try {
      // Get the invite details
      const { data: inviteData, error: inviteError } = await supabase
        .from('studio_invites')
        .select('id, studio_id, role, uses_count')
        .eq('invite_code', code)
        .single();

      if (inviteError || !inviteData) {
        throw new Error('Invalid invite');
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('studio_members')
        .select('id')
        .eq('studio_id', inviteData.studio_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingMember) {
        toast({
          title: 'Already a member',
          description: 'You are already a member of this studio.',
        });
        navigate(`/studio/${inviteData.studio_id}`);
        return;
      }

      // Add user as member
      const { error: memberError } = await supabase
        .from('studio_members')
        .insert({
          studio_id: inviteData.studio_id,
          user_id: user.id,
          role: inviteData.role
        });

      if (memberError) throw memberError;

      // Increment uses_count
      await supabase
        .from('studio_invites')
        .update({ uses_count: inviteData.uses_count + 1 })
        .eq('id', inviteData.id);

      setStatus('success');
      toast({
        title: 'Welcome!',
        description: `You've joined ${invite?.studio_name}!`,
      });

      setTimeout(() => {
        navigate(`/studio/${inviteData.studio_id}`);
      }, 1500);
    } catch (err) {
      console.error('Error joining studio:', err);
      setStatus('error');
      setErrorMessage('Failed to join the studio. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />}
            {status === 'valid' && <Users className="h-12 w-12 text-primary" />}
            {status === 'joining' && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
            {status === 'success' && <CheckCircle className="h-12 w-12 text-green-500" />}
            {(status === 'invalid' || status === 'error') && <XCircle className="h-12 w-12 text-destructive" />}
          </div>
          <CardTitle>
            {status === 'loading' && 'Validating Invite...'}
            {status === 'valid' && 'Studio Invitation'}
            {status === 'joining' && 'Joining Studio...'}
            {status === 'success' && 'Welcome!'}
            {(status === 'invalid' || status === 'error') && 'Oops!'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we validate your invite link.'}
            {status === 'valid' && `You've been invited to join "${invite?.studio_name}" as a ${invite?.role}.`}
            {status === 'joining' && 'Adding you to the studio...'}
            {status === 'success' && `You've successfully joined ${invite?.studio_name}!`}
            {(status === 'invalid' || status === 'error') && errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {status === 'valid' && (
            <>
              <Button onClick={handleJoin} className="w-full">
                {user ? 'Join Studio' : 'Log in to Join'}
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                Cancel
              </Button>
            </>
          )}
          {(status === 'invalid' || status === 'error') && (
            <Button onClick={() => navigate('/')} className="w-full">
              Go Home
            </Button>
          )}
          {status === 'success' && (
            <Button onClick={() => navigate(`/`)} className="w-full">
              Continue
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvitePage;
