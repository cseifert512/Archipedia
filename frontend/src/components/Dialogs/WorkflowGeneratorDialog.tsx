import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { useCanvasStore } from '../../stores/canvasStore';
import { generateWorkflowAsync } from '../../lib/workflowGenerator';
import { WorkflowIntent } from '../../types/nodes';
import { Node } from 'reactflow';

interface WorkflowGeneratorDialogProps {
  open: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const WorkflowGeneratorDialog: React.FC<WorkflowGeneratorDialogProps> = ({
  open,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I can help you generate a workflow. What would you like to create?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { setGenerating, setGeneratedWorkflow } = useWorkflowStore();
  const { addNodes, addEdges } = useCanvasStore();

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);
    setGenerating(true);

    // Simulate LLM response
    setTimeout(() => {
      const assistantMessage: Message = {
        role: 'assistant',
        content: `I'll generate a workflow for: "${input}". How many variations would you like?`,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsGenerating(false);
    }, 1000);
  };

  const handleGenerate = async () => {
    const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
    if (!lastUserMessage) return;

    setIsGenerating(true);
    setGenerating(true);

    const intent: WorkflowIntent = {
      task: lastUserMessage.content,
      parameters: {},
      variations: 4,
    };

    try {
      const workflow = await generateWorkflowAsync(intent);
      setGeneratedWorkflow(workflow);

      // Add nodes and edges to canvas
      const reactFlowNodes: Node[] = workflow.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      }));

      const reactFlowEdges = workflow.edges.map((e) => ({
        id: e.id || `e-${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        type: 'smoothstep',
        style: { strokeWidth: 2, stroke: '#CCCCCC' },
      }));

      addNodes(reactFlowNodes);
      addEdges(reactFlowEdges);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Workflow generated! I've created ${workflow.nodes.length} nodes and ${workflow.edges.length} connections.`,
        },
      ]);

      setTimeout(() => {
        onClose();
        setIsGenerating(false);
        setGenerating(false);
      }, 1000);
    } catch (error) {
      console.error('Error generating workflow:', error);
      setIsGenerating(false);
      setGenerating(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '500px',
          maxHeight: '80vh',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '20px',
              fontWeight: 600,
              color: '#1a1a1a',
            }}
          >
            Generate Workflow
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor:
                      message.role === 'user'
                        ? '#4CAF50'
                        : 'rgba(0, 0, 0, 0.05)',
                    color: message.role === 'user' ? 'white' : '#1a1a1a',
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '14px',
                    lineHeight: '1.5',
                  }}
                >
                  {message.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isGenerating && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#666' }}>
              <Loader2 size={16} className="animate-spin" />
              <span style={{ fontSize: '12px' }}>Generating...</span>
            </div>
          )}
        </div>

        <div
          style={{
            padding: '20px',
            borderTop: '1px solid rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your workflow request..."
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid #CCCCCC',
                borderRadius: '8px',
                fontFamily: 'var(--font-secondary)',
                fontSize: '14px',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              style={{
                padding: '12px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: input.trim() && !isGenerating ? 'pointer' : 'not-allowed',
                opacity: input.trim() && !isGenerating ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Send size={16} />
            </button>
          </div>
          {messages.length > 1 && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#FFC800',
                color: '#1a1a1a',
                border: 'none',
                borderRadius: '8px',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-primary)',
                fontWeight: 600,
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                opacity: isGenerating ? 0.5 : 1,
              }}
            >
              {isGenerating ? 'Generating...' : 'Generate Workflow'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

