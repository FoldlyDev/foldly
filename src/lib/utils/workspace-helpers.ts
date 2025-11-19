// =============================================================================
// WORKSPACE UTILITIES
// =============================================================================
// Centralized utilities for workspace file/folder operations
// Pattern: Pure functions, no side effects, immutable operations
// Location: @/lib/utils/workspace-helpers (global utilities per CLAUDE.md)

import type { File, Folder } from '@/lib/database/schemas';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * File type categories for grouping
 */
export type FileTypeCategory =
  | 'Images'
  | 'Documents'
  | 'PDFs'
  | 'Spreadsheets'
  | 'Archives'
  | 'Other';

/**
 * Date range categories for grouping
 */
export type DateRange =
  | 'Today'
  | 'Yesterday'
  | 'This Week'
  | 'Last Week'
  | 'This Month'
  | 'Older';

/**
 * File group with folder metadata
 */
export interface FolderGroup {
  folder: Folder | null; // null for root-level files
  files: File[];
}

/**
 * Sort criteria for files
 */
export type SortBy = 'name' | 'uploadDate' | 'size';

/**
 * Sort direction
 */
export type SortOrder = 'asc' | 'desc';

// =============================================================================
// GROUP BY EMAIL
// =============================================================================

/**
 * Group files by uploader email
 *
 * @param files - Array of files to group
 * @returns Map of email to files (sorted by email alphabetically)
 *
 * @example
 * ```typescript
 * const files = await getWorkspaceFiles(workspaceId);
 * const grouped = groupFilesByEmail(files);
 *
 * grouped.forEach((files, email) => {
 *   console.log(`${email}: ${files.length} files`);
 * });
 * ```
 */
export function groupFilesByEmail(files: File[]): Map<string, File[]> {
  const groups = new Map<string, File[]>();

  for (const file of files) {
    const email = file.uploaderEmail || 'Unknown';

    if (!groups.has(email)) {
      groups.set(email, []);
    }

    groups.get(email)!.push(file);
  }

  // Sort Map keys (emails) alphabetically
  const sortedGroups = new Map(
    Array.from(groups.entries()).sort(([emailA], [emailB]) =>
      emailA.localeCompare(emailB)
    )
  );

  return sortedGroups;
}

/**
 * Get unique uploader emails from files (for filter dropdown)
 *
 * @param files - Array of files
 * @returns Sorted array of unique emails
 *
 * @example
 * ```typescript
 * const emails = getUniqueUploaderEmails(files);
 * // ['alice@example.com', 'bob@company.com', 'charlie@startup.io']
 * ```
 */
export function getUniqueUploaderEmails(files: File[]): string[] {
  const emails = new Set<string>();

  for (const file of files) {
    if (file.uploaderEmail) {
      emails.add(file.uploaderEmail);
    }
  }

  return Array.from(emails).sort((a, b) => a.localeCompare(b));
}

// =============================================================================
// GROUP BY FOLDER
// =============================================================================

/**
 * Group files by parent folder
 *
 * @param files - Array of files to group
 * @param folders - Array of folders for metadata lookup
 * @returns Array of folder groups (sorted by folder name)
 *
 * @example
 * ```typescript
 * const files = await getWorkspaceFiles(workspaceId);
 * const folders = await getRootFolders(workspaceId);
 * const grouped = groupFilesByFolder(files, folders);
 *
 * grouped.forEach(({ folder, files }) => {
 *   const name = folder?.name || 'Root';
 *   console.log(`${name}: ${files.length} files`);
 * });
 * ```
 */
export function groupFilesByFolder(
  files: File[],
  folders: Folder[]
): FolderGroup[] {
  // Create folder lookup map
  const folderMap = new Map<string, Folder>();
  for (const folder of folders) {
    folderMap.set(folder.id, folder);
  }

  // Group files by parent folder ID
  const groups = new Map<string | null, File[]>();

  for (const file of files) {
    const folderId = file.parentFolderId;

    if (!groups.has(folderId)) {
      groups.set(folderId, []);
    }

    groups.get(folderId)!.push(file);
  }

  // Convert to FolderGroup array
  const folderGroups: FolderGroup[] = [];

  for (const [folderId, files] of groups.entries()) {
    const folder = folderId ? folderMap.get(folderId) || null : null;
    folderGroups.push({ folder, files });
  }

  // Sort by folder name (root first, then alphabetically)
  folderGroups.sort((a, b) => {
    if (!a.folder && !b.folder) return 0;
    if (!a.folder) return -1; // Root first
    if (!b.folder) return 1;
    return a.folder.name.localeCompare(b.folder.name);
  });

  return folderGroups;
}

// =============================================================================
// GROUP BY FILE TYPE
// =============================================================================

/**
 * Get file type category from MIME type
 *
 * @param mimeType - MIME type string
 * @returns File type category
 */
function getFileTypeCategory(mimeType: string): FileTypeCategory {
  if (mimeType.startsWith('image/')) {
    return 'Images';
  }

  if (mimeType === 'application/pdf') {
    return 'PDFs';
  }

  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    mimeType.endsWith('.sheet')
  ) {
    return 'Spreadsheets';
  }

  if (
    mimeType.includes('document') ||
    mimeType.includes('word') ||
    mimeType.includes('text') ||
    mimeType === 'application/rtf'
  ) {
    return 'Documents';
  }

  if (
    mimeType.includes('zip') ||
    mimeType.includes('compressed') ||
    mimeType.includes('archive') ||
    mimeType.includes('tar') ||
    mimeType.includes('gzip') ||
    mimeType.includes('rar')
  ) {
    return 'Archives';
  }

  return 'Other';
}

/**
 * Group files by type category
 *
 * @param files - Array of files to group
 * @returns Map of type category to files (ordered by category)
 *
 * @example
 * ```typescript
 * const files = await getWorkspaceFiles(workspaceId);
 * const grouped = groupFilesByType(files);
 *
 * grouped.forEach((files, category) => {
 *   console.log(`${category}: ${files.length} files`);
 * });
 * ```
 */
export function groupFilesByType(files: File[]): Map<FileTypeCategory, File[]> {
  const groups = new Map<FileTypeCategory, File[]>();

  // Initialize all categories in preferred order
  const categories: FileTypeCategory[] = [
    'Images',
    'Documents',
    'PDFs',
    'Spreadsheets',
    'Archives',
    'Other',
  ];

  for (const category of categories) {
    groups.set(category, []);
  }

  // Group files
  for (const file of files) {
    const category = getFileTypeCategory(file.mimeType);
    groups.get(category)!.push(file);
  }

  // Remove empty groups
  const nonEmptyGroups = new Map<FileTypeCategory, File[]>();
  for (const category of categories) {
    const categoryFiles = groups.get(category)!;
    if (categoryFiles.length > 0) {
      nonEmptyGroups.set(category, categoryFiles);
    }
  }

  return nonEmptyGroups;
}

// =============================================================================
// GROUP BY DATE
// =============================================================================

/**
 * Get date range category for a given date
 *
 * @param date - Date to categorize
 * @returns Date range category
 */
function getDateRange(date: Date): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Start of this week (Sunday)

  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(weekStart.getDate() - 7);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const fileDate = new Date(date);
  const fileDateOnly = new Date(
    fileDate.getFullYear(),
    fileDate.getMonth(),
    fileDate.getDate()
  );

  if (fileDateOnly.getTime() === today.getTime()) {
    return 'Today';
  }

  if (fileDateOnly.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }

  if (fileDateOnly >= weekStart) {
    return 'This Week';
  }

  if (fileDateOnly >= lastWeekStart && fileDateOnly < weekStart) {
    return 'Last Week';
  }

  if (fileDateOnly >= monthStart) {
    return 'This Month';
  }

  return 'Older';
}

/**
 * Group files by upload date ranges
 *
 * @param files - Array of files to group
 * @returns Map of date range to files (ordered by recency)
 *
 * @example
 * ```typescript
 * const files = await getWorkspaceFiles(workspaceId);
 * const grouped = groupFilesByDate(files);
 *
 * grouped.forEach((files, range) => {
 *   console.log(`${range}: ${files.length} files`);
 * });
 * ```
 */
export function groupFilesByDate(files: File[]): Map<DateRange, File[]> {
  const groups = new Map<DateRange, File[]>();

  // Initialize all categories in order
  const categories: DateRange[] = [
    'Today',
    'Yesterday',
    'This Week',
    'Last Week',
    'This Month',
    'Older',
  ];
  for (const category of categories) {
    groups.set(category, []);
  }

  // Group files
  for (const file of files) {
    const range = getDateRange(new Date(file.uploadedAt));
    groups.get(range)!.push(file);
  }

  // Remove empty groups
  const nonEmptyGroups = new Map<DateRange, File[]>();
  for (const category of categories) {
    const files = groups.get(category)!;
    if (files.length > 0) {
      nonEmptyGroups.set(category, files);
    }
  }

  return nonEmptyGroups;
}

// =============================================================================
// FOLDER COUNTS
// =============================================================================

/**
 * Folder count metadata
 */
export interface FolderCounts {
  fileCount: number;
  folderCount: number;
  uploaderCount: number;
}

/**
 * Compute file counts and uploader counts for folders
 *
 * @param files - Array of all files in workspace
 * @param folders - Array of folders to compute counts for
 * @returns Map of folder ID to counts
 *
 * @example
 * ```typescript
 * const files = await getWorkspaceFiles(workspaceId);
 * const folders = await getRootFolders(workspaceId);
 * const counts = computeFolderCounts(files, folders);
 *
 * counts.forEach((count, folderId) => {
 *   console.log(`Folder ${folderId}: ${count.fileCount} files, ${count.uploaderCount} uploaders`);
 * });
 * ```
 */
export function computeFolderCounts(
  files: File[],
  folders: Folder[]
): Map<string, FolderCounts> {
  const counts = new Map<string, FolderCounts>();

  // Initialize counts for all folders (including folderCount)
  for (const folder of folders) {
    counts.set(folder.id, { fileCount: 0, folderCount: 0, uploaderCount: 0 });
  }

  // Count files and uploaders for each folder
  for (const folder of folders) {
    const folderFiles = files.filter(
      (file) => file.parentFolderId === folder.id
    );

    // Count unique uploader emails
    const uploaderEmails = new Set<string>();
    for (const file of folderFiles) {
      if (file.uploaderEmail) {
        uploaderEmails.add(file.uploaderEmail);
      }
    }

    counts.set(folder.id, {
      fileCount: folderFiles.length,
      folderCount: 0, // Will be set in next loop
      uploaderCount: uploaderEmails.size,
    });
  }

  // Count subfolders for each folder
  for (const folder of folders) {
    const subfolders = folders.filter(
      (f) => f.parentFolderId === folder.id
    );

    const existing = counts.get(folder.id)!;
    counts.set(folder.id, {
      ...existing,
      folderCount: subfolders.length,
    });
  }

  return counts;
}

// =============================================================================
// SORTING
// =============================================================================

/**
 * Sort files by specified criteria
 *
 * @param files - Array of files to sort
 * @param sortBy - Sort field
 * @param sortOrder - Sort direction
 * @returns New sorted array (does not mutate input)
 *
 * @example
 * ```typescript
 * const files = await getWorkspaceFiles(workspaceId);
 *
 * // Sort by name A-Z
 * const byName = sortFiles(files, 'name', 'asc');
 *
 * // Sort by upload date (newest first)
 * const byDate = sortFiles(files, 'uploadDate', 'desc');
 *
 * // Sort by size (largest first)
 * const bySize = sortFiles(files, 'size', 'desc');
 * ```
 */
export function sortFiles(
  files: File[],
  sortBy: SortBy,
  sortOrder: SortOrder
): File[] {
  // Create shallow copy to avoid mutating input
  const sorted = [...files];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.filename.localeCompare(b.filename);
        break;

      case 'uploadDate':
        comparison =
          new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
        break;

      case 'size':
        comparison = a.fileSize - b.fileSize;
        break;

      default: {
        // Exhaustive check
        const _exhaustive: never = sortBy;
        return _exhaustive;
      }
    }

    // Apply sort order
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Sort folders by name
 *
 * @param folders - Array of folders to sort
 * @param sortOrder - Sort direction
 * @returns New sorted array (does not mutate input)
 *
 * @example
 * ```typescript
 * const folders = await getRootFolders(workspaceId);
 * const sorted = sortFolders(folders, 'asc');
 * ```
 */
export function sortFolders(
  folders: Array<{ id: string; name: string }>,
  sortOrder: SortOrder
): Array<{ id: string; name: string }> {
  const sorted = [...folders];

  sorted.sort((a, b) => {
    const comparison = a.name.localeCompare(b.name);
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
}
