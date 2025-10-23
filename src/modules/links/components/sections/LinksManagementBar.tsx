'use client';

import { ManagementBar } from '@/components/ui/animateui';
import { Plus } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface LinksManagementBarProps {
  onCreateLink?: () => void;
  // Future: Add props for bulk actions when needed
  // selectedLinks?: string[];
  // onDelete?: (ids: string[]) => void;
  // onEdit?: (id: string) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function LinksManagementBar({ onCreateLink }: LinksManagementBarProps) {
  const handleCreateLink = () => {
    if (onCreateLink) {
      onCreateLink();
    } else {
      // TODO: Implement create link modal
      console.log('Create link clicked');
    }
  };

  return (
    <div className="fixed bottom-6 left-0 right-0 z-40 pointer-events-none">
      <div className="pointer-events-auto">
        <ManagementBar
          primaryAction={{
            icon: Plus,
            label: 'Create Link',
            onClick: handleCreateLink,
            variant: 'primary',
          }}
          // Future: Add actions for bulk operations
          // actions={selectedLinks.length > 0 ? [
          //   { id: 'delete', icon: Trash2, label: 'Delete', onClick: handleDelete, variant: 'danger' }
          // ] : []}
        />
      </div>
    </div>
  );
}
