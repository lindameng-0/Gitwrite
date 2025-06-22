
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
import { GitBranch, FileText, Clock, User } from 'lucide-react';
import type { StoryBranchWithMeta } from '@/hooks/useStoryData';

interface VersionVisualizerProps {
  branches: StoryBranchWithMeta[];
  activeBranch: string;
  onVersionSelect: (branchId: string) => void;
}

const StoryVersionNode = ({ data }: { data: any }) => {
  const isActive = data.isActive;
  const isMain = data.is_main;
  
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Card 
        className={`p-4 min-w-[280px] cursor-pointer transition-all duration-200 ${
          isActive 
            ? 'border-indigo-500 bg-indigo-50 shadow-lg' 
            : 'border-gray-300 bg-white hover:border-indigo-400 hover:shadow-md'
        }`}
        onClick={() => data.onSelect(data.id)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {isMain ? (
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Main Story</h3>
                  <p className="text-xs text-gray-500">Original version</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">{data.name}</h3>
                  <p className="text-xs text-gray-500">Story version</p>
                </div>
              </div>
            )}
          </div>
          {isActive && (
            <Badge className="bg-indigo-600 text-white text-xs">
              Currently Writing
            </Badge>
          )}
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {data.content ? data.content.substring(0, 100) + '...' : 'No content yet'}
        </p>
        
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <User className="w-3 h-3" />
          <span>{data.author_name}</span>
          <Clock className="w-3 h-3 ml-2" />
          <span>{new Date(data.created_at).toLocaleDateString()}</span>
        </div>
      </Card>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

const nodeTypes = {
  storyVersion: StoryVersionNode,
};

const VersionVisualizer: React.FC<VersionVisualizerProps> = ({ 
  branches, 
  activeBranch, 
  onVersionSelect 
}) => {
  const initialNodes: Node[] = useMemo(() => {
    const mainBranch = branches.find(b => b.is_main);
    const otherBranches = branches.filter(b => !b.is_main);

    const nodes: Node[] = [];

    // Add main story node
    if (mainBranch) {
      nodes.push({
        id: mainBranch.id,
        type: 'storyVersion',
        position: { x: 400, y: 100 },
        data: {
          ...mainBranch,
          isActive: mainBranch.id === activeBranch,
          onSelect: onVersionSelect,
        },
      });
    }

    // Add story version nodes
    otherBranches.forEach((branch, index) => {
      const angle = (index * 60) - 30; // Spread them out in a fan pattern
      const radius = 300;
      const x = 400 + radius * Math.cos((angle * Math.PI) / 180);
      const y = 400 + radius * Math.sin((angle * Math.PI) / 180);
      
      nodes.push({
        id: branch.id,
        type: 'storyVersion',
        position: { x, y },
        data: {
          ...branch,
          isActive: branch.id === activeBranch,
          onSelect: onVersionSelect,
        },
      });
    });

    return nodes;
  }, [branches, activeBranch, onVersionSelect]);

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
          stroke: branch.id === activeBranch ? '#6366f1' : '#94a3b8',
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
    <div className="h-full w-full bg-gradient-to-br from-blue-50 to-indigo-50 relative">
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-sm border p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Story Version Tree</h3>
        <p className="text-sm text-gray-600 mb-3">
          Visualize different versions of your story. Click any version to switch to it.
        </p>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-100 border-2 border-indigo-500 rounded"></div>
            <span>Currently active version</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white border-2 border-gray-300 rounded"></div>
            <span>Other story versions</span>
          </div>
        </div>
      </div>
      
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
          color="#e0e7ff" 
          gap={20} 
          size={1}
        />
        <Controls 
          className="bg-white border border-gray-200 shadow-sm"
        />
        <MiniMap 
          className="bg-white border border-gray-200 shadow-sm"
          nodeColor={(node) => {
            if (node.data?.isActive) return '#6366f1';
            if (node.data?.is_main) return '#059669';
            return '#6b7280';
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default VersionVisualizer;
