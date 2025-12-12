/**
 * Node Inspector
 * Right-side panel for editing node parameters
 */

import React from 'react';
import { Node } from 'reactflow';
import { NodeData } from '../types/nodes';
import { getNodeTypeDefinition, NodeParameter } from '../lib/NodeRegistry';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';

interface NodeInspectorProps {
  node: Node<NodeData> | null;
  onUpdate: (nodeId: string, data: Partial<NodeData>) => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({ node, onUpdate }) => {
  if (!node) {
    return (
      <div className="w-80 h-full bg-white border-l border-gray-200 p-4 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-sm">Select a node to edit its parameters</p>
        </div>
      </div>
    );
  }

  const nodeDef = getNodeTypeDefinition(node.data.type);

  const handleParameterChange = (paramId: string, value: any) => {
    onUpdate(node.id, {
      [paramId]: value,
    });
  };

  const renderParameter = (param: NodeParameter) => {
    const currentValue = (node.data as any)[param.id] ?? param.defaultValue;

    switch (param.type) {
      case 'text':
        return (
          <div key={param.id} className="space-y-2">
            <Label htmlFor={param.id}>{param.label}</Label>
            <Input
              id={param.id}
              value={currentValue || ''}
              onChange={(e) => handleParameterChange(param.id, e.target.value)}
              placeholder={param.description}
            />
            {param.description && (
              <p className="text-xs text-gray-500">{param.description}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={param.id} className="space-y-2">
            <Label htmlFor={param.id}>{param.label}</Label>
            <Textarea
              id={param.id}
              value={currentValue || ''}
              onChange={(e) => handleParameterChange(param.id, e.target.value)}
              placeholder={param.description}
              rows={4}
            />
            {param.description && (
              <p className="text-xs text-gray-500">{param.description}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={param.id} className="space-y-2">
            <Label htmlFor={param.id}>
              {param.label} {param.min !== undefined && param.max !== undefined && `(${param.min}-${param.max})`}
            </Label>
            <Input
              id={param.id}
              type="number"
              value={currentValue ?? param.defaultValue}
              onChange={(e) => handleParameterChange(param.id, Number(e.target.value))}
              min={param.min}
              max={param.max}
              step={param.step}
            />
            {param.description && (
              <p className="text-xs text-gray-500">{param.description}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={param.id} className="space-y-2">
            <Label htmlFor={param.id}>{param.label}</Label>
            <Select
              value={String(currentValue ?? param.defaultValue)}
              onValueChange={(value) => handleParameterChange(param.id, value)}
            >
              <SelectTrigger id={param.id}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {param.options?.map((option) => {
                  const value = typeof option === 'string' ? option : option.value;
                  const label = typeof option === 'string' ? option : option.label;
                  return (
                    <SelectItem key={value} value={String(value)}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {param.description && (
              <p className="text-xs text-gray-500">{param.description}</p>
            )}
          </div>
        );

      case 'multiselect':
        // For multiselect, we'll use a simple text input with comma-separated values
        // In a production app, you'd use a proper multiselect component
        return (
          <div key={param.id} className="space-y-2">
            <Label htmlFor={param.id}>{param.label}</Label>
            <Input
              id={param.id}
              value={Array.isArray(currentValue) ? currentValue.join(', ') : ''}
              onChange={(e) => {
                const values = e.target.value.split(',').map(v => v.trim()).filter(Boolean);
                handleParameterChange(param.id, values);
              }}
              placeholder="Comma-separated values"
            />
            {param.description && (
              <p className="text-xs text-gray-500">{param.description}</p>
            )}
          </div>
        );

      case 'slider':
        return (
          <div key={param.id} className="space-y-2">
            <Label htmlFor={param.id}>
              {param.label}: {currentValue ?? param.defaultValue}
            </Label>
            <Slider
              value={[currentValue ?? param.defaultValue]}
              onValueChange={([value]) => handleParameterChange(param.id, value)}
              min={param.min ?? 0}
              max={param.max ?? 100}
              step={param.step ?? 1}
              className="w-full"
            />
            {param.description && (
              <p className="text-xs text-gray-500">{param.description}</p>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div key={param.id} className="flex items-center justify-between space-y-0 space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor={param.id}>{param.label}</Label>
              {param.description && (
                <p className="text-xs text-gray-500">{param.description}</p>
              )}
            </div>
            <Switch
              id={param.id}
              checked={currentValue ?? param.defaultValue}
              onCheckedChange={(checked) => handleParameterChange(param.id, checked)}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-80 h-full bg-white border-l border-gray-200 overflow-y-auto">
      <Card className="border-0 shadow-none rounded-none h-full">
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: nodeDef.color }}
            />
            <CardTitle className="text-lg">{nodeDef.label}</CardTitle>
          </div>
          <CardDescription>{nodeDef.description}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-6">
          {/* Node Info */}
          <div className="space-y-2">
            <Label>Node ID</Label>
            <p className="text-sm text-gray-500 font-mono">{node.id}</p>
          </div>

          <Separator />

          {/* Inputs */}
          {nodeDef.inputs.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Inputs</Label>
              <div className="space-y-1">
                {nodeDef.inputs.map((input) => (
                  <Badge key={input.id} variant="outline" className="mr-1">
                    {input.label} ({input.type})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Outputs */}
          {nodeDef.outputs.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Outputs</Label>
              <div className="space-y-1">
                {nodeDef.outputs.map((output) => (
                  <Badge key={output.id} variant="outline" className="mr-1">
                    {output.label} ({output.type})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Parameters */}
          {nodeDef.parameters.length > 0 && (
            <div className="space-y-4">
              <Label className="text-sm font-semibold">Parameters</Label>
              {nodeDef.parameters.map(renderParameter)}
            </div>
          )}

          {/* Execution Status */}
          {node.data.executionStatus && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Status</Label>
                <Badge
                  variant={
                    node.data.executionStatus === 'success'
                      ? 'default'
                      : node.data.executionStatus === 'error'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {node.data.executionStatus}
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};


