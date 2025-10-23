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

  const handleSubmit = (data: any) => {
    // TODO: Handle form submission
    console.log("Form data:", data);
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
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={false}
        />
      </ModalContent>
    </Modal>
  );
}
