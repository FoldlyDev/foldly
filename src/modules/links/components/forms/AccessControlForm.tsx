"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";
import { Input } from "@/components/ui/aceternityui/input";
import { Label } from "@/components/ui/aceternityui/label";
import { Button } from "@/components/ui/shadcn/button";
import { Badge } from "@/components/ui/shadcn/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import { Card } from "@/components/ui/shadcn/card";
import { Separator } from "@/components/ui/shadcn/separator";
import { Search, Plus, Trash2, AlertCircle, Lock, Globe, Crown } from "lucide-react";
import { DynamicContentLoader } from "@/components/layout/DynamicContentLoader";
import {
  useLinkPermissions,
  useAddPermission,
  useRemovePermission,
  useUpdatePermission,
} from "@/hooks";
import {
  isValidEmail,
  isDuplicateEmail,
  normalizeEmail,
} from "@/lib/utils/validation-helpers";
import type { Link, Permission, PermissionRole } from "@/lib/database/schemas";

// =============================================================================
// TYPES
// =============================================================================

interface AccessControlFormProps {
  link: Link | null | undefined;
  ownerEmail: string;
}

interface PermissionCardProps {
  permission: Permission;
  isOwner: boolean;
  onRoleChange: (email: string, role: string) => void;
  onRemove: (email: string) => void;
}

// =============================================================================
// FIELD COMPONENTS (Smallest Units)
// =============================================================================

/**
 * Search bar for filtering permissions by email
 */
const SearchBar = React.memo<{ value: string; onChange: (value: string) => void }>(
  ({ value, onChange }) => {
    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by email..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10"
        />
      </div>
    );
  }
);
SearchBar.displayName = "SearchBar";

/**
 * Input field for adding new permissions
 */
const AddEmailInput = React.memo<{
  email: string;
  role: string;
  onEmailChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onAdd: () => void;
  disabled?: boolean;
  error?: string;
}>(({ email, role, onEmailChange, onRoleChange, onAdd, disabled, error }) => {
  return (
    <div className="space-y-2">
      <Label>Add Email</Label>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            disabled={disabled}
            aria-invalid={error ? "true" : "false"}
          />
        </div>
        <Select value={role} onValueChange={onRoleChange} disabled={disabled}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="uploader">Uploader</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          onClick={onAdd}
          disabled={disabled || !email.trim()}
          size="icon"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
});
AddEmailInput.displayName = "AddEmailInput";

/**
 * Individual permission card showing email and role
 */
const PermissionCard = React.memo<PermissionCardProps>(
  ({ permission, isOwner, onRoleChange, onRemove }) => {
    return (
      <Card className="p-4 foldly-glass-light dark:foldly-glass">
        <div className="flex items-center justify-between gap-4">
          {/* Email section */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{permission.email}</p>
            {isOwner && (
              <Badge variant="default" className="mt-1 gap-1">
                <Crown className="h-3 w-3" />
                Owner
              </Badge>
            )}
          </div>

          {/* Role dropdown and remove button */}
          <div className="flex items-center gap-2">
            <Select
              value={permission.role}
              onValueChange={(value) => onRoleChange(permission.email, value)}
              disabled={isOwner}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner" disabled>
                  Owner
                </SelectItem>
                <SelectItem value="uploader">Uploader</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(permission.email)}
              disabled={isOwner}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }
);
PermissionCard.displayName = "PermissionCard";

// =============================================================================
// SECTION COMPONENTS
// =============================================================================

/**
 * Link type info badge with description
 */
const LinkTypeInfo = React.memo<{ isPublic: boolean }>(({ isPublic }) => {
  return (
    <div className="flex items-center gap-2">
      <Badge variant={isPublic ? "success" : "outline"} className="gap-1">
        {isPublic ? (
          <>
            <Globe className="h-3 w-3" />
            Public Link
          </>
        ) : (
          <>
            <Lock className="h-3 w-3" />
            Private Link
          </>
        )}
      </Badge>
      <p className="text-sm text-muted-foreground">
        {isPublic
          ? "Anyone can upload. New uploaders are automatically added to this list."
          : "Only listed emails can upload files."}
      </p>
    </div>
  );
});
LinkTypeInfo.displayName = "LinkTypeInfo";

/**
 * Badge filters for role filtering
 */
const RoleBadgeFilters = React.memo<{
  selected: PermissionRole | null;
  onSelect: (role: PermissionRole | null) => void;
}>(({ selected, onSelect }) => {
  const filters: Array<{ role: PermissionRole; label: string }> = [
    { role: "owner", label: "Owner" },
    { role: "editor", label: "Editor" },
    { role: "uploader", label: "Uploader" },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Filter:</span>
      {filters.map((filter) => (
        <Badge
          key={filter.role}
          variant={selected === filter.role ? "default" : "outline"}
          className="cursor-pointer transition-colors hover:opacity-80"
          onClick={() => onSelect(selected === filter.role ? null : filter.role)}
        >
          {filter.label}
        </Badge>
      ))}
    </div>
  );
});
RoleBadgeFilters.displayName = "RoleBadgeFilters";

/**
 * Empty state when no permissions exist (besides owner)
 */
const EmptyState = React.memo<{ isPublic: boolean }>(({ isPublic }) => {
  return (
    <Card className="p-8 foldly-glass-light dark:foldly-glass">
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          {isPublic
            ? "No additional permissions yet. Uploaders will be automatically added when they submit files."
            : "No emails added yet. Add emails above to grant upload access."}
        </p>
      </div>
    </Card>
  );
});
EmptyState.displayName = "EmptyState";

/**
 * Permissions list section
 */
const PermissionsListSection = React.memo<{
  permissions: Permission[];
  ownerEmail: string;
  onRoleChange: (email: string, role: string) => void;
  onRemove: (email: string) => void;
}>(({ permissions, ownerEmail, onRoleChange, onRemove }) => {
  if (permissions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        Permissions ({permissions.length})
      </Label>
      <div className="space-y-2">
        {permissions.map((permission) => (
          <PermissionCard
            key={permission.id}
            permission={permission}
            isOwner={permission.email === ownerEmail}
            onRoleChange={onRoleChange}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
});
PermissionsListSection.displayName = "PermissionsListSection";

// =============================================================================
// MAIN FORM COMPONENT
// =============================================================================

export function AccessControlForm({ link, ownerEmail }: AccessControlFormProps) {
  // Clerk user data for invitation emails
  const { user } = useUser();

  // Local state for UI
  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<PermissionRole | null>(null);
  const [newEmail, setNewEmail] = React.useState("");
  const [newRole, setNewRole] = React.useState<string>("uploader");
  const [inputError, setInputError] = React.useState<string>("");

  // React Query hooks for permissions
  const { data: permissions = [], isLoading, error } = useLinkPermissions(link?.id);
  const addPermission = useAddPermission();
  const removePermission = useRemovePermission();
  const updatePermission = useUpdatePermission();

  // Filter and sort permissions
  const filteredAndSortedPermissions = React.useMemo(() => {
    let filtered = permissions;

    // Stage 1: Filter by role
    if (roleFilter) {
      filtered = filtered.filter((p) => p.role === roleFilter);
    }

    // Stage 2: Filter by email search
    if (searchQuery.trim()) {
      const normalizedQuery = normalizeEmail(searchQuery);
      filtered = filtered.filter((p) =>
        normalizeEmail(p.email).includes(normalizedQuery)
      );
    }

    // Stage 3: Sort (owner always first)
    return [...filtered].sort((a, b) => {
      if (a.role === "owner") return -1;
      if (b.role === "owner") return 1;
      return 0;
    });
  }, [permissions, roleFilter, searchQuery]);

  // Handler functions with backend integration
  const handleAddEmail = async () => {
    if (!link?.id) return;

    if (!newEmail.trim()) {
      setInputError("Email is required");
      return;
    }

    // Email validation using centralized helper
    if (!isValidEmail(newEmail)) {
      setInputError("Please enter a valid email address (e.g., user@example.com)");
      return;
    }

    // Duplicate detection using centralized helper
    if (isDuplicateEmail(newEmail, permissions.map((p) => p.email))) {
      setInputError("This email already has access");
      return;
    }

    try {
      // Construct invitation data (all data is in scope, no additional queries needed)
      const senderName = user?.firstName || user?.username || "Foldly User";
      const senderEmail = user?.primaryEmailAddress?.emailAddress || "";
      const username = user?.username || "";
      const linkUrl = `${window.location.origin}/${username}/${link.slug}`;

      await addPermission.mutateAsync({
        linkId: link.id,
        email: normalizeEmail(newEmail), // Normalize email (trim + lowercase)
        role: newRole as "uploader" | "editor",
        // Optional invitation data (enables automatic email sending)
        invitationData: {
          senderName,
          senderEmail,
          linkName: link.name,
          linkUrl,
          customMessage: link.linkConfig.customMessage || undefined,
        },
      });

      // Reset form on success
      setNewEmail("");
      setNewRole("uploader");
      setInputError("");
    } catch (error) {
      // Error already handled by React Query onError
      console.error("Failed to add permission:", error);
    }
  };

  const handleRoleChange = async (email: string, role: string) => {
    if (!link?.id) return;

    try {
      await updatePermission.mutateAsync({
        linkId: link.id,
        email,
        role: role as "uploader" | "editor",
      });
    } catch (error) {
      // Error already handled by React Query onError
      console.error("Failed to update permission:", error);
    }
  };

  const handleRemove = async (email: string) => {
    if (!link?.id) return;

    try {
      await removePermission.mutateAsync({
        linkId: link.id,
        email,
      });
    } catch (error) {
      // Error already handled by React Query onError
      console.error("Failed to remove permission:", error);
    }
  };

  // Clear input error when email changes
  React.useEffect(() => {
    if (inputError && newEmail) {
      setInputError("");
    }
  }, [newEmail, inputError]);

  if (!link) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No link selected
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <LinkTypeInfo isPublic={link.isPublic} />
        <div className="flex items-center justify-center py-8">
          <DynamicContentLoader text="Loading permissions..." />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <LinkTypeInfo isPublic={link.isPublic} />
        <Card className="p-6 foldly-glass-light dark:foldly-glass">
          <div className="text-center space-y-2">
            <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
            <p className="text-sm text-destructive">
              Failed to load permissions. Please try again.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Check if there are any non-owner permissions in the ORIGINAL list
  const hasNonOwnerPermissions = permissions.length > 1;

  // Check if filters returned no results
  const hasFilteredResults = filteredAndSortedPermissions.length > 0;

  const isSubmitting =
    addPermission.isPending ||
    removePermission.isPending ||
    updatePermission.isPending;

  return (
    <div className="space-y-6">
      {/* Link type info */}
      <div className="space-y-4">
        <LinkTypeInfo isPublic={link.isPublic} />
        <Separator />
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <RoleBadgeFilters selected={roleFilter} onSelect={setRoleFilter} />
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <Separator />
      </div>

      {/* Add email input */}
      <div className="space-y-4">
        <AddEmailInput
          email={newEmail}
          role={newRole}
          onEmailChange={setNewEmail}
          onRoleChange={setNewRole}
          onAdd={handleAddEmail}
          disabled={isSubmitting}
          error={inputError}
        />
        <Separator />
      </div>

      {/* Permissions list */}
      {!hasNonOwnerPermissions ? (
        <EmptyState isPublic={link.isPublic} />
      ) : (searchQuery || roleFilter) && !hasFilteredResults ? (
        <Card className="p-8 foldly-glass-light dark:foldly-glass">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              No permissions found matching your filters
            </p>
          </div>
        </Card>
      ) : (
        <PermissionsListSection
          permissions={filteredAndSortedPermissions}
          ownerEmail={ownerEmail}
          onRoleChange={handleRoleChange}
          onRemove={handleRemove}
        />
      )}
    </div>
  );
}
