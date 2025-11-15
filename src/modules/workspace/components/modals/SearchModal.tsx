"use client";

import * as React from "react";
import { Modal, ModalContent, ModalTitle } from "@/components/ui/animateui/dialog";
import { Input } from "@/components/ui/aceternityui/input";
import { Search, Loader2, File, Folder, X, Eye, MapPin } from "lucide-react";
import { useDebouncedValue } from "@/hooks/utility/use-debounced-value";
import { useSearchFiles } from "@/hooks/data/use-files";
import { useFoldersByParent } from "@/hooks/data/use-folders";
import { textContainsQuery } from "@/lib/utils/text-highlight";
import { HighlightText } from "@/components/ui/highlight-text";
import { isPreviewableFile } from "@/lib/utils/file-helpers";
import type { File as FileType, Folder as FolderType } from "@/lib/database/schemas";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/shadcn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/animateui/dropdown-menu";

/**
 * Props for SearchModal component
 */
export interface SearchModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Callback when modal open state changes
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Callback when a file is selected for preview
   */
  onFileSelect?: (file: FileType) => void;

  /**
   * Callback when a file location should be revealed (navigate to parent folder)
   */
  onLocateFile?: (file: FileType) => void;

  /**
   * Callback when a folder is selected
   */
  onFolderSelect?: (folder: FolderType) => void;

  /**
   * Current folder ID (for folder context)
   */
  currentFolderId?: string | null;
}

/**
 * Search result item type
 */
type SearchResultItem = {
  type: "file" | "folder";
  data: FileType | FolderType;
  id: string;
  name: string;
};

/**
 * Global search modal for workspace
 *
 * Features:
 * - Server-side file search (PostgreSQL ILIKE substring matching)
 * - Client-side folder filtering
 * - Keyboard navigation (↑↓ to navigate, Enter to select, ESC to close)
 * - Text highlighting for matches
 * - Debounced search input (300ms)
 * - File action menu (Preview/Locate) for previewable files
 *
 * @example
 * ```tsx
 * const searchModal = useModalState();
 *
 * <SearchModal
 *   isOpen={searchModal.isOpen}
 *   onOpenChange={(open) => !open && searchModal.close()}
 *   onFileSelect={handlePreviewFile}
 *   onLocateFile={handleLocateFile}
 *   onFolderSelect={handleFolderSelect}
 * />
 * ```
 */
export function SearchModal({
  isOpen,
  onOpenChange,
  onFileSelect,
  onLocateFile,
  onFolderSelect,
  currentFolderId,
}: SearchModalProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Debounce search query for server-side search
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  // Server-side file search (PostgreSQL full-text search)
  const { data: searchedFiles = [], isLoading: isSearchingFiles } = useSearchFiles(
    debouncedQuery,
    { enabled: debouncedQuery.trim().length >= 2 }
  );

  // Get all folders for client-side filtering
  const { data: allFolders = [] } = useFoldersByParent(currentFolderId ?? null);

  // Client-side folder filtering
  const filteredFolders = React.useMemo(() => {
    if (debouncedQuery.trim().length < 2) {
      return [];
    }
    return allFolders.filter((folder) =>
      textContainsQuery(folder.name, debouncedQuery)
    );
  }, [allFolders, debouncedQuery]);

  // Combine folders and files into unified result list
  const searchResults: SearchResultItem[] = React.useMemo(() => {
    const results: SearchResultItem[] = [];

    // Add folders first
    filteredFolders.forEach((folder) => {
      results.push({
        type: "folder",
        data: folder,
        id: folder.id,
        name: folder.name,
      });
    });

    // Add files
    searchedFiles.forEach((file) => {
      results.push({
        type: "file",
        data: file,
        id: file.id,
        name: file.filename,
      });
    });

    return results;
  }, [filteredFolders, searchedFiles]);

  const isSearching = isSearchingFiles;
  const hasQuery = debouncedQuery.trim().length >= 2;
  const hasResults = searchResults.length > 0;

  // Reset selected index when results change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  // Focus input when modal opens
  React.useEffect(() => {
    if (isOpen) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // Reset state when modal closes
      setSearchQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < searchResults.length - 1 ? prev + 1 : prev
          );
          break;

        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;

        case "Enter":
          e.preventDefault();
          if (searchResults[selectedIndex]) {
            handleSelectResult(searchResults[selectedIndex]);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, searchResults, selectedIndex]);

  const handleSelectResult = (result: SearchResultItem) => {
    if (result.type === "file") {
      onFileSelect?.(result.data as FileType);
    } else {
      onFolderSelect?.(result.data as FolderType);
    }
    onOpenChange(false);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    inputRef.current?.focus();
  };

  return (
    <Modal open={isOpen} onOpenChange={onOpenChange}>
      <ModalContent
        background="foldly-glass-light-solid"
        className="sm:max-w-2xl p-4 gap-0 overflow-hidden"
      >
        {/* Visually hidden title for accessibility */}
        <ModalTitle className="sr-only">Search files and folders</ModalTitle>

        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-4 w-full">
          <Search className="size-5 text-white shrink-0" />
          <div className="flex-1">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              background="none"
              className="border-0 shadow-none focus-visible:ring-0 text-base h-auto py-0 text-white placeholder:text-white/50 !bg-transparent"
            />
          </div>
          {searchQuery && (
            <Button
              onClick={handleClearSearch}
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white h-auto py-1 px-2"
            >
              Clear
            </Button>
          )}
          {isSearching && (
            <Loader2 className="size-4 animate-spin text-white shrink-0" />
          )}
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {hasQuery && isSearching && (
            <div className="py-12 text-center text-sm text-white">
              <Loader2 className="size-12 mx-auto mb-3 animate-spin opacity-30 text-white" />
              <p>Searching...</p>
            </div>
          )}

          {hasQuery && !isSearching && !hasResults && (
            <div className="py-12 text-center text-sm text-white">
              <Search className="size-12 mx-auto mb-3 opacity-30 text-white" />
              <p>No files or folders found</p>
              <p className="text-xs mt-1 text-white/70">Try a different search term</p>
            </div>
          )}

          {hasQuery && !isSearching && hasResults && (
            <div className="py-2">
              {/* Folders Section */}
              {filteredFolders.length > 0 && (
                <div className="mb-4">
                  <div className="px-4 py-2 text-xs font-medium text-white/70 uppercase tracking-wider">
                    Folders ({filteredFolders.length})
                  </div>
                  {searchResults
                    .filter((r) => r.type === "folder")
                    .map((result, index) => (
                      <button
                        key={result.id}
                        onClick={() => handleSelectResult(result)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-white",
                          selectedIndex === index && "bg-white/10"
                        )}
                      >
                        <Folder className="size-5 text-blue-400 shrink-0" />
                        <span className="flex-1 truncate">
                          <HighlightText
                            text={result.name}
                            query={debouncedQuery}
                          />
                        </span>
                      </button>
                    ))}
                </div>
              )}

              {/* Files Section */}
              {searchedFiles.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-white/70 uppercase tracking-wider">
                    Files ({searchedFiles.length})
                  </div>
                  {searchResults
                    .filter((r) => r.type === "file")
                    .map((result, index) => {
                      const globalIndex = filteredFolders.length + index;
                      const file = result.data as FileType;
                      const canPreview = isPreviewableFile(file.mimeType);

                      return (
                        <DropdownMenu key={result.id}>
                          <DropdownMenuTrigger asChild>
                            <button
                              className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-white",
                                selectedIndex === globalIndex && "bg-white/10"
                              )}
                            >
                              <File className="size-5 text-white/60 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="truncate">
                                  <HighlightText
                                    text={result.name}
                                    query={debouncedQuery}
                                  />
                                </div>
                                {file.uploaderEmail && (
                                  <div className="text-xs text-white/70 truncate">
                                    <HighlightText
                                      text={file.uploaderEmail}
                                      query={debouncedQuery}
                                      highlightClassName="bg-yellow-400/30 text-yellow-100"
                                    />
                                  </div>
                                )}
                              </div>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-40"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {canPreview && onFileSelect && (
                              <DropdownMenuItem
                                onClick={() => {
                                  onFileSelect(file);
                                  onOpenChange(false);
                                }}
                              >
                                <Eye className="mr-2 size-4" />
                                Preview
                              </DropdownMenuItem>
                            )}
                            {onLocateFile && (
                              <DropdownMenuItem
                                onClick={() => {
                                  onLocateFile(file);
                                  onOpenChange(false);
                                }}
                              >
                                <MapPin className="mr-2 size-4" />
                                Locate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with keyboard hints */}
        {hasResults && (
          <div className="border-t border-white/10 px-4 py-2 flex items-center justify-between text-xs text-white/80">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-[10px] text-white">
                  ↑↓
                </kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-[10px] text-white">
                  Enter
                </kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-[10px] text-white">
                  ESC
                </kbd>
                Close
              </span>
            </div>
            <span className="text-[10px] text-white/60">
              {searchResults.length} result{searchResults.length !== 1 && "s"}
            </span>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
