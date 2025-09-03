import type { TreeItem } from '../types/tree-types';

/**
 * Centralized sorting logic for tree children
 * This is the ONLY place where sorting should happen
 * 
 * Sort order:
 * 1. By sortOrder (ascending) - negative values come first
 * 2. By type (folders before files) - only if sortOrder is identical
 * 3. By name (alphabetical) - final fallback
 */
export function sortChildren(
  childIds: string[],
  data: Record<string, TreeItem>
): string[] {
  return [...childIds].sort((aId, bId) => {
    const a = data[aId];
    const b = data[bId];
    if (!a || !b) return 0;
    
    // Primary: Sort by sortOrder - lower values come first
    // New items have negative sortOrder, existing items have 0+
    const aSortOrder = (a as any).sortOrder ?? 999;
    const bSortOrder = (b as any).sortOrder ?? 999;
    if (aSortOrder !== bSortOrder) {
      return aSortOrder - bSortOrder;
    }
    
    // Secondary: If sortOrder is identical, folders before files
    // This only applies to items with the same sortOrder (edge case)
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    
    // Tertiary: Alphabetical by name
    return a.name.localeCompare(b.name);
  });
}

/**
 * Insert a new item into a sorted children array at the correct position
 * This maintains sort order without re-sorting the entire array
 */
export function insertChildSorted(
  childIds: string[],
  newChildId: string,
  data: Record<string, TreeItem>
): string[] {
  const newItem = data[newChildId];
  if (!newItem) return childIds;
  
  const newSortOrder = (newItem as any).sortOrder ?? 999;
  
  // Find the correct insertion position
  let insertIndex = childIds.length;
  for (let i = 0; i < childIds.length; i++) {
    const existingItem = data[childIds[i]];
    if (!existingItem) continue;
    
    const existingSortOrder = (existingItem as any).sortOrder ?? 999;
    
    // Insert before first item with higher sortOrder
    if (newSortOrder < existingSortOrder) {
      insertIndex = i;
      break;
    }
    
    // If sortOrder is the same, check type
    if (newSortOrder === existingSortOrder) {
      if (newItem.type === 'folder' && existingItem.type === 'file') {
        insertIndex = i;
        break;
      }
      
      // If same type too, check name
      if (newItem.type === existingItem.type && 
          newItem.name.localeCompare(existingItem.name) < 0) {
        insertIndex = i;
        break;
      }
    }
  }
  
  // Insert at the found position
  const result = [...childIds];
  result.splice(insertIndex, 0, newChildId);
  return result;
}