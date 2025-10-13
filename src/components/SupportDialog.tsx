import { useState } from 'react';
import { Heart } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const teamMembers = [
  { name: 'Alex Chen', initials: 'AC', avatar: '' },
  { name: 'Sam Rivera', initials: 'SR', avatar: '' },
  { name: 'Jordan Lee', initials: 'JL', avatar: '' },
  { name: 'Casey Morgan', initials: 'CM', avatar: '' },
];

export const SupportDialog = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Support Button */}
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
        size="icon"
      >
        <Heart className="h-6 w-6 fill-current" />
      </Button>

      {/* Support Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Support Our Team</DialogTitle>
            <DialogDescription className="text-center">
              Help us continue building amazing tools for writers
            </DialogDescription>
          </DialogHeader>

          {/* Team Members */}
          <div className="flex justify-center gap-4 my-6">
            {teamMembers.map((member) => (
              <div key={member.name} className="flex flex-col items-center gap-2">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">{member.name}</span>
              </div>
            ))}
          </div>

          {/* Ko-fi Button */}
          <div className="flex flex-col items-center gap-4">
            <a
              href="https://ko-fi.com/yuko246409"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button className="w-full bg-[#FF5E5B] hover:bg-[#FF5E5B]/90 text-white font-semibold py-6 gap-2">
                <Heart className="h-5 w-5 fill-current" />
                Support us on Ko-fi
              </Button>
            </a>
            <p className="text-xs text-muted-foreground text-center">
              Every contribution helps us improve and maintain this project
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
