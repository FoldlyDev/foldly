import * as React from 'react';
import { getHighlightSegments, type HighlightOptions } from '@/lib/utils/text-highlight';
import { cn } from '@/lib/utils';

/**
 * Props for HighlightText component
 */
export interface HighlightTextProps extends HighlightOptions {
  /**
   * The text to search within and display
   */
  text: string;

  /**
   * The search query to highlight
   */
  query: string;

  /**
   * CSS class to apply to highlighted segments
   * @default 'bg-yellow-200 dark:bg-yellow-900/50 font-medium rounded px-0.5'
   */
  highlightClassName?: string;

  /**
   * Additional className for the container
   */
  className?: string;
}

/**
 * Component that highlights matching text within a string
 *
 * Uses pure utility function to split text into segments,
 * then renders with visual highlighting for matches.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <HighlightText text="My Invoice File.pdf" query="invoice" />
 *
 * // Custom highlight style
 * <HighlightText
 *   text="Annual Report 2024.pdf"
 *   query="report"
 *   highlightClassName="bg-blue-200 text-blue-900"
 * />
 *
 * // Case-sensitive matching
 * <HighlightText
 *   text="JavaScript vs javascript"
 *   query="JavaScript"
 *   caseSensitive
 * />
 * ```
 */
export function HighlightText({
  text,
  query,
  className,
  highlightClassName = 'bg-yellow-200 dark:bg-yellow-900/50 font-medium rounded px-0.5',
  caseSensitive,
  wholeWord,
}: HighlightTextProps) {
  // Get text segments with highlight flags
  const segments = getHighlightSegments(text, query, {
    caseSensitive,
    wholeWord,
  });

  return (
    <span className={cn(className)}>
      {segments.map((segment, index) =>
        segment.highlighted ? (
          <span key={index} className={highlightClassName}>
            {segment.text}
          </span>
        ) : (
          <React.Fragment key={index}>{segment.text}</React.Fragment>
        )
      )}
    </span>
  );
}
