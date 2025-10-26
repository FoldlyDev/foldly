"use client";

import * as React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from "@/components/ui/animateui";
import { CreateLinkForm } from "../forms/CreateLinkForm";

// =============================================================================
// TYPES
// =============================================================================

export interface CreateLinkModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CreateLinkModal({
  isOpen,
  onOpenChange,
}: CreateLinkModalProps) {
  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleSuccess = () => {
    // Close modal on successful link creation
    onOpenChange(false);
  };

  return (
    <Modal open={isOpen} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-2xl gap-4">
        <ModalHeader>
          <ModalTitle>Create new link</ModalTitle>
          <ModalDescription>
            Just fill out the basic settings and you're good to go! Everything
            else is optional
          </ModalDescription>
        </ModalHeader>

        <CreateLinkForm
          onCancel={handleCancel}
          onSuccess={handleSuccess}
        />
      </ModalContent>
    </Modal>
  );
}
