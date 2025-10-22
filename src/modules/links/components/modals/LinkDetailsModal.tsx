'use client';

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '@/components/ui/animateui/dialog';
import type { Link } from '@/lib/database/schemas';

interface LinkDetailsModalProps {
  link: Link | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LinkDetailsModal({
  link,
  isOpen,
  onOpenChange,
}: LinkDetailsModalProps) {
  if (!link) return null;

  return (
    <Modal open={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{link.name}</ModalTitle>
          <ModalDescription>
            View and manage your link details
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-6">
          {/* Link URL */}
          <div>
            <p className="text-sm font-medium mb-1">Link URL</p>
            <p className="text-sm text-muted-foreground font-mono">
              /{link.slug}
            </p>
          </div>

          {/* Status */}
          <div>
            <p className="text-sm font-medium mb-1">Status</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {link.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                {link.isPublic ? 'Public' : 'Private'}
              </span>
            </div>
          </div>

          {/* Custom Message */}
          {link.linkConfig.customMessage && (
            <div>
              <p className="text-sm font-medium mb-1">Description</p>
              <p className="text-sm text-muted-foreground">
                {link.linkConfig.customMessage}
              </p>
            </div>
          )}

          {/* Configuration */}
          <div>
            <p className="text-sm font-medium mb-2">Settings</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Notify on upload</span>
                <span>{link.linkConfig.notifyOnUpload ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Requires name</span>
                <span>{link.linkConfig.requiresName ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          {/* Branding */}
          {link.branding?.enabled && (
            <div>
              <p className="text-sm font-medium mb-2">Branding</p>
              <div className="space-y-2">
                {link.branding.logo?.url && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Logo</span>
                    <span className="text-xs text-primary">Enabled</span>
                  </div>
                )}
                {link.branding.colors && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Custom colors</span>
                    <div className="flex gap-1">
                      {link.branding.colors.accentColor && (
                        <div
                          className="size-4 rounded border"
                          style={{ backgroundColor: link.branding.colors.accentColor }}
                        />
                      )}
                      {link.branding.colors.backgroundColor && (
                        <div
                          className="size-4 rounded border"
                          style={{ backgroundColor: link.branding.colors.backgroundColor }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <p className="font-medium mb-1">Created</p>
                <p>{new Date(link.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="font-medium mb-1">Updated</p>
                <p>{new Date(link.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
