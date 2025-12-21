import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MessageSquarePlus, Send } from 'lucide-react';

interface SuggestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (suggestionText: string) => Promise<boolean>;
  selectedText?: string;
}

const SuggestionDialog: React.FC<SuggestionDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedText
}) => {
  const [suggestion, setSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!suggestion.trim()) return;

    setIsSubmitting(true);
    try {
      const success = await onSubmit(suggestion);
      if (success) {
        setSuggestion('');
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuggestion('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5" />
            Suggest a Change
          </DialogTitle>
          <DialogDescription>
            Your suggestion will be reviewed by the draft owner.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {selectedText && (
            <div className="p-3 bg-muted rounded-lg border border-border">
              <span className="text-xs text-muted-foreground block mb-1">Selected text:</span>
              <p className="text-sm text-foreground italic">"{selectedText}"</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              {selectedText ? 'Suggest replacement:' : 'Your suggestion:'}
            </label>
            <Textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder={selectedText 
                ? "Enter your suggested replacement text..." 
                : "Enter your suggestion or feedback..."
              }
              className="min-h-[120px] resize-none"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!suggestion.trim() || isSubmitting}
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SuggestionDialog;
