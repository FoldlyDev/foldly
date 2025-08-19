/**
 * Utility functions for managing checkbox state in the file tree
 * These functions allow programmatic control of checkbox selection
 */

/**
 * Get all checked items from the tree
 */
export const getCheckedItems = (treeInstance: any): string[] => {
  if (!treeInstance?.getState) return [];
  const state = treeInstance.getState();
  return state.checkedItems || [];
};

/**
 * Clear all checked items
 */
export const clearCheckedItems = (treeInstance: any): void => {
  if (!treeInstance?.clearCheckedItems) return;
  treeInstance.clearCheckedItems();
};

/**
 * Check specific items programmatically
 */
export const checkItems = (treeInstance: any, itemIds: string[]): void => {
  if (!treeInstance?.checkItems) return;
  treeInstance.checkItems(itemIds);
};

/**
 * Uncheck specific items programmatically
 */
export const uncheckItems = (treeInstance: any, itemIds: string[]): void => {
  if (!treeInstance?.uncheckItems) return;
  treeInstance.uncheckItems(itemIds);
};

/**
 * Toggle checked state for specific items
 */
export const toggleCheckItems = (treeInstance: any, itemIds: string[]): void => {
  if (!treeInstance?.getState) return;
  
  const state = treeInstance.getState();
  const currentlyChecked = state.checkedItems || [];
  
  itemIds.forEach(id => {
    if (currentlyChecked.includes(id)) {
      uncheckItems(treeInstance, [id]);
    } else {
      checkItems(treeInstance, [id]);
    }
  });
};

/**
 * Check all items in the tree
 */
export const checkAllItems = (treeInstance: any, treeData: Record<string, any>): void => {
  const allItemIds = Object.keys(treeData);
  checkItems(treeInstance, allItemIds);
};

/**
 * Get checked items with their data
 */
export const getCheckedItemsData = (
  treeInstance: any, 
  treeData: Record<string, any>
): any[] => {
  const checkedIds = getCheckedItems(treeInstance);
  return checkedIds.map(id => treeData[id]).filter(Boolean);
};