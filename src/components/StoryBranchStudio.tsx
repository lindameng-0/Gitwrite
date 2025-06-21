
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { GitBranch, FileText, Eye } from 'lucide-react';
import StoryEditor from './StoryEditor';
import BranchVisualizer from './BranchVisualizer';

interface StoryBranch {
  id: string;
  name: string;
  content: string;
  author: string;
  createdAt: Date;
  isActive: boolean;
}

const StoryBranchStudio = () => {
  const [branches, setBranches] = useState<StoryBranch[]>([
    {
      id: 'main',
      name: 'Main Story',
      content: `Chapter 1: The Beginning

The rain drummed against the window as Sarah stared at the mysterious letter that had arrived that morning. The handwriting was elegant, almost archaic, and the paper felt oddly warm to the touch.

"My dear Sarah," it began, "the time has come for you to learn the truth about your family's legacy. Meet me at the old lighthouse at midnight. Come alone, and bring the amulet your grandmother left you."

Sarah's heart raced. She had always wondered about the strange silver pendant her grandmother had given her before passing away. It seemed to hum with an energy she couldn't explain, and sometimes, in the corner of her eye, she thought she saw it glow.

As evening approached, Sarah found herself torn between curiosity and fear. The lighthouse had been abandoned for decades, and local stories spoke of strange lights and unexplained phenomena. But something deep inside her knew she had to go.

She grabbed her coat, slipped the amulet around her neck, and stepped out into the stormy night...`,
      author: 'You',
      createdAt: new Date('2024-01-15'),
      isActive: true
    },
    {
      id: 'alternate',
      name: 'Alternate Path: Sarah Ignores the Letter',
      content: `Chapter 1: The Cautious Choice

Sarah crumpled the mysterious letter and tossed it into the fireplace. She had learned long ago not to trust strange messages from unknown senders. Whatever game someone was playing, she wanted no part of it.

But as the flames consumed the paper, something unexpected happened. The fire turned from orange to deep blue, and for a moment, Sarah could swear she heard whispers in the crackling flames.

The amulet around her neck grew warm, then hot. She quickly removed it, setting it on the mantelpiece. As soon as the pendant left her skin, the fire returned to normal.

Sarah stared at the amulet, her grandmother's final gift. Perhaps ignoring the letter hadn't been the end of the mystery after all. The answers she sought might be closer than she had imagined...`,
      author: 'Alex',
      createdAt: new Date('2024-01-16'),
      isActive: false
    },
    {
      id: 'mystery',
      name: 'Mystery Branch: The Letter\'s Origin',
      content: `Chapter 1: The Investigation

Instead of rushing to the lighthouse, Sarah decided to investigate the letter's origin. The paper was unusual - thick, cream-colored, and watermarked with what looked like an ancient symbol.

She took photos of the handwriting and uploaded them to a handwriting analysis app. Within minutes, she had her first clue: the writing style was consistent with 19th-century penmanship, specifically from the Victorian era.

But that was impossible. The letter had arrived by regular mail, with a contemporary postmark. Sarah examined the envelope more closely and noticed something she had missed before - the stamp was wrong. It depicted a lighthouse, but when she held it up to the light, she could see it was actually a very sophisticated hologram.

Someone was playing an elaborate game, and Sarah was determined to figure out who...`,
      author: 'Maya',
      createdAt: new Date('2024-01-17'),
      isActive: false
    }
  ]);

  const [activeBranch, setActiveBranch] = useState<string>('main');
  const [activeTab, setActiveTab] = useState<string>('editor');

  const handleBranchSelect = (branchId: string) => {
    setActiveBranch(branchId);
    setActiveTab('editor');
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <GitBranch className="w-6 h-6 text-story-600" />
                <h1 className="text-xl font-bold text-gray-900">Plot Branch Studio</h1>
              </div>
              <TabsList className="bg-gray-100">
                <TabsTrigger value="editor" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="visualizer" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Branch View
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="text-sm text-gray-600">
              {branches.length} branches • {branches.filter(b => b.author !== 'You').length} collaborators
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="editor" className="h-full m-0">
            <StoryEditor />
          </TabsContent>
          
          <TabsContent value="visualizer" className="h-full m-0">
            <BranchVisualizer 
              branches={branches}
              activeBranch={activeBranch}
              onBranchSelect={handleBranchSelect}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default StoryBranchStudio;
