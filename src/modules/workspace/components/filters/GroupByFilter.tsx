"use client";

import { List, Mail, Calendar, Folder, FileType } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import { useWorkspaceFilters, type GroupBy } from "../../hooks/use-workspace-filters";

/**
 * Group by filter dropdown
 * Allows users to group files by: None, Email, Date, Folder, Type
 *
 * @example
 * ```tsx
 * <GroupByFilter />
 * ```
 */
export function GroupByFilter() {
  const { groupBy, setGroupBy } = useWorkspaceFilters();

  const groupByOptions: Array<{ value: GroupBy; label: string; icon: React.ReactNode }> = [
    { value: 'none', label: 'None', icon: <List className="size-4" /> },
    { value: 'email', label: 'Email', icon: <Mail className="size-4" /> },
    { value: 'date', label: 'Date', icon: <Calendar className="size-4" /> },
    { value: 'folder', label: 'Folder', icon: <Folder className="size-4" /> },
    { value: 'type', label: 'Type', icon: <FileType className="size-4" /> },
  ];

  return (
    <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupBy)}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Group by" />
      </SelectTrigger>
      <SelectContent>
        {groupByOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              {option.icon}
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
