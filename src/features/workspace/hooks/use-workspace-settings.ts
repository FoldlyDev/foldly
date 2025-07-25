import { useState, useEffect, useCallback } from 'react';
import {
  getWorkspaceByUserId,
  updateWorkspaceAction,
} from '@/lib/actions/workspace-actions';
import type { Workspace, WorkspaceUpdate } from '@/lib/supabase/types';

interface UseWorkspaceSettingsReturn {
  workspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
  updateWorkspace: (updates: WorkspaceUpdate) => Promise<boolean>;
  refreshWorkspace: () => Promise<void>;
}

export function useWorkspaceSettings(): UseWorkspaceSettingsReturn {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspace = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getWorkspaceByUserId();

      if (result.success && result.data) {
        setWorkspace(result.data);
        console.log(`✅ WORKSPACE_FETCHED: ${result.data.id}`);
      } else {
        setWorkspace(null);
        setError(result.error || 'Failed to fetch workspace');
        console.error(`❌ WORKSPACE_FETCH_FAILED:`, result.error);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch workspace';
      setError(errorMessage);
      setWorkspace(null);
      console.error(`❌ WORKSPACE_FETCH_ERROR:`, err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateWorkspace = useCallback(
    async (updates: WorkspaceUpdate): Promise<boolean> => {
      if (!workspace) {
        setError('No workspace to update');
        return false;
      }

      try {
        setError(null);

        const result = await updateWorkspaceAction(workspace.id, updates);

        if (result.success && result.data) {
          setWorkspace(result.data);
          console.log(`✅ WORKSPACE_UPDATED: ${workspace.id}`, updates);
          return true;
        } else {
          setError(result.error || 'Failed to update workspace');
          console.error(
            `❌ WORKSPACE_UPDATE_FAILED: ${workspace.id}`,
            result.error
          );
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update workspace';
        setError(errorMessage);
        console.error(`❌ WORKSPACE_UPDATE_ERROR: ${workspace.id}`, err);
        return false;
      }
    },
    [workspace]
  );

  const refreshWorkspace = useCallback(async () => {
    await fetchWorkspace();
  }, [fetchWorkspace]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  return {
    workspace,
    isLoading,
    error,
    updateWorkspace,
    refreshWorkspace,
  };
}
