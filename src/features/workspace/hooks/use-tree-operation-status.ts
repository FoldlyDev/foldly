'use client';

import { useState, useCallback } from 'react';

// Status enum pattern as recommended by Kent C. Dodds
export type TreeOperationStatus =
  | 'idle'
  | 'analyzing'
  | 'processing'
  | 'completing'
  | 'success'
  | 'error';

export type TreeOperationType =
  | 'move'
  | 'delete'
  | 'batch_move'
  | 'batch_delete'
  | 'reorder';

export interface TreeOperationProgress {
  current: number;
  total: number;
  currentItem?: string;
  stage: string;
}

export interface TreeOperationState {
  status: TreeOperationStatus;
  operationType: TreeOperationType | null;
  progress: TreeOperationProgress | null;
  error: string | null;
}

export function useTreeOperationStatus() {
  const [operationState, setOperationState] = useState<TreeOperationState>({
    status: 'idle',
    operationType: null,
    progress: null,
    error: null,
  });

  const startOperation = useCallback(
    (
      type: TreeOperationType,
      totalItems: number = 1,
      stage: string = 'Preparing...'
    ) => {
      setOperationState({
        status: 'analyzing',
        operationType: type,
        progress: {
          current: 0,
          total: totalItems,
          stage,
        },
        error: null,
      });
    },
    []
  );

  const updateProgress = useCallback(
    (current: number, currentItem?: string, stage?: string) => {
      setOperationState(prev => ({
        ...prev,
        status: 'processing',
        progress: prev.progress
          ? {
              ...prev.progress,
              current,
              ...(currentItem && { currentItem }),
              ...(stage && { stage }),
            }
          : null,
      }));
    },
    []
  );

  const setCompleting = useCallback((stage: string = 'Finalizing...') => {
    setOperationState(prev => ({
      ...prev,
      status: 'completing',
      progress: prev.progress
        ? {
            ...prev.progress,
            stage,
          }
        : null,
    }));
  }, []);

  const completeOperation = useCallback(() => {
    setOperationState(prev => ({
      ...prev,
      status: 'success',
      progress: prev.progress
        ? {
            ...prev.progress,
            current: prev.progress.total,
            stage: 'Completed',
          }
        : null,
    }));

    // Auto-reset to idle after success
    setTimeout(() => {
      setOperationState({
        status: 'idle',
        operationType: null,
        progress: null,
        error: null,
      });
    }, 1500);
  }, []);

  const failOperation = useCallback((error: string) => {
    setOperationState(prev => ({
      ...prev,
      status: 'error',
      error,
    }));
  }, []);

  const resetOperation = useCallback(() => {
    setOperationState({
      status: 'idle',
      operationType: null,
      progress: null,
      error: null,
    });
  }, []);

  const isOperationInProgress = operationState.status !== 'idle';
  const canInteract = operationState.status === 'idle';

  return {
    operationState,
    startOperation,
    updateProgress,
    setCompleting,
    completeOperation,
    failOperation,
    resetOperation,
    isOperationInProgress,
    canInteract,
  };
}
