/**
 * Context Menu
 * Right-click menu for node operations
 */

import React from 'react';
import { Node } from 'reactflow';
import { NodeData } from '../types/nodes';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from './ui/context-menu';
import { Copy, Trash2, Lock, Unlock, Play, Square } from 'lucide-react';

interface NodeContextMenuProps {
  node: Node<NodeData>;
  onDuplicate?: (node: Node<NodeData>) => void;
  onDelete?: (nodeId: string) => void;
  onLock?: (nodeId: string) => void;
  onUnlock?: (nodeId: string) => void;
  onExecute?: (nodeId: string) => void;
  children: React.ReactNode;
}

export const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
  node,
  onDuplicate,
  onDelete,
  onLock,
  onUnlock,
  onExecute,
  children,
}) => {
  const isLocked = (node.data as any).locked === true;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {onExecute && (
          <>
            <ContextMenuItem onClick={() => onExecute(node.id)}>
              <Play className="mr-2 h-4 w-4" />
              Execute Node
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        {onDuplicate && (
          <ContextMenuItem onClick={() => onDuplicate(node)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </ContextMenuItem>
        )}

        {isLocked ? (
          onUnlock && (
            <ContextMenuItem onClick={() => onUnlock(node.id)}>
              <Unlock className="mr-2 h-4 w-4" />
              Unlock
            </ContextMenuItem>
          )
        ) : (
          onLock && (
            <ContextMenuItem onClick={() => onLock(node.id)}>
              <Lock className="mr-2 h-4 w-4" />
              Lock
            </ContextMenuItem>
          )
        )}

        {onDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => onDelete(node.id)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

/**
 * Canvas Context Menu
 * Right-click menu for empty canvas
 */
interface CanvasContextMenuProps {
  onAddNode?: (type: string, position: { x: number; y: number }) => void;
  children: React.ReactNode;
  position?: { x: number; y: number };
}

export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  onAddNode,
  children,
  position = { x: 0, y: 0 },
}) => {
  const nodeTypes = [
    { type: 'precedent', label: 'Precedent Search' },
    { type: 'text', label: 'Text' },
    { type: 'image-gen', label: 'Image Generation' },
    { type: 'llm', label: 'LLM Analysis' },
    { type: '3d', label: '3D Model' },
    { type: 'collection', label: 'Collection' },
    { type: 'overseer', label: 'Overseer' },
  ];

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <div className="px-2 py-1.5 text-sm font-semibold">Add Node</div>
        <ContextMenuSeparator />
        {nodeTypes.map((nodeType) => (
          <ContextMenuItem
            key={nodeType.type}
            onClick={() => onAddNode?.(nodeType.type, position)}
          >
            {nodeType.label}
          </ContextMenuItem>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
};


