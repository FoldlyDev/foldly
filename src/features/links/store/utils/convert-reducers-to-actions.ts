/**
 * Zustand Architecture Utility - 2025 Best Practices
 * Converts pure reducers to Zustand actions following modern patterns
 * Based on: https://brainhub.eu/library/zustand-architecture-patterns-at-scale
 */

import type { StateCreator } from 'zustand';

/**
 * Converts pure reducer functions to Zustand actions
 * Enables clean separation between business logic (reducers) and UI integration (actions)
 *
 * @param set - Zustand's set function
 * @param reducers - Object containing pure reducer functions
 * @returns Object with action functions that dispatch events to reducers
 *
 * @example
 * const reducers = {
 *   addLink: (state, link) => ({ ...state, links: [...state.links, link] }),
 *   removeLink: (state, id) => ({ ...state, links: state.links.filter(l => l.id !== id) })
 * }
 *
 * const store = create((set) => ({
 *   links: [],
 *   ...convertReducersToActions(set, reducers)
 * }))
 */
export const convertReducersToActions = <
  TState,
  TReducers extends Record<string, Function>,
>(
  set: (
    partial:
      | TState
      | Partial<TState>
      | ((state: TState) => TState | Partial<TState>),
    replace?: boolean,
    action?: any
  ) => void,
  reducers: TReducers
): {
  [K in keyof TReducers]: TReducers[K] extends (
    state: any,
    ...args: infer Args
  ) => any
    ? (...args: Args) => void
    : never;
} => {
  const entries = Object.entries(reducers);

  const actions = entries.map(([type, fn]) => [
    type,
    (...args: any[]) =>
      set((state: TState) => fn(state, ...args), false, { type, args }),
  ]);

  return Object.fromEntries(actions) as any;
};

/**
 * Type-safe reducer definition helper
 * Ensures reducers follow the (state, ...args) => newState pattern
 */
export type Reducer<TState, TArgs extends readonly unknown[] = []> = (
  state: TState,
  ...args: TArgs
) => TState;

/**
 * Helper to create type-safe reducer objects
 */
export const createReducers = <
  TState,
  TReducers extends Record<string, Reducer<TState, any>>,
>(
  reducers: TReducers
): TReducers => reducers;
