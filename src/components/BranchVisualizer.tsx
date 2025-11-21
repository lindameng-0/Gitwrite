import React, { useCallback, useMemo, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { GitBranch, FileText, Users, ChevronDown, ChevronRight } from 'lucide-react';
import dagre from 'dagre';
import { supabase } from '@/integrations/supabase/client';
import type { StoryBranchWithMeta, ChapterWithReviews } from '@/hooks/useStoryData';

interface BranchVisualizerProps {
  branches: StoryBranchWithMeta[];
  chapters: ChapterWithReviews[];
  activeBranch: string;
  onBranchSelect: (branchId: string) => void;
  onSaveBranchPosition?: (branchId: string, x: number, y: number) => Promise<boolean>;
}

export interface BranchVisualizerRef {
  savePositions: () => void;
}

// Dagre layout configuration
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 280;
const nodeHeight = 200;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  dagreGraph.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const StoryBranchNode = ({ data }: { data: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isActive = data.isActive;
  const isMain = data.is_main;
  const chapters = data.chapters || [];
  
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Card 
        className={`p-4 w-[280px] cursor-pointer transition-all duration-200 ${
          isActive 
            ? 'border-indigo-500 bg-indigo-50 shadow-lg' 
            : 'border-gray-300 bg-white hover:border-indigo-400 hover:shadow-md'
        }`}
        onClick={() => data.onSelect(data.id)}
      >
        {/* Branch Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            {isMain ? (
              <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
            ) : (
              <GitBranch className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            )}
            <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">
              {data.name}
            </h3>
            {isMain && (
              <Badge className="bg-green-100 text-green-800 text-xs px-1.5 py-0">
                Main
              </Badge>
            )}
          </div>
          {isActive && (
            <Badge className="bg-indigo-600 text-white text-xs ml-2">
              Active
            </Badge>
          )}
        </div>
        
        {/* Author & Date */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          <Users className="w-3 h-3" />
          <span className="line-clamp-1">{data.author_name}</span>
          <span>•</span>
          <span>{new Date(data.created_at).toLocaleDateString()}</span>
        </div>
        
        {/* Chapters Section */}
        {chapters.length > 0 && (
          <div className="border-t pt-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between p-1 h-auto hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              <span className="text-xs font-medium text-gray-700">
                {chapters.length} Chapter{chapters.length !== 1 ? 's' : ''}
              </span>
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
            
            {isExpanded && (
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                {chapters.map((chapter: ChapterWithReviews, index: number) => (
                  <div
                    key={chapter.id}
                    className="text-xs p-1.5 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start gap-1.5">
                      <FileText className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 line-clamp-1">
                          {index + 1}. {chapter.title}
                        </div>
                        <div className="text-gray-500 text-[10px]">
                          {chapter.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

const nodeTypes = {
  storyBranch: StoryBranchNode,
};

const BranchVisualizer = React.forwardRef<BranchVisualizerRef, BranchVisualizerProps>(({ 
  branches, 
  chapters,
  activeBranch, 
  onBranchSelect,
  onSaveBranchPosition
}, ref) => {
  const isDraggingRef = React.useRef(false);

  // Expose save function to parent (no-op now since we save immediately)
  React.useImperativeHandle(ref, () => ({
    savePositions: () => {
      // No-op: positions are now saved immediately on drag stop
    }
  }));
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (!branches || branches.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Group chapters by branch
    const chaptersByBranch = chapters.reduce((acc, chapter) => {
      if (!acc[chapter.branch_id]) {
        acc[chapter.branch_id] = [];
      }
      acc[chapter.branch_id].push(chapter);
      return acc;
    }, {} as Record<string, ChapterWithReviews[]>);

    // Create nodes with saved positions or dagre layout (manual positions handled by React Flow state)
    const nodes: Node[] = branches.map((branch) => {
      const hasCustomPosition = branch.position_x !== null && branch.position_y !== null;
      
      return {
        id: branch.id,
        type: 'storyBranch',
        position: hasCustomPosition 
          ? { x: branch.position_x!, y: branch.position_y! }
          : { x: 0, y: 0 }, // Will be set by dagre if no custom position
        data: {
          ...branch,
          isActive: branch.id === activeBranch,
          onSelect: onBranchSelect,
          chapters: chaptersByBranch[branch.id] || [],
        },
      };
    });

    // Create edges
    const edges: Edge[] = branches
      .filter(branch => branch.parent_branch_id)
      .map(branch => ({
        id: `${branch.parent_branch_id}-to-${branch.id}`,
        source: branch.parent_branch_id!,
        target: branch.id,
        type: 'smoothstep',
        animated: branch.id === activeBranch,
        style: { 
          stroke: branch.id === activeBranch ? '#6366f1' : '#94a3b8',
          strokeWidth: branch.id === activeBranch ? 3 : 2,
        },
      }));

    // Only apply dagre layout if no branches have custom positions
    const hasAnyCustomPositions = branches.some(b => b.position_x !== null && b.position_y !== null);
    if (hasAnyCustomPositions) {
      return { nodes, edges };
    }
    return getLayoutedElements(nodes, edges);
  }, [branches, chapters, activeBranch, onBranchSelect]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle node drag start
  const handleNodeDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  // Handle node drag end - save position immediately
  const handleNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    isDraggingRef.current = false;
    if (!onSaveBranchPosition) return;

    // Save immediately
    onSaveBranchPosition(node.id, node.position.x, node.position.y);
  }, [onSaveBranchPosition]);


  // Real-time sync: Listen for position updates from other users
  React.useEffect(() => {
    if (!branches || branches.length === 0) return;

    const channel = supabase
      .channel('story-branches-positions')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'story_branches',
          filter: `story_id=eq.${branches[0]?.story_id}`
        },
        (payload) => {
          const updatedBranch = payload.new as any;
          
          // Only update if the position changed and it's not our own change
          if (updatedBranch.position_x !== null && updatedBranch.position_y !== null) {
            // Update the node position in React Flow
            setNodes((currentNodes) =>
              currentNodes.map((node) =>
                node.id === updatedBranch.id
                  ? {
                      ...node,
                      position: {
                        x: updatedBranch.position_x,
                        y: updatedBranch.position_y,
                      },
                    }
                  : node
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [branches, setNodes]);

  // Update nodes when layout changes, but don't override during drag
  React.useEffect(() => {
    if (isDraggingRef.current) return; // Don't update during drag
    
    setNodes(layoutedNodes);
  }, [layoutedNodes, setNodes]);

  // Update edges when layout changes
  React.useEffect(() => {
    setEdges(layoutedEdges);
  }, [layoutedEdges, setEdges]);

  if (!branches || branches.length === 0) {
    return (
      <div className="w-full h-[calc(100vh-140px)] flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <Card className="p-6 text-center max-w-md shadow-md">
          <GitBranch className="w-10 h-10 text-indigo-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No branches yet</h2>
          <p className="text-sm text-gray-600">
            Create a new branch from the Story Editor sidebar to visualize your story structure here.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-140px)] bg-gradient-to-br from-slate-50 to-blue-50">
      <ReactFlow
        style={{ width: '100%', height: '100%' }}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
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
            if (node.data?.isActive) return '#6366f1';
            if (node.data?.is_main) return '#059669';
            return '#6b7280';
          }}
        />
      </ReactFlow>
    </div>
  );
});

BranchVisualizer.displayName = 'BranchVisualizer';

export default BranchVisualizer;
