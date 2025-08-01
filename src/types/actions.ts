// Server Action Types
// Standard types for server actions and results

/**
 * Standard result type for server actions
 */
export type ActionResult<T = void> = 
  | { success: true; data?: T }
  | { success: false; error: string };