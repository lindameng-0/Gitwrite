import React from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StudioMode = 'writer' | 'admin';

interface ModeToggleProps {
  currentMode: StudioMode;
  onModeChange: (mode: StudioMode) => void;
  canSwitchModes: boolean;
}

const ModeToggle: React.FC<ModeToggleProps> = ({
  currentMode,
  onModeChange,
  canSwitchModes
}) => {
  if (!canSwitchModes) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onModeChange('writer')}
        className={cn(
          "gap-1.5 h-8 px-3 transition-all",
          currentMode === 'writer'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Pencil className="w-3.5 h-3.5" />
        Writer
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onModeChange('admin')}
        className={cn(
          "gap-1.5 h-8 px-3 transition-all",
          currentMode === 'admin'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Shield className="w-3.5 h-3.5" />
        Admin
      </Button>
    </div>
  );
};

export default ModeToggle;
