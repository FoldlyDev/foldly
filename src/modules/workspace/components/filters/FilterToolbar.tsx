"use client";

import { GroupByFilter } from "./GroupByFilter";
import { SortDropdown } from "./SortDropdown";
import { EmailFilter } from "./EmailFilter";

/**
 * Desktop filter toolbar
 * Contains all filter controls in horizontal layout
 *
 * @example
 * ```tsx
 * <FilterToolbar />
 * ```
 */
export function FilterToolbar() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Group by:</span>
        <GroupByFilter />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Filter:</span>
        <EmailFilter />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Sort:</span>
        <SortDropdown />
      </div>
    </div>
  );
}
