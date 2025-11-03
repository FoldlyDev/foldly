"use client";

import type { File } from "@/lib/database/schemas";
import { FileCard } from "../ui/FileCard";
import { EmptyFilesState } from "../ui/EmptyFilesState";
import type { GroupBy } from "../../hooks/use-workspace-filters";
import type { DateRange } from "@/lib/utils/workspace-helpers";

/**
 * Grouped file list section
 * Renders files grouped by email, date, folder, or type
 *
 * @example
 * ```tsx
 * <GroupedFileList
 *   groups={groupedFiles}
 *   groupBy="email"
 *   onViewFile={handleViewFile}
 * />
 * ```
 */
interface GroupedFileListProps<T extends string> {
  /**
   * Grouped files
   */
  groups: Map<T, File[]>;

  /**
   * Grouping mode
   */
  groupBy: GroupBy;

  /**
   * Callback when previewing a file
   */
  onPreviewFile?: (file: File) => void;

  /**
   * Callback when downloading a file
   */
  onDownloadFile?: (file: File) => void;

  /**
   * Callback when deleting a file
   */
  onDeleteFile?: (file: File) => void;

  /**
   * Selected file IDs
   */
  selectedFiles?: Set<string>;

  /**
   * Callback when selecting a file
   */
  onSelectFile?: (fileId: string) => void;

  /**
   * Whether to show selection checkboxes
   */
  showCheckboxes?: boolean;
}

export function GroupedFileList<T extends string>({
  groups,
  groupBy,
  onPreviewFile,
  onDownloadFile,
  onDeleteFile,
  selectedFiles = new Set(),
  onSelectFile,
  showCheckboxes = false,
}: GroupedFileListProps<T>) {
  // Empty state
  if (groups.size === 0) {
    return <EmptyFilesState />;
  }

  return (
    <div className="space-y-8">
      {Array.from(groups.entries()).map(([groupKey, filesInGroup]) => {
        if (filesInGroup.length === 0) return null;

        return (
          <section key={groupKey}>
            {/* Group Header */}
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">
                {formatGroupHeader(groupKey, groupBy)} ({filesInGroup.length})
              </h3>
            </div>

            {/* Files Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filesInGroup.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onPreview={onPreviewFile ? () => onPreviewFile(file) : undefined}
                  onDownload={
                    onDownloadFile ? () => onDownloadFile(file) : undefined
                  }
                  onDelete={
                    onDeleteFile ? () => onDeleteFile(file) : undefined
                  }
                  isSelected={selectedFiles.has(file.id)}
                  onSelect={
                    onSelectFile ? () => onSelectFile(file.id) : undefined
                  }
                  showCheckbox={showCheckboxes}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/**
 * Format group header based on grouping mode
 */
function formatGroupHeader(groupKey: string, groupBy: GroupBy): string {
  switch (groupBy) {
    case "email":
      return groupKey === "Unknown" ? "Unknown Uploader" : groupKey;

    case "date":
      return groupKey as DateRange;

    case "folder":
      return groupKey === "root" ? "Root Folder" : groupKey;

    case "type":
      return groupKey;

    case "none":
      return "All Files";

    default: {
      const _exhaustive: never = groupBy;
      return _exhaustive;
    }
  }
}
