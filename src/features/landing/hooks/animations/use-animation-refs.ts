'use client';

import { useRef, useCallback, createRef } from 'react';
import type { RefObject } from 'react';

/**
 * Type for ref collections
 */
export interface RefCollection<T extends HTMLElement = HTMLElement> {
  [key: string]: RefObject<T | null>;
}

/**
 * Type for array ref collections
 */
export interface ArrayRefCollection<T extends HTMLElement = HTMLElement> {
  [key: string]: RefObject<T | null>[];
}

/**
 * Hook to manage multiple refs with easy access
 */
export function useAnimationRefs<T extends HTMLElement = HTMLElement>() {
  const refsMapRef = useRef<Map<string, RefObject<T | null>>>(new Map());
  const arrayRefsMapRef = useRef<Map<string, RefObject<T | null>[]>>(new Map());

  /**
   * Create and store a ref with a key
   */
  const createRefForKey = useCallback((key: string): RefObject<T | null> => {
    if (!refsMapRef.current.has(key)) {
      const ref = createRef<T>();
      refsMapRef.current.set(key, ref);
    }
    return refsMapRef.current.get(key)!;
  }, []);

  /**
   * Create and store an array of refs
   */
  const createArrayRefs = useCallback((key: string, count: number): RefObject<T | null>[] => {
    if (!arrayRefsMapRef.current.has(key)) {
      const refs = Array.from({ length: count }, () => createRef<T>());
      arrayRefsMapRef.current.set(key, refs);
    }
    return arrayRefsMapRef.current.get(key)!;
  }, []);

  /**
   * Get a ref by key
   */
  const getRef = useCallback((key: string): RefObject<T | null> | undefined => {
    return refsMapRef.current.get(key);
  }, []);

  /**
   * Get array refs by key
   */
  const getArrayRefs = useCallback((key: string): RefObject<T | null>[] | undefined => {
    return arrayRefsMapRef.current.get(key);
  }, []);

  /**
   * Get all refs as an object
   */
  const getAllRefs = useCallback((): RefCollection<T> => {
    const refs: RefCollection<T> = {};
    refsMapRef.current.forEach((ref, key) => {
      refs[key] = ref;
    });
    return refs;
  }, []);

  /**
   * Get all array refs as an object
   */
  const getAllArrayRefs = useCallback((): ArrayRefCollection<T> => {
    const refs: ArrayRefCollection<T> = {};
    arrayRefsMapRef.current.forEach((refArray, key) => {
      refs[key] = refArray;
    });
    return refs;
  }, []);

  /**
   * Clear all refs
   */
  const clearRefs = useCallback(() => {
    refsMapRef.current.clear();
    arrayRefsMapRef.current.clear();
  }, []);

  return {
    createRef: createRefForKey,
    createArrayRefs,
    getRef,
    getArrayRefs,
    getAllRefs,
    getAllArrayRefs,
    clearRefs,
  };
}

/**
 * Hook to create refs for list items
 */
export function useListRefs<T extends HTMLElement = HTMLElement>(initialCount: number = 0) {
  const itemRefsRef = useRef<RefObject<T | null>[]>([]);

  const createItemRefs = useCallback((count: number): RefObject<T | null>[] => {
    if (itemRefsRef.current.length !== count) {
      itemRefsRef.current = Array.from(
        { length: count },
        () => createRef<T>()
      );
    }
    return itemRefsRef.current;
  }, []);

  const getItemRef = useCallback((index: number): RefObject<T | null> | undefined => {
    return itemRefsRef.current[index];
  }, []);

  const getAllItemRefs = useCallback((): RefObject<T | null>[] => {
    return itemRefsRef.current;
  }, []);

  // Initialize with count if provided
  if (initialCount > 0 && itemRefsRef.current.length === 0) {
    createItemRefs(initialCount);
  }

  return {
    createItemRefs,
    getItemRef,
    getAllItemRefs,
    itemRefs: itemRefsRef.current,
  };
}