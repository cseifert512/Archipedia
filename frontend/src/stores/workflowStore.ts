import { create } from 'zustand';
import { NodeGraph } from '../types/nodes';

interface WorkflowState {
  isGenerating: boolean;
  generatedWorkflow: NodeGraph | null;
  setGenerating: (generating: boolean) => void;
  setGeneratedWorkflow: (workflow: NodeGraph | null) => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  isGenerating: false,
  generatedWorkflow: null,
  setGenerating: (generating: boolean) => set({ isGenerating: generating }),
  setGeneratedWorkflow: (workflow: NodeGraph | null) => set({ generatedWorkflow: workflow }),
}));

