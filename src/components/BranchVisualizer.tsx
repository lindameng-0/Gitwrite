
import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch, FileText, Users } from 'lucide-react';
import type { StoryBranchWithMeta } from '@/hooks/useStoryData';

interface BranchVisualizerProps {
  branches: StoryBranchWithMeta[];
  activeBranch: string;
  onBranchSelect: (branchId: string) => void;
}

const StoryBranchNode = ({ data }: { data: any }) => {
  const isActive = data.isActive;
  const isMain = data.is_main;
  
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Card 
        className={`p-4 min-w-[250px] cursor-pointer transition-all duration-200 ${
          isActive 
            ? 'border-story-500 bg-story-50 shadow-lg' 
            : 'border-gray-300 bg-white hover:border-story-400 hover:shadow-md'
        }`}
        onClick={() => data.onSelect(data.id)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {isMain ? (
              <FileText className="w-4 h-4 text-story-600" />
            ) : (
              <GitBranch className="w-4 h-4 text-branch-600" />
            )}
            <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">
              {data.name}
            </h3>
          </div>
          {isActive && (
            <Badge className="bg-story-600 text-white text-xs">
              Active
            </Badge>
          )}
        </div>
        
        <p className="text-xs text-gray-600 mb-3 line-clamp-3">
          {data.content.substring(0, 120)}...
        </p>
        
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Users className="w-3 h-3" />
          <span>{data.author_name}</span>
          <span>•</span>
          <span>{new Date(data.created_at).toLocaleDateString()}</span>
        </div>
      </Card>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

const nodeTypes = {
  storyBranch: StoryBranchNode,
};

const BranchVisualizer: React.FC<BranchVisualizerProps> = ({ 
  branches, 
  activeBranch, 
  onBranchSelect 
}) => {
  console.log('BranchVisualizer branches:', branches, 'activeBranch:', activeBranch);

  const initialNodes: Node[] = useMemo(() => {
    const mainBranch = branches.find(b => b.is_main);
    const otherBranches = branches.filter(b => !b.is_main);

    const nodes: Node[] = [];

    // Add main branch node
    if (mainBranch) {
      nodes.push({
        id: mainBranch.id,
        type: 'storyBranch',
        position: { x: 300, y: 100 },
        data: {
          ...mainBranch,
          isActive: mainBranch.id === activeBranch,
          onSelect: onBranchSelect,
        },
      });
    }

    // Add other branch nodes
    otherBranches.forEach((branch, index) => {
      nodes.push({
        id: branch.id,
        type: 'storyBranch',
        position: { 
          x: 100 + (index * 300), 
          y: 300 
        },
        data: {
          ...branch,
          isActive: branch.id === activeBranch,
          onSelect: onBranchSelect,
        },
      });
    });

    return nodes;
  }, [branches, activeBranch, onBranchSelect]);

  const initialEdges: Edge[] = useMemo(() => {
    const mainBranch = branches.find(b => b.is_main);
    if (!mainBranch) return [];

    return branches
      .filter(branch => !branch.is_main && branch.parent_branch_id === mainBranch.id)
      .map(branch => ({
        id: `${mainBranch.id}-to-${branch.id}`,
        source: mainBranch.id,
        target: branch.id,
        type: 'smoothstep',
        animated: branch.id === activeBranch,
        style: { 
          stroke: branch.id === activeBranch ? '#7c73f0' : '#94a3b8',
          strokeWidth: branch.id === activeBranch ? 3 : 2,
        },
      }));
  }, [branches, activeBranch]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Update nodes when branches change
  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Update edges when branches change
  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  if (!branches || branches.length === 0) {
    return (
      <div className="h-[520px] w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <Card className="p-6 text-center max-w-md shadow-md">
          <GitBranch className="w-10 h-10 text-branch-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No branches yet</h2>
          <p className="text-sm text-gray-600">
            Create a new branch from the Story Editor sidebar to visualize your story structure here.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[520px] w-full bg-gradient-to-br from-slate-50 to-blue-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-transparent"
      >
        <Background 
          color="#e2e8f0" 
          gap={20} 
          size={1}
        />
        <Controls 
          className="bg-white border border-gray-200 shadow-sm"
        />
        <MiniMap 
          className="bg-white border border-gray-200 shadow-sm"
          nodeColor={(node) => {
            if (node.data?.isActive) return '#7c73f0';
            if (node.data?.is_main) return '#059669';
            return '#6b7280';
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default BranchVisualizer;
