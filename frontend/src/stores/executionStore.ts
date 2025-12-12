/**
 * Execution Store
 * Manages workflow execution state, progress, and history
 */

import { create } from 'zustand';
import { NodeExecutionResult } from '../lib/workflowEngine';

export interface ExecutionLogEntry {
  nodeId: string;
  timestamp: number;
  result: NodeExecutionResult;
  duration: number;
}

export interface ExecutionState {
  isExecuting: boolean;
  currentStep: number;
  totalSteps: number;
  executingNodeId: string | null;
  executionLog: ExecutionLogEntry[];
  startTime: number | null;
  endTime: number | null;
  error: string | null;
  
  // Actions
  startExecution: (totalSteps: number) => void;
  updateProgress: (step: number, nodeId: string) => void;
  logExecution: (nodeId: string, result: NodeExecutionResult, duration: number) => void;
  completeExecution: () => void;
  failExecution: (error: string) => void;
  clearExecution: () => void;
  clearLog: () => void;
}

export const useExecutionStore = create<ExecutionState>((set) => ({
  isExecuting: false,
  currentStep: 0,
  totalSteps: 0,
  executingNodeId: null,
  executionLog: [],
  startTime: null,
  endTime: null,
  error: null,

  startExecution: (totalSteps: number) => {
    set({
      isExecuting: true,
      currentStep: 0,
      totalSteps,
      executingNodeId: null,
      startTime: Date.now(),
      endTime: null,
      error: null,
    });
  },

  updateProgress: (step: number, nodeId: string) => {
    set({
      currentStep: step,
      executingNodeId: nodeId,
    });
  },

  logExecution: (nodeId: string, result: NodeExecutionResult, duration: number) => {
    set((state) => ({
      executionLog: [
        ...state.executionLog,
        {
          nodeId,
          timestamp: Date.now(),
          result,
          duration,
        },
      ],
    }));
  },

  completeExecution: () => {
    set({
      isExecuting: false,
      executingNodeId: null,
      endTime: Date.now(),
      error: null,
    });
  },

  failExecution: (error: string) => {
    set({
      isExecuting: false,
      executingNodeId: null,
      endTime: Date.now(),
      error,
    });
  },

  clearExecution: () => {
    set({
      isExecuting: false,
      currentStep: 0,
      totalSteps: 0,
      executingNodeId: null,
      startTime: null,
      endTime: null,
      error: null,
    });
  },

  clearLog: () => {
    set({
      executionLog: [],
    });
  },
}));


