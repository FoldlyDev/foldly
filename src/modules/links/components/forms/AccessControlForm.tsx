"use client";

import * as React from "react";
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
import { Search, Plus, Trash2, AlertCircle } from "lucide-react";
import type { Link, Permission } from "@/lib/database/schemas";

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
      <div className="flex gap-2">
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
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Email section */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{permission.email}</p>
            {isOwner && (
              <Badge variant="secondary" className="mt-1">
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
 * Empty state when no permissions exist (besides owner)
 */
const EmptyState = React.memo<{ isPublic: boolean }>(({ isPublic }) => {
  return (
    <Card className="p-8">
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
  // Local state for UI only
  const [searchQuery, setSearchQuery] = React.useState("");
  const [newEmail, setNewEmail] = React.useState("");
  const [newRole, setNewRole] = React.useState<string>("uploader");
  const [inputError, setInputError] = React.useState<string>("");

  // Mock permissions data (will be replaced with actual data)
  const mockPermissions: Permission[] = [
    {
      id: "1",
      linkId: link?.id || "",
      email: ownerEmail,
      role: "owner",
      isVerified: "true",
      verifiedAt: new Date(),
      lastActivityAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Filter permissions based on search query
  const filteredPermissions = React.useMemo(() => {
    if (!searchQuery.trim()) return mockPermissions;
    const query = searchQuery.toLowerCase();
    return mockPermissions.filter((p) =>
      p.email.toLowerCase().includes(query)
    );
  }, [searchQuery, mockPermissions]);

  // Handler functions (UI only for now)
  const handleAddEmail = () => {
    if (!newEmail.trim()) {
      setInputError("Email is required");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setInputError("Please enter a valid email address");
      return;
    }

    // TODO: Wire up backend logic
    console.log("Adding email:", { email: newEmail, role: newRole });

    // Reset form
    setNewEmail("");
    setNewRole("uploader");
    setInputError("");
  };

  const handleRoleChange = (email: string, role: string) => {
    // TODO: Wire up backend logic
    console.log("Changing role:", { email, role });
  };

  const handleRemove = (email: string) => {
    // TODO: Wire up backend logic
    console.log("Removing permission:", { email });
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

  const hasNonOwnerPermissions = filteredPermissions.length > 1;

  return (
    <div className="space-y-6">
      {/* Link type info */}
      <div className="flex items-center gap-2">
        <Badge variant={link.isPublic ? "success" : "secondary"}>
          {link.isPublic ? "Public Link" : "Private Link"}
        </Badge>
        <p className="text-sm text-muted-foreground">
          {link.isPublic
            ? "Anyone can upload. New uploaders are automatically added to this list."
            : "Only listed emails can upload files."}
        </p>
      </div>

      {/* Search bar */}
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      {/* Add email input */}
      <AddEmailInput
        email={newEmail}
        role={newRole}
        onEmailChange={setNewEmail}
        onRoleChange={setNewRole}
        onAdd={handleAddEmail}
        error={inputError}
      />

      {/* Permissions list */}
      {hasNonOwnerPermissions ? (
        <PermissionsListSection
          permissions={filteredPermissions}
          ownerEmail={ownerEmail}
          onRoleChange={handleRoleChange}
          onRemove={handleRemove}
        />
      ) : (
        <EmptyState isPublic={link.isPublic} />
      )}
    </div>
  );
}
