"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUserLinks } from "@/hooks";
import { useModalState } from "@/hooks";
import { LinksSkeleton } from "../ui/LinksSkeleton";
import { LinkCard } from "../ui/LinkCard";
import {
  LinkManagementModal,
  CreateLinkModal,
  AccessControlModal,
} from "../modals";
import { LinksManagementBar } from "../sections/LinksManagementBar";
import type { Link } from "@/lib/database/schemas";

export function UserLinks() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: links, isLoading, error } = useUserLinks();
  const linkSettingsModal = useModalState<Link>();
  const createLinkModal = useModalState<void>();
  const permissionsModal = useModalState<Link>();

  // Handle opening modal from query parameter (e.g., from workspace folder context menu)
  React.useEffect(() => {
    const linkId = searchParams.get('id');

    // Only proceed if we have a link ID and links are loaded
    if (linkId && links && links.length > 0 && !linkSettingsModal.isOpen) {
      // Find the link with the matching ID
      const targetLink = links.find(link => link.id === linkId);

      if (targetLink) {
        // Open the management modal for this link
        linkSettingsModal.open(targetLink);

        // Clear the query parameter to avoid reopening on refresh
        router.replace('/dashboard/links', { scroll: false });
      }
    }
  }, [searchParams, links, linkSettingsModal, router]);

  const handleOpenSettings = (link: Link) => {
    linkSettingsModal.open(link);
  };

  const handleOpenPermissions = (link: Link) => {
    // Close settings modal if open
    linkSettingsModal.close();
    // Open permissions modal
    permissionsModal.open(link);
  };

  const handleCreateLink = () => {
    createLinkModal.open(undefined);
  };

  // Render main content based on state
  const renderContent = () => {
    if (isLoading) {
      return <LinksSkeleton />;
    }

    if (error) {
      return (
        <div className="p-6">
          <div className="text-destructive">
            Error loading links: {error.message}
          </div>
        </div>
      );
    }

    if (!links || links.length === 0) {
      return (
        <div className="p-6 pb-32">
          <h1 className="text-2xl font-semibold mb-4">Your Links</h1>
          <p className="text-muted-foreground">
            No links yet. Create your first link to get started.
          </p>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-6 pb-32">
        <h1 className="text-2xl font-semibold">Your Links</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {links.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              onOpenSettings={() => handleOpenSettings(link)}
              onOpenPermissions={() => handleOpenPermissions(link)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Main content with bottom padding for fixed bar */}
      {renderContent()}
      {/* Management Bar - Always render */}
      <LinksManagementBar onCreateLink={handleCreateLink} />
      {/* Modals - Always render */}
      <LinkManagementModal
        link={linkSettingsModal.data}
        isOpen={linkSettingsModal.isOpen}
        onOpenChange={(open) => !open && linkSettingsModal.close()}
        onOpenAccessControl={() =>
          linkSettingsModal.data &&
          handleOpenPermissions(linkSettingsModal.data)
        }
      />
      <AccessControlModal
        link={permissionsModal.data}
        isOpen={permissionsModal.isOpen}
        onOpenChange={(open) => !open && permissionsModal.close()}
      />
      <CreateLinkModal
        isOpen={createLinkModal.isOpen}
        onOpenChange={(open) => !open && createLinkModal.close()}
      />
    </>
  );
}
