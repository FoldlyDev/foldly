"use client";

import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import { Button } from "@/components/ui/shadcn/button";
import { useWorkspaceFilters } from "../../hooks/use-workspace-filters";
import { useWorkspaceFiles } from "@/hooks";
import { getUniqueUploaderEmails } from "@/lib/utils/workspace-helpers";

/**
 * Email filter dropdown
 * Shows unique uploader emails from workspace files
 * Allows filtering by specific email
 *
 * @example
 * ```tsx
 * <EmailFilter />
 * ```
 */
export function EmailFilter() {
  const { filterEmail, setFilterEmail } = useWorkspaceFilters();
  const { data: files } = useWorkspaceFiles();

  // Get unique emails from files
  const uniqueEmails = files ? getUniqueUploaderEmails(files) : [];

  const hasFilter = filterEmail !== null;

  return (
    <div className="flex items-center gap-2">
      <Select
        value={filterEmail || 'all'}
        onValueChange={(value) => setFilterEmail(value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Filter by email" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All people</SelectItem>
          {uniqueEmails.length > 0 && (
            <>
              {uniqueEmails.map((email) => (
                <SelectItem key={email} value={email}>
                  {email}
                </SelectItem>
              ))}
            </>
          )}
          {uniqueEmails.length === 0 && (
            <SelectItem value="no-emails" disabled>
              No uploaders yet
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      {hasFilter && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setFilterEmail(null)}
          aria-label="Clear email filter"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
