"use client";

import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { RegistryItem } from '@/types/registry';

interface DependencyGraphProps {
  items: RegistryItem[];
  selectedIds: string[];
}

export function DependencyGraph({ items, selectedIds }: DependencyGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    // Build nodes and edges from items
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const itemMap = new Map(items.map(item => [item.id, item]));

    // Create nodes for all items
    items.forEach((item, index) => {
      const isSelected = selectedIds.includes(item.id);

      newNodes.push({
        id: item.id,
        position: {
          x: (index % 4) * 250,
          y: Math.floor(index / 4) * 150
        },
        data: {
          label: (
            <div className="text-center">
              <div className={`font-bold text-sm ${isSelected ? 'text-lime-600' : 'text-black'}`}>
                {item.name}
              </div>
              <div className="text-xs text-gray-500 uppercase">{item.kind}</div>
            </div>
          ),
        },
        style: {
          background: isSelected ? '#d9f99d' : 'white',
          border: `2px solid ${isSelected ? '#84cc16' : '#e5e7eb'}`,
          borderRadius: '12px',
          padding: '12px',
          minWidth: '180px',
        },
      });

      // Create edges for dependencies
      (item.dependencies || []).forEach(depId => {
        if (itemMap.has(depId)) {
          newEdges.push({
            id: `${item.id}-${depId}`,
            source: depId,
            target: item.id,
            type: 'smoothstep',
            animated: selectedIds.includes(item.id) && selectedIds.includes(depId),
            style: {
              stroke: selectedIds.includes(item.id) ? '#84cc16' : '#9ca3af',
              strokeWidth: 2,
            },
          });
        }
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [items, selectedIds, setNodes, setEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      fitViewOptions={{ padding: 0.2 }}
    >
      <Controls />
      <MiniMap
        nodeColor={(node) => {
          return selectedIds.includes(node.id) ? '#84cc16' : '#e5e7eb';
        }}
      />
      <Background gap={12} size={1} />
    </ReactFlow>
  );
}
