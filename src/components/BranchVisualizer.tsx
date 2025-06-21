
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

interface StoryBranch {
  id: string;
  name: string;
  content: string;
  author: string;
  createdAt: Date;
  isActive: boolean;
}

interface BranchVisualizerProps {
  branches: StoryBranch[];
  activeBranch: string;
  onBranchSelect: (branchId: string) => void;
}

const StoryBranchNode = ({ data }: { data: any }) => {
  const isActive = data.isActive;
  const isMain = data.id === 'main';
  
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
          <span>{data.author}</span>
          <span>•</span>
          <span>{data.createdAt.toLocaleDateString()}</span>
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
  const initialNodes: Node[] = useMemo(() => {
    return branches.map((branch, index) => ({
      id: branch.id,
      type: 'storyBranch',
      position: { 
        x: branch.id === 'main' ? 300 : 100 + (index * 300), 
        y: branch.id === 'main' ? 100 : 300 
      },
      data: {
        ...branch,
        isActive: branch.id === activeBranch,
        onSelect: onBranchSelect,
      },
    }));
  }, [branches, activeBranch, onBranchSelect]);

  const initialEdges: Edge[] = useMemo(() => {
    return branches
      .filter(branch => branch.id !== 'main')
      .map(branch => ({
        id: `main-to-${branch.id}`,
        source: 'main',
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

  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-50 to-blue-50">
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
            if (node.data?.id === 'main') return '#059669';
            return '#6b7280';
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default BranchVisualizer;
