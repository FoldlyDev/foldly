"use client";

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import { Button } from "@/components/ui/shadcn/button";
import { useWorkspaceFilters, type SortBy } from "../../hooks/use-workspace-filters";

/**
 * Sort dropdown with order toggle
 * Allows users to sort by: Name, Upload Date, Size
 * Toggle between ascending/descending
 *
 * @example
 * ```tsx
 * <SortDropdown />
 * ```
 */
export function SortDropdown() {
  const { sortBy, setSortBy, sortOrder, toggleSortOrder } = useWorkspaceFilters();

  const sortByOptions: Array<{ value: SortBy; label: string }> = [
    { value: 'name', label: 'Name' },
    { value: 'uploadDate', label: 'Upload Date' },
    { value: 'size', label: 'Size' },
  ];

  return (
    <div className="flex items-center gap-2">
      <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sortByOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={toggleSortOrder}
        aria-label={`Sort ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
      >
        {sortOrder === 'asc' ? (
          <ArrowUp className="size-4" />
        ) : (
          <ArrowDown className="size-4" />
        )}
      </Button>
    </div>
  );
}
