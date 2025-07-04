import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useStudios } from '@/hooks/useStudios';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, Calendar, Crown } from 'lucide-react';

interface StudioSelectorProps {
  onStudioSelect: (studioId: string) => void;
}

const StudioSelector = ({ onStudioSelect }: StudioSelectorProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { studios, loading, createStudio } = useStudios();
  const { profile } = useAuth();
  const { toast } = useToast();

  const handleCreateStudio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    const studioId = await createStudio(name, description || undefined);

    if (studioId) {
      toast({
        title: 'Studio created!',
        description: `"${name}" has been created successfully.`,
      });
      setIsCreateDialogOpen(false);
      onStudioSelect(studioId);
    } else {
      toast({
        title: 'Error',
        description: 'Failed to create studio. Please try again.',
        variant: 'destructive',
      });
    }

    setIsCreating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your studios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Your Studios
            </h1>
            <p className="text-muted-foreground mt-2">
              Choose a studio to collaborate on stories, or create a new one.
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Studio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Studio</DialogTitle>
                <DialogDescription>
                  Create a private collaborative space for your stories.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateStudio} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Studio Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="My Awesome Studio"
                    required
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe what this studio is for..."
                    disabled={isCreating}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Studio'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studios.map((studio) => (
            <Card key={studio.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {studio.name}
                      {studio.owner_id === profile?.id && (
                        <Crown className="h-4 w-4 text-yellow-600" />
                      )}
                    </CardTitle>
                    {studio.description && (
                      <CardDescription className="mt-2">
                        {studio.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>Collaborative</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(studio.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <Button 
                  onClick={() => onStudioSelect(studio.id)}
                  className="w-full"
                >
                  Enter Studio
                </Button>
              </CardContent>
            </Card>
          ))}

          {studios.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No studios yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first studio to start collaborating on stories.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Studio
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudioSelector;