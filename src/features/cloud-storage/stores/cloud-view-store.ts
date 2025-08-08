import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CloudProvider } from '@/lib/services/cloud-storage';

interface CloudViewState {
  leftProvider: CloudProvider['id'] | null;
  rightProvider: CloudProvider['id'] | null;
  centerProvider: CloudProvider['id'] | null;
  activePane: 'left' | 'center' | 'right';
  splitSizes: [number, number, number];
  mobileView: 'list' | 'grid';
  selectedFiles: Record<CloudProvider['id'], string[]>;
}

interface CloudViewStore extends CloudViewState {
  // Actions
  setLeftProvider: (provider: CloudProvider['id'] | null) => void;
  setRightProvider: (provider: CloudProvider['id'] | null) => void;
  setCenterProvider: (provider: CloudProvider['id'] | null) => void;
  setActivePane: (pane: 'left' | 'center' | 'right') => void;
  setSplitSizes: (sizes: [number, number, number]) => void;
  setMobileView: (view: 'list' | 'grid') => void;
  toggleFileSelection: (provider: CloudProvider['id'], fileId: string) => void;
  clearSelection: (provider: CloudProvider['id']) => void;
  selectAll: (provider: CloudProvider['id'], fileIds: string[]) => void;
}

export const useCloudViewStore = create<CloudViewStore>()(
  persist(
    (set) => ({
      // Initial state
      leftProvider: null,
      rightProvider: null,
      centerProvider: null,
      activePane: 'center',
      splitSizes: [30, 40, 30],
      mobileView: 'list',
      selectedFiles: {},

      // Actions
      setLeftProvider: (provider) =>
        set((state) => ({ ...state, leftProvider: provider })),

      setRightProvider: (provider) =>
        set((state) => ({ ...state, rightProvider: provider })),

      setCenterProvider: (provider) =>
        set((state) => ({ ...state, centerProvider: provider })),

      setActivePane: (pane) =>
        set((state) => ({ ...state, activePane: pane })),

      setSplitSizes: (sizes) =>
        set((state) => ({ ...state, splitSizes: sizes })),

      setMobileView: (view) =>
        set((state) => ({ ...state, mobileView: view })),

      toggleFileSelection: (provider, fileId) =>
        set((state) => {
          const providerFiles = state.selectedFiles[provider] || [];
          const isSelected = providerFiles.includes(fileId);

          return {
            ...state,
            selectedFiles: {
              ...state.selectedFiles,
              [provider]: isSelected
                ? providerFiles.filter((id) => id !== fileId)
                : [...providerFiles, fileId],
            },
          };
        }),

      clearSelection: (provider) =>
        set((state) => ({
          ...state,
          selectedFiles: {
            ...state.selectedFiles,
            [provider]: [],
          },
        })),

      selectAll: (provider, fileIds) =>
        set((state) => ({
          ...state,
          selectedFiles: {
            ...state.selectedFiles,
            [provider]: fileIds,
          },
        })),
    }),
    {
      name: 'cloud-view-store',
      partialize: (state) => ({
        splitSizes: state.splitSizes,
        mobileView: state.mobileView,
      }),
    }
  )
);