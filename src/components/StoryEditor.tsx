
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Save, Plus, FileText, Users } from 'lucide-react';

interface StoryBranch {
  id: string;
  name: string;
  content: string;
  author: string;
  createdAt: Date;
  isActive: boolean;
}

const StoryEditor = () => {
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
    }
  ]);

  const [activeBranch, setActiveBranch] = useState<string>('main');
  const [newBranchName, setNewBranchName] = useState('');
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);

  const getCurrentBranch = () => branches.find(b => b.id === activeBranch);

  const updateContent = (content: string) => {
    setBranches(prev => prev.map(branch => 
      branch.id === activeBranch 
        ? { ...branch, content }
        : branch
    ));
  };

  const createNewBranch = () => {
    if (!newBranchName.trim()) return;
    
    const currentBranch = getCurrentBranch();
    const newBranch: StoryBranch = {
      id: `branch-${Date.now()}`,
      name: newBranchName,
      content: currentBranch?.content || '',
      author: 'You',
      createdAt: new Date(),
      isActive: false
    };

    setBranches(prev => [...prev, newBranch]);
    setActiveBranch(newBranch.id);
    setNewBranchName('');
    setIsCreatingBranch(false);
  };

  const switchBranch = (branchId: string) => {
    setActiveBranch(branchId);
  };

  const currentBranch = getCurrentBranch();

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Plot Branch Studio</h1>
          <p className="text-sm text-gray-600">Collaborative story version control</p>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-story-600" />
              Story Branches
            </h2>
            <Button
              onClick={() => setIsCreatingBranch(true)}
              size="sm"
              className="bg-story-600 hover:bg-story-700"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {isCreatingBranch && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg animate-fade-in">
              <Input
                placeholder="Branch name..."
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                className="mb-2"
                onKeyPress={(e) => e.key === 'Enter' && createNewBranch()}
              />
              <div className="flex gap-2">
                <Button onClick={createNewBranch} size="sm" className="bg-story-600 hover:bg-story-700">
                  Create
                </Button>
                <Button onClick={() => setIsCreatingBranch(false)} variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {branches.map((branch) => (
              <Card
                key={branch.id}
                className={`p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  branch.id === activeBranch 
                    ? 'border-story-500 bg-story-50 shadow-sm' 
                    : 'border-gray-200 hover:border-story-300'
                }`}
                onClick={() => switchBranch(branch.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                    {branch.name}
                  </h3>
                  {branch.id === activeBranch && (
                    <Badge variant="secondary" className="bg-story-100 text-story-800 text-xs">
                      Active
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Users className="w-3 h-3" />
                  <span>{branch.author}</span>
                  <span>•</span>
                  <span>{branch.createdAt.toLocaleDateString()}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-story-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {currentBranch?.name}
                </h1>
                <p className="text-sm text-gray-500">
                  By {currentBranch?.author} • Last edited {currentBranch?.createdAt.toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save
              </Button>
              <Button size="sm" className="bg-story-600 hover:bg-story-700 flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                Merge Branch
              </Button>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <Textarea
              value={currentBranch?.content || ''}
              onChange={(e) => updateContent(e.target.value)}
              className="w-full h-full min-h-[600px] story-editor text-lg leading-relaxed resize-none border-0 shadow-none focus:ring-0 p-8 bg-white rounded-lg shadow-sm"
              placeholder="Begin writing your story..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryEditor;
