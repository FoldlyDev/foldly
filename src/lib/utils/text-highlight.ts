/**
 * Text Highlighting Utilities
 * Pure functions for highlighting search matches in text
 */

/**
 * Options for text highlighting
 */
export interface HighlightOptions {
  /**
   * Whether the search should be case-sensitive
   * @default false
   */
  caseSensitive?: boolean;

  /**
   * Whether to match whole words only
   * @default false
   */
  wholeWord?: boolean;
}

/**
 * A segment of text that may or may not be highlighted
 */
export interface TextSegment {
  /**
   * The text content
   */
  text: string;

  /**
   * Whether this segment should be highlighted
   */
  highlighted: boolean;
}

/**
 * Escapes special regex characters in a string
 * @param str - String to escape
 * @returns Escaped string safe for regex
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Splits text into segments, marking which parts match the search query
 *
 * @param text - The text to search within
 * @param query - The search query to highlight
 * @param options - Highlighting options
 * @returns Array of text segments with highlight flags
 *
 * @example
 * ```typescript
 * const segments = getHighlightSegments('My Invoice File.pdf', 'invoice');
 * // Returns: [
 * //   { text: 'My ', highlighted: false },
 * //   { text: 'Invoice', highlighted: true },
 * //   { text: ' File.pdf', highlighted: false }
 * // ]
 * ```
 */
export function getHighlightSegments(
  text: string,
  query: string,
  options: HighlightOptions = {}
): TextSegment[] {
  const { caseSensitive = false, wholeWord = false } = options;

  // If no query, return single unhighlighted segment
  if (!query || !query.trim()) {
    return [{ text, highlighted: false }];
  }

  try {
    // Escape special regex characters
    const escapedQuery = escapeRegExp(query.trim());

    // Build regex pattern
    const pattern = wholeWord ? `\\b${escapedQuery}\\b` : escapedQuery;
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(pattern, flags);

    // Split text by matches
    const parts = text.split(regex);
    const matches = text.match(regex);

    if (!matches || matches.length === 0) {
      return [{ text, highlighted: false }];
    }

    // Build segments array
    const segments: TextSegment[] = [];

    parts.forEach((part, index) => {
      // Add non-highlighted part
      if (part) {
        segments.push({ text: part, highlighted: false });
      }

      // Add highlighted match
      if (matches[index]) {
        segments.push({ text: matches[index], highlighted: true });
      }
    });

    return segments;
  } catch (error) {
    // If regex fails, return original text unhighlighted
    console.warn('Failed to create highlight segments:', error);
    return [{ text, highlighted: false }];
  }
}

/**
 * Checks if a text contains a search query (case-insensitive by default)
 *
 * @param text - The text to search within
 * @param query - The search query
 * @param options - Search options
 * @returns True if text contains the query
 *
 * @example
 * ```typescript
 * textContainsQuery('Invoice.pdf', 'invoice'); // true
 * textContainsQuery('Invoice.pdf', 'report'); // false
 * ```
 */
export function textContainsQuery(
  text: string,
  query: string,
  options: HighlightOptions = {}
): boolean {
  const { caseSensitive = false } = options;

  if (!query || !query.trim()) {
    return true; // Empty query matches everything
  }

  const searchText = caseSensitive ? text : text.toLowerCase();
  const searchQuery = caseSensitive ? query.trim() : query.trim().toLowerCase();

  return searchText.includes(searchQuery);
}
