"use client";

import * as React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from "@/components/ui/animateui";
import type { Link } from "@/lib/database/schemas";

// =============================================================================
// TYPES
// =============================================================================

export interface AccessControlModalProps {
  link: Link | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function AccessControlModal({
  link,
  isOpen,
  onOpenChange,
}: AccessControlModalProps) {
  if (!link) return null;

  return (
    <Modal open={isOpen} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-2xl gap-4">
        <ModalHeader>
          <ModalTitle>Access Control</ModalTitle>
          <ModalDescription>
            Manage who can access {link.name} and their permissions
          </ModalDescription>
        </ModalHeader>

        {/* Placeholder content - will be replaced with access control form */}
        <div className="p-8 text-center text-muted-foreground">
          <p>Access control form coming soon...</p>
        </div>
      </ModalContent>
    </Modal>
  );
}
