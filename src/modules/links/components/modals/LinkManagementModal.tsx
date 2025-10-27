"use client";

import * as React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from "@/components/ui/animateui";
import { LinkManagementForm } from "../forms/LinkManagementForm";
import type { Link } from "@/lib/database/schemas";

// =============================================================================
// TYPES
// =============================================================================

export interface LinkManagementModalProps {
  link: Link | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenAccessControl?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function LinkManagementModal({
  link,
  isOpen,
  onOpenChange,
  onOpenAccessControl,
}: LinkManagementModalProps) {
  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleSuccess = () => {
    // Close modal on successful update
    onOpenChange(false);
  };

  if (!link) return null;

  return (
    <Modal open={isOpen} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-2xl gap-4">
        <ModalHeader>
          <ModalTitle>{link.name}</ModalTitle>
          <ModalDescription>
            View and manage your link settings and branding
          </ModalDescription>
        </ModalHeader>

        <LinkManagementForm
          link={link}
          onCancel={handleCancel}
          onSuccess={handleSuccess}
          onOpenAccessControl={onOpenAccessControl}
        />
      </ModalContent>
    </Modal>
  );
}
