import { create } from 'zustand';

interface GeneratingLinksState {
  generatingItems: Set<string>;
  foldersWithLinks: Set<string>;
  addGeneratingItem: (folderId: string) => void;
  removeGeneratingItem: (folderId: string) => void;
  setFoldersWithLinks: (folderIds: string[]) => void;
  addFolderWithLink: (folderId: string) => void;
  hasFolderLink: (folderId: string) => boolean;
  isGenerating: (folderId: string) => boolean;
}

export const useGeneratingLinksStore = create<GeneratingLinksState>((set, get) => ({
  generatingItems: new Set(),
  foldersWithLinks: new Set(),
  
  addGeneratingItem: (folderId: string) => {
    set((state) => ({
      generatingItems: new Set(state.generatingItems).add(folderId),
    }));
  },
  
  removeGeneratingItem: (folderId: string) => {
    set((state) => {
      const newSet = new Set(state.generatingItems);
      newSet.delete(folderId);
      return { generatingItems: newSet };
    });
  },
  
  setFoldersWithLinks: (folderIds: string[]) => {
    set({ foldersWithLinks: new Set(folderIds) });
  },
  
  addFolderWithLink: (folderId: string) => {
    set((state) => ({
      foldersWithLinks: new Set(state.foldersWithLinks).add(folderId),
    }));
  },
  
  hasFolderLink: (folderId: string) => {
    return get().foldersWithLinks.has(folderId);
  },
  
  isGenerating: (folderId: string) => {
    return get().generatingItems.has(folderId);
  },
}));