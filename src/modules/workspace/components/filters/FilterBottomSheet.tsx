"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/shadcn/sheet";
import { GroupByFilter } from "./GroupByFilter";
import { SortDropdown } from "./SortDropdown";
import { EmailFilter } from "./EmailFilter";

/**
 * Mobile filter bottom sheet
 * Triggered by button, opens sheet with filter controls
 * Uses shadcn Sheet component (bottom drawer on mobile)
 *
 * @example
 * ```tsx
 * <FilterBottomSheet />
 * ```
 */
export function FilterBottomSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <SlidersHorizontal className="size-4" />
          Filters & Sort
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto">
        <SheetHeader>
          <SheetTitle>Filters & Sorting</SheetTitle>
          <SheetDescription>
            Group, filter, and sort your files
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Group By */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Group by</label>
            <GroupByFilter />
          </div>

          {/* Email Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Filter by person</label>
            <EmailFilter />
          </div>

          {/* Sort */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sort by</label>
            <SortDropdown />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
