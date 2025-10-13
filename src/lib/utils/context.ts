// =============================================================================
// REACT CONTEXT UTILITIES
// =============================================================================
// Type-safe React context helpers following best practices
// Provides strict context validation to catch missing providers at runtime

import * as React from 'react';

/**
 * Context provider function type
 * Wraps children with context value
 */
export type ContextProvider<T> = ({
  value,
  children,
}: {
  value: T;
  children?: React.ReactNode;
}) => React.JSX.Element;

/**
 * Context hook function type
 * Returns the context value or throws if used outside provider
 */
export type ContextHook<T> = () => T;

/**
 * Creates a type-safe React context with strict validation
 *
 * Throws a descriptive error if the context hook is used outside its provider,
 * helping catch bugs early during development instead of returning undefined.
 *
 * @param contextName - Descriptive name for the context (used in error messages)
 * @returns Tuple of [Provider component, useContext hook]
 *
 * @example
 * ```typescript
 * // Create a strict theme context
 * type ThemeContextType = {
 *   theme: 'light' | 'dark';
 *   toggleTheme: () => void;
 * };
 *
 * const [ThemeProvider, useTheme] = createStrictContext<ThemeContextType>('Theme');
 *
 * // Use in provider
 * function App() {
 *   const [theme, setTheme] = useState<'light' | 'dark'>('light');
 *
 *   return (
 *     <ThemeProvider value={{ theme, toggleTheme: () => setTheme(t => t === 'light' ? 'dark' : 'light') }}>
 *       <MyComponent />
 *     </ThemeProvider>
 *   );
 * }
 *
 * // Use in consumer
 * function MyComponent() {
 *   const { theme, toggleTheme } = useTheme(); // ✅ Works - inside provider
 *   return <button onClick={toggleTheme}>{theme}</button>;
 * }
 *
 * // Error case
 * function BrokenComponent() {
 *   const { theme } = useTheme(); // ❌ Throws: "useContext must be used within Theme Provider"
 * }
 * ```
 */
export function createStrictContext<T>(
  contextName: string
): readonly [ContextProvider<T>, ContextHook<T>] {
  // Create React context with undefined as default (never used due to strict checking)
  const Context = React.createContext<T | undefined>(undefined);

  /**
   * Provider component that wraps children with context value
   */
  const Provider: ContextProvider<T> = ({ value, children }) =>
    React.createElement(Context.Provider, { value }, children);

  /**
   * Hook to consume the context value
   * Throws error if used outside provider
   */
  const useContextHook: ContextHook<T> = () => {
    const contextValue = React.useContext(Context);

    if (contextValue === undefined) {
      throw new Error(
        `useContext must be used within ${contextName} Provider. ` +
        `Make sure your component is wrapped with <${contextName}Provider>.`
      );
    }

    return contextValue;
  };

  return [Provider, useContextHook] as const;
}

/**
 * Creates a React context with an optional default value
 *
 * Unlike createStrictContext, this allows usage outside a provider
 * by returning the default value when no provider is found.
 *
 * @param contextName - Descriptive name for the context
 * @param defaultValue - Default value to return when used outside provider
 * @returns Tuple of [Provider component, useContext hook]
 *
 * @example
 * ```typescript
 * type TooltipContextType = { delay: number };
 *
 * const [TooltipProvider, useTooltip] = createOptionalContext<TooltipContextType>(
 *   'Tooltip',
 *   { delay: 500 } // Default delay when no provider exists
 * );
 * ```
 */
export function createOptionalContext<T>(
  contextName: string,
  defaultValue: T
): readonly [ContextProvider<T>, ContextHook<T>] {
  const Context = React.createContext<T>(defaultValue);

  const Provider: ContextProvider<T> = ({ value, children }) =>
    React.createElement(Context.Provider, { value }, children);

  const useContextHook: ContextHook<T> = () => {
    return React.useContext(Context);
  };

  return [Provider, useContextHook] as const;
}
