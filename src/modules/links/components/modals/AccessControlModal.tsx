"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from "@/components/ui/animateui";
import { AccessControlForm } from "../forms/AccessControlForm";
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
  const { user } = useUser();

  if (!link) return null;

  const ownerEmail = user?.primaryEmailAddress?.emailAddress || "";

  return (
    <Modal open={isOpen} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-2xl gap-4">
        <ModalHeader>
          <ModalTitle>Access Control</ModalTitle>
          <ModalDescription>
            Manage who can access {link.name} and their permissions
          </ModalDescription>
        </ModalHeader>

        <AccessControlForm link={link} ownerEmail={ownerEmail} />
      </ModalContent>
    </Modal>
  );
}
